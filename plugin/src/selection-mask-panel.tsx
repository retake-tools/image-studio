import React, {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type PointerEvent,
  type ReactElement,
} from 'react';
import {
  defineMessages,
  PluginPanelProps as PluginPanelPropsV2,
} from '@retake/plugin-api';
import { selectionMaskPanelStore } from './panel-store';
import { exactSourceImage } from './plugin-assets';
import {
  drawSelectionOverlay,
  normalizedSelectionPoint,
  renderSelectionMask,
  selectionMaskHasContent,
  validateSelectionMaskDimensions,
  type SelectionMaskDimensions,
  type SelectionMaskState,
  type SelectionMaskStroke,
  type SelectionMaskTool,
} from './selection-mask';
import { imageStudioStyles } from './styles';
import { usePluginTranslator } from './localization';

const capabilityId = 'image.local_selection_mask';
const resultSlotId = 'selection_mask';

interface ActiveStroke {
  readonly pointerId: number;
  readonly strokeIndex: number;
}

export function ImageStudioSelectionMaskPanel({
  host,
}: PluginPanelPropsV2): ReactElement | null {
  const panel = useSyncExternalStore(
    selectionMaskPanelStore.subscribe,
    selectionMaskPanelStore.getSnapshot,
    selectionMaskPanelStore.getSnapshot,
  );
  const hostSnapshot = useSyncExternalStore(
    host.subscribeReadSnapshot,
    host.getReadSnapshot,
    host.getReadSnapshot,
  );
  const [brushSize, setBrushSize] = useState(64);
  const [dimensions, setDimensions] = useState<SelectionMaskDimensions | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const [inverted, setInverted] = useState(false);
  const [pending, setPending] = useState(false);
  const [redoStrokes, setRedoStrokes] = useState<SelectionMaskStroke[]>([]);
  const [strokes, setStrokes] = useState<SelectionMaskStroke[]>([]);
  const [tool, setTool] = useState<SelectionMaskTool>('select');
  const activeStrokeRef = useRef<ActiveStroke | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const block = panel.block;
  const asset = block ? host.assets.getBound(block.assetId) : null;
  const assetId = asset?.assetId ?? block?.assetId;
  const blockId = block?.blockId;
  const blockIsBound = blockId
    ? hostSnapshot.boundBlockIds.includes(blockId)
    : false;
  const translator = usePluginTranslator(host, selectionMaskMessages);
  const copy = localizedSelectionMaskCopy(translator);
  const maskState: SelectionMaskState = { inverted, strokes };

  useEffect(() => {
    setBrushSize(64);
    setDimensions(null);
    setError(null);
    setInverted(false);
    setPending(false);
    setRedoStrokes([]);
    setStrokes([]);
    setTool('select');
  }, [assetId, blockId]);

  useEffect(() => {
    if (blockId && !pending && !blockIsBound) {
      selectionMaskPanelStore.close();
    }
  }, [blockId, blockIsBound, pending]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const redraw = () => {
      const bounds = canvas.getBoundingClientRect();
      const ratio = window.devicePixelRatio || 1;
      const width = Math.max(1, Math.round(bounds.width * ratio));
      const height = Math.max(1, Math.round(bounds.height * ratio));
      if (canvas.width !== width) canvas.width = width;
      if (canvas.height !== height) canvas.height = height;
      const context = canvas.getContext('2d');
      if (!context) return;
      drawSelectionOverlay(context, { height, width }, maskState);
    };
    redraw();
    const observer = new ResizeObserver(redraw);
    observer.observe(canvas);
    return () => observer.disconnect();
  }, [inverted, strokes]);

  if (!block) return null;
  const sourceUrl = asset?.previewUrl ?? block.previewUrl;
  const sourceWidth = validDimension(asset?.width);
  const sourceHeight = validDimension(asset?.height);

  async function run(): Promise<void> {
    if (
      !block
      || !dimensions
      || !selectionMaskHasContent(maskState)
      || pending
    ) {
      return;
    }
    setError(null);
    setPending(true);
    try {
      validateSelectionMaskDimensions(dimensions);
      await host.execution.run({
        capabilityId,
        inputBlockIds: [block.blockId],
        parameters: {
          inverted,
          maskEncoding: 'grayscale_white_selected_v1',
          sourceHeight: dimensions.height,
          sourceWidth: dimensions.width,
          strokeCount: strokes.length,
        },
        async execute({ assets, signal }) {
          exactSourceImage(assets);
          const rendered = await renderSelectionMask(
            dimensions,
            maskState,
            signal,
          );
          return {
            images: [{
              dataUrl: rendered.dataUrl,
              fileName: `selection-mask-${block.blockId}.png`,
              height: rendered.height,
              slotId: resultSlotId,
              width: rendered.width,
            }],
          };
        },
      });
      selectionMaskPanelStore.close();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : copy.failed);
      setPending(false);
    }
  }

  function beginStroke(event: PointerEvent<HTMLCanvasElement>): void {
    if (!dimensions || pending) return;
    event.preventDefault();
    const point = pointFromEvent(event);
    const scale = Math.min(dimensions.width, dimensions.height);
    const stroke: SelectionMaskStroke = {
      diameter: brushSize / scale,
      points: [point],
      tool,
    };
    setRedoStrokes([]);
    setStrokes((current) => {
      activeStrokeRef.current = {
        pointerId: event.pointerId,
        strokeIndex: current.length,
      };
      return [...current, stroke];
    });
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      // Synthetic pointer events may not own an active browser pointer.
    }
  }

  function extendStroke(event: PointerEvent<HTMLCanvasElement>): void {
    const active = activeStrokeRef.current;
    if (!active || active.pointerId !== event.pointerId) return;
    const point = pointFromEvent(event);
    setStrokes((current) => current.map((stroke, index) => (
      index === active.strokeIndex
        ? { ...stroke, points: [...stroke.points, point] }
        : stroke
    )));
  }

  function endStroke(event: PointerEvent<HTMLCanvasElement>): void {
    if (activeStrokeRef.current?.pointerId !== event.pointerId) return;
    activeStrokeRef.current = null;
    try {
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
    } catch {
      // The browser can release capture before pointercancel reaches React.
    }
  }

  function undo(): void {
    setStrokes((current) => {
      const previous = current.at(-1);
      if (!previous) return current;
      setRedoStrokes((redo) => [...redo, previous]);
      return current.slice(0, -1);
    });
  }

  function redo(): void {
    setRedoStrokes((current) => {
      const next = current.at(-1);
      if (!next) return current;
      setStrokes((history) => [...history, next]);
      return current.slice(0, -1);
    });
  }

  return (
    <>
      <style>{imageStudioStyles}</style>
      <section
        aria-label={copy.title}
        className="retake-image-studio-panel is-selection-mask"
        data-retake-image-studio="selection-mask"
      >
        <header className="retake-image-studio-panel__header">
          <div>
            <span>Image Studio</span>
            <h2>{copy.title}</h2>
          </div>
          <button
            aria-label={copy.close}
            className="retake-image-studio-panel__close"
            disabled={pending}
            onClick={() => selectionMaskPanelStore.close()}
            type="button"
          >
            ×
          </button>
        </header>
        {sourceUrl ? (
          <div className="retake-image-studio-mask-stage">
            <div className="retake-image-studio-mask-media">
              <img
                alt={block.title}
                onLoad={(event) => {
                  const next = {
                    height: sourceHeight ?? event.currentTarget.naturalHeight,
                    width: sourceWidth ?? event.currentTarget.naturalWidth,
                  };
                  try {
                    setDimensions(validateSelectionMaskDimensions(next));
                    setError(null);
                  } catch (cause) {
                    setDimensions(null);
                    setError(cause instanceof Error ? cause.message : copy.failed);
                  }
                }}
                src={sourceUrl}
              />
              <canvas
                aria-label={copy.canvas}
                className={`retake-image-studio-mask-canvas is-${tool}`}
                onPointerCancel={endStroke}
                onPointerDown={beginStroke}
                onPointerMove={extendStroke}
                onPointerUp={endStroke}
                ref={canvasRef}
              />
            </div>
          </div>
        ) : (
          <p className="retake-image-studio-panel__error">
            {copy.sourceUnavailable}
          </p>
        )}
        <div className="retake-image-studio-mask-toolbar">
          <div aria-label={copy.tool} className="retake-image-studio-segmented">
            <button
              aria-pressed={tool === 'select'}
              className={tool === 'select' ? 'is-active' : undefined}
              disabled={pending}
              onClick={() => setTool('select')}
              type="button"
            >
              {copy.select}
            </button>
            <button
              aria-pressed={tool === 'erase'}
              className={tool === 'erase' ? 'is-active' : undefined}
              disabled={pending}
              onClick={() => setTool('erase')}
              type="button"
            >
              {copy.erase}
            </button>
          </div>
          <div className="retake-image-studio-mask-history">
            <button disabled={pending || strokes.length === 0} onClick={undo} type="button">
              {copy.undo}
            </button>
            <button disabled={pending || redoStrokes.length === 0} onClick={redo} type="button">
              {copy.redo}
            </button>
          </div>
        </div>
        <label className="retake-image-studio-mask-size">
          <span>{copy.brushSize}</span>
          <input
            disabled={pending}
            max={256}
            min={4}
            onChange={(event) => setBrushSize(Number(event.target.value))}
            step={2}
            type="range"
            value={brushSize}
          />
          <output>{brushSize}px</output>
        </label>
        <div className="retake-image-studio-mask-actions">
          <button
            disabled={pending}
            onClick={() => setInverted((current) => !current)}
            type="button"
          >
            {copy.invert}
          </button>
          <button
            disabled={pending || (strokes.length === 0 && !inverted)}
            onClick={() => {
              setInverted(false);
              setRedoStrokes([]);
              setStrokes([]);
            }}
            type="button"
          >
            {copy.clear}
          </button>
        </div>
        <p className="retake-image-studio-crop-hint">{copy.hint}</p>
        {dimensions ? (
          <div className="retake-image-studio-crop-output">
            <span>{copy.output}</span>
            <strong>{dimensions.width} × {dimensions.height} PNG</strong>
          </div>
        ) : null}
        {error ? (
          <p className="retake-image-studio-panel__error" role="alert">
            {error}
          </p>
        ) : null}
        <button
          className="retake-image-studio-panel__run"
          disabled={
            pending
            || !dimensions
            || !selectionMaskHasContent(maskState)
          }
          onClick={() => {
            void run();
          }}
          type="button"
        >
          {pending ? copy.running : copy.run}
        </button>
      </section>
    </>
  );
}

function pointFromEvent(
  event: PointerEvent<HTMLCanvasElement>,
): ReturnType<typeof normalizedSelectionPoint> {
  const bounds = event.currentTarget.getBoundingClientRect();
  return normalizedSelectionPoint(
    (event.clientX - bounds.left) / bounds.width,
    (event.clientY - bounds.top) / bounds.height,
  );
}

function validDimension(value: number | undefined): number | null {
  return typeof value === 'number'
    && Number.isInteger(value)
    && value > 0
    ? value
    : null;
}

const selectionMaskMessages = defineMessages({
  brushSize: localized('Brush size', '画笔大小'),
  canvas: localized('Selection mask canvas', '选区蒙版画布'),
  clear: localized('Clear', '清空'),
  close: localized('Close', '关闭'),
  erase: localized('Erase selection', '擦除选区'),
  failed: localized('Selection mask generation failed', '选区蒙版生成失败'),
  hint: localized(
    'Teal areas become the mask. Output is a source-sized PNG: white is selected and black is unselected.',
    '青色区域会写入蒙版。输出为与原图等大的 PNG：白色代表选中，黑色代表未选。',
  ),
  invert: localized('Invert', '反选'),
  output: localized('Mask output', '蒙版输出'),
  redo: localized('Redo', '重做'),
  run: localized('Create mask', '创建蒙版'),
  running: localized('Creating…', '生成中…'),
  select: localized('Add selection', '添加选区'),
  sourceUnavailable: localized(
    'The source image is no longer available to the plugin.',
    '当前图片已不在插件可访问范围内。',
  ),
  title: localized('Create selection mask', '创建选区蒙版'),
  tool: localized('Selection tool', '选区工具'),
  undo: localized('Undo', '撤销'),
});

function localizedSelectionMaskCopy(translator: {
  t(messageId: keyof typeof selectionMaskMessages): string;
}) {
  return Object.fromEntries(
    Object.keys(selectionMaskMessages).map((messageId) => [
      messageId,
      translator.t(messageId as keyof typeof selectionMaskMessages),
    ]),
  ) as Record<keyof typeof selectionMaskMessages, string>;
}

function localized(english: string, chinese: string) {
  return { default: english, locales: { 'zh-CN': chinese } };
}
