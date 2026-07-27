import React, {
  useEffect,
  useState,
  useSyncExternalStore,
  type ReactElement,
} from 'react';
import type { PluginPanelPropsV1 } from './contracts';
import {
  defaultImageAdjustments,
  hasImageAdjustments,
  imageAdjustmentFilter,
  renderAdjustedImage,
  type LocalImageAdjustments,
} from './image-adjustments';
import { adjustPanelStore } from './panel-store';
import { exactSourceImage } from './plugin-assets';
import { imageStudioStyles } from './styles';

const capabilityId = 'image.local_adjust';
const resultSlotId = 'result_image';

export function ImageStudioAdjustPanel({
  host,
}: PluginPanelPropsV1): ReactElement | null {
  const panel = useSyncExternalStore(
    adjustPanelStore.subscribe,
    adjustPanelStore.getSnapshot,
    adjustPanelStore.getSnapshot,
  );
  const hostSnapshot = useSyncExternalStore(
    host.subscribeReadSnapshot,
    host.getReadSnapshot,
    host.getReadSnapshot,
  );
  const [adjustments, setAdjustments] = useState(defaultImageAdjustments);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const block = panel.block;
  const blockId = block?.blockId;
  const blockIsBound = blockId
    ? hostSnapshot.boundBlockIds.includes(blockId)
    : false;

  useEffect(() => {
    setAdjustments(defaultImageAdjustments);
    setError(null);
    setPending(false);
  }, [blockId]);

  useEffect(() => {
    if (blockId && !pending && !blockIsBound) {
      adjustPanelStore.close();
    }
  }, [blockId, blockIsBound, pending]);

  if (!block) return null;
  const asset = host.assets.getBound(block.assetId);
  const sourceUrl = asset?.previewUrl ?? block.previewUrl;
  const copy = localizedCopy();

  async function run(): Promise<void> {
    if (!block || !sourceUrl || pending) return;
    setError(null);
    setPending(true);
    const parameters = adjustments;
    try {
      await host.execution.run({
        capabilityId,
        inputBlockIds: [block.blockId],
        parameters: { ...parameters },
        async execute({ assets, signal }) {
          const source = exactSourceImage(assets);
          const rendered = await renderAdjustedImage(
            source.previewUrl,
            parameters,
            signal,
          );
          return {
            images: [{
              dataUrl: rendered.dataUrl,
              fileName: `adjusted-${block.blockId}.png`,
              height: rendered.height,
              slotId: resultSlotId,
              width: rendered.width,
            }],
          };
        },
      });
      adjustPanelStore.close();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : copy.failed);
      setPending(false);
    }
  }

  return (
    <>
      <style>{imageStudioStyles}</style>
      <section
        aria-label={copy.title}
        className="retake-image-studio-panel"
        data-retake-image-studio="adjust"
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
            onClick={() => adjustPanelStore.close()}
            type="button"
          >
            ×
          </button>
        </header>
        {sourceUrl ? (
          <div className="retake-image-studio-preview">
            <img
              alt={block.title}
              src={sourceUrl}
              style={{ filter: imageAdjustmentFilter(adjustments) }}
            />
          </div>
        ) : (
          <p className="retake-image-studio-panel__error">
            {copy.sourceUnavailable}
          </p>
        )}
        <RangeControl
          disabled={pending}
          label={copy.brightness}
          value={adjustments.brightness}
          onChange={(brightness) => {
            setAdjustments((current) => ({ ...current, brightness }));
          }}
        />
        <RangeControl
          disabled={pending}
          label={copy.contrast}
          value={adjustments.contrast}
          onChange={(contrast) => {
            setAdjustments((current) => ({ ...current, contrast }));
          }}
        />
        <RangeControl
          disabled={pending}
          label={copy.saturation}
          value={adjustments.saturation}
          onChange={(saturation) => {
            setAdjustments((current) => ({ ...current, saturation }));
          }}
        />
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
            || !hasImageAdjustments(adjustments)
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

function RangeControl({
  disabled,
  label,
  onChange,
  value,
}: {
  disabled: boolean;
  label: string;
  onChange(value: number): void;
  value: number;
}): ReactElement {
  return (
    <div className="retake-image-studio-range">
      <span>{label}</span>
      <button
        aria-label={`Decrease ${label}`}
        disabled={disabled || value <= -100}
        onClick={() => onChange(Math.max(-100, value - 5))}
        type="button"
      >
        −
      </button>
      <input
        aria-label={label}
        disabled={disabled}
        max={100}
        min={-100}
        onChange={(event) => onChange(Number(event.target.value))}
        step={1}
        type="range"
        value={value}
      />
      <button
        aria-label={`Increase ${label}`}
        disabled={disabled || value >= 100}
        onClick={() => onChange(Math.min(100, value + 5))}
        type="button"
      >
        +
      </button>
      <output>{value > 0 ? `+${value}` : value}</output>
    </div>
  );
}

function localizedCopy(): {
  brightness: string;
  close: string;
  contrast: string;
  failed: string;
  run: string;
  running: string;
  saturation: string;
  sourceUnavailable: string;
  title: string;
} {
  if (navigator.language.toLowerCase().startsWith('zh')) {
    return {
      brightness: '亮度',
      close: '关闭',
      contrast: '对比度',
      failed: '图片处理失败',
      run: '应用调整',
      running: '处理中…',
      saturation: '饱和度',
      sourceUnavailable: '当前图片已不在插件可访问范围内。',
      title: '调整图片',
    };
  }
  return {
    brightness: 'Brightness',
    close: 'Close',
    contrast: 'Contrast',
    failed: 'Image processing failed',
    run: 'Apply adjustments',
    running: 'Processing…',
    saturation: 'Saturation',
    sourceUnavailable: 'The source image is no longer available to the plugin.',
    title: 'Adjust image',
  };
}
