import React, {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type KeyboardEvent,
  type PointerEvent,
  type ReactElement,
} from 'react';
import {
  defineMessages,
} from '@retake/plugin-api';
import {
  cropOutputGeometry,
  cropRegionForPreset,
  isFullImageCrop,
  moveCropRegion,
  renderCroppedImage,
  resizeCropRegion,
  type CropAspectPreset,
  type CropResizeHandle,
  type ImageDimensions,
  type NormalizedCropRegion,
} from './image-crop';
import { cropPanelStore } from './panel-store';
import { exactSourceImage } from './plugin-assets';
import { imageStudioStyles } from './styles';
import { usePluginTranslator } from './localization';
import {
  imageStudioPanelClassName,
  type ImageStudioPanelProps,
  useImageStudioPanelEscape,
} from './panel-presentation';

const capabilityId = 'image.local_crop';
const resultSlotId = 'result_image';
const defaultCropScale = 0.9;
const aspectPresets: readonly CropAspectPreset[] = [
  'original',
  '1:1',
  '4:3',
  '3:4',
  '16:9',
  '9:16',
];

type CropDragMode = 'move' | CropResizeHandle;

interface DragState {
  readonly bounds: DOMRect;
  readonly mode: CropDragMode;
  readonly pointerId: number;
  readonly region: NormalizedCropRegion;
  readonly startX: number;
  readonly startY: number;
}

export function ImageStudioCropPanel({
  host,
  presentation,
}: ImageStudioPanelProps): ReactElement | null {
  const panel = useSyncExternalStore(
    cropPanelStore.subscribe,
    cropPanelStore.getSnapshot,
    cropPanelStore.getSnapshot,
  );
  const hostSnapshot = useSyncExternalStore(
    host.subscribeReadSnapshot,
    host.getReadSnapshot,
    host.getReadSnapshot,
  );
  const translator = usePluginTranslator(host, cropMessages);
  const copy = localizedCropCopy(translator);
  const [dimensions, setDimensions] = useState<ImageDimensions | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [preset, setPreset] = useState<CropAspectPreset>('original');
  const [regionOverride, setRegionOverride] =
    useState<NormalizedCropRegion | null>(null);
  const dragRef = useRef<DragState | null>(null);
  const block = panel.block;
  useImageStudioPanelEscape({
    active: Boolean(block),
    disabled: pending,
    onClose: cropPanelStore.close,
  });
  const asset = block ? host.assets.getBound(block.assetId) : null;
  const assetId = asset?.assetId ?? block?.assetId;
  const assetWidth = validDimension(asset?.width);
  const assetHeight = validDimension(asset?.height);
  const blockId = block?.blockId;
  const blockIsBound = blockId
    ? hostSnapshot.boundBlockIds.includes(blockId)
    : false;

  useEffect(() => {
    setDimensions(
      assetWidth && assetHeight
        ? { height: assetHeight, width: assetWidth }
        : null,
    );
    setError(null);
    setPending(false);
    setPreset('original');
    setRegionOverride(null);
  }, [assetHeight, assetId, assetWidth, blockId]);

  useEffect(() => {
    if (blockId && !pending && !blockIsBound) {
      cropPanelStore.close();
    }
  }, [blockId, blockIsBound, pending]);

  if (!block) return null;
  const sourceUrl = asset?.previewUrl ?? block.previewUrl;
  const region = regionOverride ?? (dimensions
    ? cropRegionForPreset({
        dimensions,
        preset,
        scale: defaultCropScale,
      })
    : null);
  const output = dimensions && region
    ? cropOutputGeometry(dimensions, region)
    : null;

  async function run(): Promise<void> {
    if (!block || !sourceUrl || !dimensions || !region || !output || pending) {
      return;
    }
    setError(null);
    setPending(true);
    const parameters = {
      aspectPreset: preset,
      height: rounded(region.height),
      outputHeight: output.height,
      outputWidth: output.width,
      sourceHeight: dimensions.height,
      sourceWidth: dimensions.width,
      width: rounded(region.width),
      x: rounded(region.x),
      y: rounded(region.y),
    };
    try {
      await host.execution.run({
        capabilityId,
        inputBlockIds: [block.blockId],
        parameters,
        async execute({ assets, signal }) {
          const source = exactSourceImage(assets);
          const rendered = await renderCroppedImage(
            source.previewUrl,
            parameters,
            signal,
          );
          return {
            images: [{
              dataUrl: rendered.dataUrl,
              fileName: `cropped-${block.blockId}.png`,
              height: rendered.height,
              slotId: resultSlotId,
              width: rendered.width,
            }],
          };
        },
      });
      cropPanelStore.close();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : copy.failed);
      setPending(false);
    }
  }

  function beginDrag(event: PointerEvent<HTMLElement>): void {
    if (!region || pending) return;
    const bounds = event.currentTarget.parentElement?.getBoundingClientRect();
    if (!bounds || bounds.width <= 0 || bounds.height <= 0) return;
    dragRef.current = {
      bounds,
      mode: 'move',
      pointerId: event.pointerId,
      region,
      startX: event.clientX,
      startY: event.clientY,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function beginResize(
    event: PointerEvent<HTMLElement>,
    mode: CropResizeHandle,
  ): void {
    if (!region || pending) return;
    const bounds = event.currentTarget.parentElement?.parentElement
      ?.getBoundingClientRect();
    if (!bounds || bounds.width <= 0 || bounds.height <= 0) return;
    event.preventDefault();
    event.stopPropagation();
    dragRef.current = {
      bounds,
      mode,
      pointerId: event.pointerId,
      region,
      startX: event.clientX,
      startY: event.clientY,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function drag(event: PointerEvent<HTMLElement>): void {
    const state = dragRef.current;
    if (!state || state.pointerId !== event.pointerId) return;
    const deltaX = (event.clientX - state.startX) / state.bounds.width;
    const deltaY = (event.clientY - state.startY) / state.bounds.height;
    setRegionOverride(state.mode === 'move'
      ? moveCropRegion(state.region, deltaX, deltaY)
      : resizeCropRegion(state.region, state.mode, deltaX, deltaY));
  }

  function endDrag(event: PointerEvent<HTMLElement>): void {
    if (dragRef.current?.pointerId !== event.pointerId) return;
    dragRef.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }

  function moveWithKeyboard(event: KeyboardEvent<HTMLDivElement>): void {
    const step = event.shiftKey ? 0.05 : 0.01;
    const delta = {
      ArrowDown: { x: 0, y: step },
      ArrowLeft: { x: -step, y: 0 },
      ArrowRight: { x: step, y: 0 },
      ArrowUp: { x: 0, y: -step },
    }[event.key];
    if (!delta) return;
    event.preventDefault();
    if (!region) return;
    setRegionOverride(moveCropRegion(region, delta.x, delta.y));
  }

  return (
    <>
      <style>{imageStudioStyles}</style>
      <section
        aria-label={copy.title}
        className={imageStudioPanelClassName(
          'retake-image-studio-panel is-editor is-crop',
          presentation,
        )}
        data-retake-image-studio="crop"
      >
        <header className="retake-image-studio-panel__header">
          <h2>{copy.title}</h2>
          <button
            aria-label={copy.close}
            className="retake-image-studio-panel__close"
            disabled={pending}
            onClick={() => cropPanelStore.close()}
            type="button"
          >
            ×
          </button>
        </header>
        <div className="retake-image-studio-editor-body">
          <div className="retake-image-studio-editor-preview">
            {sourceUrl ? (
              <div className="retake-image-studio-crop-stage">
                <div className="retake-image-studio-crop-media">
                  <img
                    alt={block.title}
                    onLoad={(event) => {
                      const next = {
                        height: event.currentTarget.naturalHeight,
                        width: event.currentTarget.naturalWidth,
                      };
                      if (next.width > 0 && next.height > 0) {
                        setDimensions((current) => (
                          current?.width === next.width
                          && current.height === next.height
                            ? current
                            : next
                        ));
                      }
                    }}
                    src={sourceUrl}
                  />
                  {region ? (
                    <div
                      aria-label={copy.cropArea}
                      className="retake-image-studio-crop-frame"
                      onKeyDown={moveWithKeyboard}
                      onPointerCancel={endDrag}
                      onPointerDown={beginDrag}
                      onPointerMove={drag}
                      onPointerUp={endDrag}
                      style={{
                        height: `${region.height * 100}%`,
                        left: `${region.x * 100}%`,
                        top: `${region.y * 100}%`,
                        width: `${region.width * 100}%`,
                      }}
                      tabIndex={pending ? -1 : 0}
                    >
                      {(['nw', 'ne', 'sw', 'se'] as const).map((handle) => (
                        <i
                          aria-label={`${copy.resizeCropArea} ${handle}`}
                          className={`is-${handle}`}
                          key={handle}
                          onPointerDown={(event) => beginResize(event, handle)}
                        />
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>
            ) : (
              <p className="retake-image-studio-panel__error">
                {copy.sourceUnavailable}
              </p>
            )}
          </div>
          <div className="retake-image-studio-editor-controls">
            <label className="retake-image-studio-field">
              <span>{copy.aspectRatio}</span>
              <select
                disabled={pending}
                onChange={(event) => {
                  setPreset(event.target.value as CropAspectPreset);
                  setRegionOverride(null);
                }}
                value={preset}
              >
                {aspectPresets.map((value) => (
                  <option key={value} value={value}>
                    {value === 'original' ? copy.original : value}
                  </option>
                ))}
              </select>
            </label>
            <p className="retake-image-studio-crop-hint">
              {copy.positionHint}
            </p>
            {output ? (
              <div className="retake-image-studio-crop-output">
                <span>{copy.output}</span>
                <strong>{output.width} × {output.height} px</strong>
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
                || !sourceUrl
                || !region
                || !output
                || isFullImageCrop(region)
              }
              onClick={() => {
                void run();
              }}
              type="button"
            >
              {pending ? copy.running : copy.run}
            </button>
          </div>
        </div>
      </section>
    </>
  );
}

const cropMessages = defineMessages({
  aspectRatio: localized('Aspect ratio', '画面比例'),
  close: localized('Close', '关闭'),
  cropArea: localized(
    'Crop area; drag or use arrow keys to position',
    '裁剪区域，可拖动或使用方向键定位',
  ),
  failed: localized('Image crop failed', '图片裁剪失败'),
  original: localized('Original', '原图比例'),
  output: localized('Output size', '输出尺寸'),
  positionHint: localized(
    'Drag inside the frame to position it, or drag a corner to resize. Use arrow keys for fine movement.',
    '拖动裁剪框内部调整位置，拖动四角调整范围；方向键可微调位置。',
  ),
  resizeCropArea: localized('Resize crop area', '调整裁剪范围'),
  run: localized('Apply crop', '应用裁剪'),
  running: localized('Processing…', '处理中…'),
  sourceUnavailable: localized(
    'The source image is no longer available to the plugin.',
    '当前图片已不在插件可访问范围内。',
  ),
  title: localized('Crop image', '裁剪图片'),
});

function localizedCropCopy(translator: {
  t(messageId: keyof typeof cropMessages): string;
}): {
  aspectRatio: string;
  close: string;
  cropArea: string;
  failed: string;
  original: string;
  output: string;
  positionHint: string;
  resizeCropArea: string;
  run: string;
  running: string;
  sourceUnavailable: string;
  title: string;
} {
  return translateCopy(cropMessages, translator);
}

function translateCopy<const Messages extends Record<string, unknown>>(
  messages: Messages,
  translator: { t(messageId: keyof Messages & string): string },
): Record<keyof Messages, string> {
  return Object.fromEntries(
    Object.keys(messages).map((messageId) => [
      messageId,
      translator.t(messageId as keyof Messages & string),
    ]),
  ) as Record<keyof Messages, string>;
}

function localized(english: string, chinese: string) {
  return { default: english, locales: { 'zh-CN': chinese } };
}

function rounded(value: number): number {
  return Math.round(value * 1_000_000) / 1_000_000;
}

function validDimension(value: number | undefined): number | null {
  return typeof value === 'number'
    && Number.isInteger(value)
    && value > 0
    ? value
    : null;
}
