import React, {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type KeyboardEvent,
  type PointerEvent,
  type ReactElement,
} from 'react';
import type {
  PluginPanelPropsV2,
} from './contracts';
import {
  cropOutputGeometry,
  cropRegionCenter,
  cropRegionForPreset,
  isFullImageCrop,
  renderCroppedImage,
  type CropAspectPreset,
  type ImageDimensions,
} from './image-crop';
import { cropPanelStore } from './panel-store';
import { exactSourceImage } from './plugin-assets';
import { imageStudioStyles } from './styles';
import { isChineseLocale, usePluginEnvironment } from './localization';

const capabilityId = 'image.local_crop';
const resultSlotId = 'result_image';
const aspectPresets: readonly CropAspectPreset[] = [
  'original',
  '1:1',
  '4:3',
  '3:4',
  '16:9',
  '9:16',
];

interface DragState {
  readonly bounds: DOMRect;
  readonly centerX: number;
  readonly centerY: number;
  readonly pointerId: number;
  readonly startX: number;
  readonly startY: number;
}

export function ImageStudioCropPanel({
  host,
}: PluginPanelPropsV2): ReactElement | null {
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
  const environment = usePluginEnvironment(host);
  const copy = localizedCropCopy(environment.locale);
  const [center, setCenter] = useState({ x: 0.5, y: 0.5 });
  const [dimensions, setDimensions] = useState<ImageDimensions | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [preset, setPreset] = useState<CropAspectPreset>('original');
  const [scalePercent, setScalePercent] = useState(100);
  const dragRef = useRef<DragState | null>(null);
  const block = panel.block;
  const asset = block ? host.assets.getBound(block.assetId) : null;
  const assetId = asset?.assetId ?? block?.assetId;
  const assetWidth = validDimension(asset?.width);
  const assetHeight = validDimension(asset?.height);
  const blockId = block?.blockId;
  const blockIsBound = blockId
    ? hostSnapshot.boundBlockIds.includes(blockId)
    : false;

  useEffect(() => {
    setCenter({ x: 0.5, y: 0.5 });
    setDimensions(
      assetWidth && assetHeight
        ? { height: assetHeight, width: assetWidth }
        : null,
    );
    setError(null);
    setPending(false);
    setPreset('original');
    setScalePercent(100);
  }, [assetHeight, assetId, assetWidth, blockId]);

  useEffect(() => {
    if (blockId && !pending && !blockIsBound) {
      cropPanelStore.close();
    }
  }, [blockId, blockIsBound, pending]);

  if (!block) return null;
  const sourceUrl = asset?.previewUrl ?? block.previewUrl;
  const region = dimensions
    ? cropRegionForPreset({
        centerX: center.x,
        centerY: center.y,
        dimensions,
        preset,
        scale: scalePercent / 100,
      })
    : null;
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

  function beginDrag(event: PointerEvent<HTMLDivElement>): void {
    if (!region || pending) return;
    const bounds = event.currentTarget.parentElement?.getBoundingClientRect();
    if (!bounds || bounds.width <= 0 || bounds.height <= 0) return;
    const regionCenter = cropRegionCenter(region);
    dragRef.current = {
      bounds,
      centerX: regionCenter.x,
      centerY: regionCenter.y,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function drag(event: PointerEvent<HTMLDivElement>): void {
    const state = dragRef.current;
    if (!state || state.pointerId !== event.pointerId) return;
    setCenter({
      x: state.centerX + (event.clientX - state.startX) / state.bounds.width,
      y: state.centerY + (event.clientY - state.startY) / state.bounds.height,
    });
  }

  function endDrag(event: PointerEvent<HTMLDivElement>): void {
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
    setCenter((current) => ({
      x: current.x + delta.x,
      y: current.y + delta.y,
    }));
  }

  return (
    <>
      <style>{imageStudioStyles}</style>
      <section
        aria-label={copy.title}
        className="retake-image-studio-panel"
        data-retake-image-studio="crop"
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
            onClick={() => cropPanelStore.close()}
            type="button"
          >
            ×
          </button>
        </header>
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
                  <i />
                  <i />
                  <i />
                  <i />
                </div>
              ) : null}
            </div>
          </div>
        ) : (
          <p className="retake-image-studio-panel__error">
            {copy.sourceUnavailable}
          </p>
        )}
        <label className="retake-image-studio-field">
          <span>{copy.aspectRatio}</span>
          <select
            disabled={pending}
            onChange={(event) => {
              setPreset(event.target.value as CropAspectPreset);
              setCenter({ x: 0.5, y: 0.5 });
              setScalePercent(100);
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
        <div className="retake-image-studio-range is-crop">
          <span>{copy.cropSize}</span>
          <button
            aria-label={copy.decreaseCropSize}
            disabled={pending || scalePercent <= 20}
            onClick={() => setScalePercent((current) => (
              Math.max(20, current - 5)
            ))}
            type="button"
          >
            −
          </button>
          <input
            aria-label={copy.cropSize}
            disabled={pending}
            max={100}
            min={20}
            onChange={(event) => setScalePercent(Number(event.target.value))}
            step={1}
            type="range"
            value={scalePercent}
          />
          <button
            aria-label={copy.increaseCropSize}
            disabled={pending || scalePercent >= 100}
            onClick={() => setScalePercent((current) => (
              Math.min(100, current + 5)
            ))}
            type="button"
          >
            +
          </button>
          <output>{scalePercent}%</output>
        </div>
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
      </section>
    </>
  );
}

function localizedCropCopy(locale: string): {
  aspectRatio: string;
  close: string;
  cropArea: string;
  cropSize: string;
  decreaseCropSize: string;
  failed: string;
  increaseCropSize: string;
  original: string;
  output: string;
  positionHint: string;
  run: string;
  running: string;
  sourceUnavailable: string;
  title: string;
} {
  if (isChineseLocale(locale)) {
    return {
      aspectRatio: '画面比例',
      close: '关闭',
      cropArea: '裁剪区域，可拖动或使用方向键定位',
      cropSize: '裁剪范围',
      decreaseCropSize: '缩小裁剪范围',
      failed: '图片裁剪失败',
      increaseCropSize: '扩大裁剪范围',
      original: '原图比例',
      output: '输出尺寸',
      positionHint: '拖动裁剪框定位；方向键微调，Shift + 方向键快速移动。',
      run: '应用裁剪',
      running: '处理中…',
      sourceUnavailable: '当前图片已不在插件可访问范围内。',
      title: '裁剪图片',
    };
  }
  return {
    aspectRatio: 'Aspect ratio',
    close: 'Close',
    cropArea: 'Crop area; drag or use arrow keys to position',
    cropSize: 'Crop size',
    decreaseCropSize: 'Decrease crop size',
    failed: 'Image crop failed',
    increaseCropSize: 'Increase crop size',
    original: 'Original',
    output: 'Output size',
    positionHint: 'Drag to position. Use arrow keys for fine movement and Shift + arrow keys for larger steps.',
    run: 'Apply crop',
    running: 'Processing…',
    sourceUnavailable: 'The source image is no longer available to the plugin.',
    title: 'Crop image',
  };
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
