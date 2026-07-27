import { definePluginContribution } from '@retake/plugin-api';
import React, {
  useEffect,
  useState,
  useSyncExternalStore,
  type ReactElement,
} from 'react';
import type {
  ImageToolbarBlockV1,
  PluginActivationContextV1,
  PluginPanelPropsV1,
} from './contracts';
import { ImageStudioCropPanel } from './crop-panel';
import {
  defaultImageAdjustments,
  hasImageAdjustments,
  imageAdjustmentFilter,
  renderAdjustedImage,
  type LocalImageAdjustments,
} from './image-adjustments';
import { adjustPanelStore, cropPanelStore } from './panel-store';
import { exactSourceImage } from './plugin-assets';
import { imageStudioStyles } from './styles';

const capabilityId = 'image.local_adjust';
const cropCapabilityId = 'image.local_crop';
const resultSlotId = 'result_image';

export const localAdjustCapability = definePluginContribution({
  apiVersion: 1,
  definition: {
    capabilityId,
    category: 'image_editing',
    definitionHash: 'sha256:image-local-adjust-v1',
    displayName: 'Local image adjustment',
    inputSlots: [{
      artifactTypes: [],
      bindingKinds: ['asset', 'block'],
      cardinality: 'one',
      dataTypes: ['image'],
      required: true,
      semanticRole: 'source',
      slotId: 'source_image',
    }],
    outputSlots: [{
      cardinality: 'one',
      dataType: 'image',
      projectionBlockTypes: ['image'],
      semanticRole: 'adjusted_image',
      slotId: resultSlotId,
    }],
    parametersSchemaRef: 'definitions/image.local_adjust.parameters.json',
    runtimeRequirements: ['browser.canvas_2d'],
    schemaVersion: 1,
    supportedAdapterClasses: ['local_canvas'],
    version: '0.1.0',
  },
  kind: 'capability',
});

export const adjustImageAction = definePluginContribution({
  apiVersion: 1,
  kind: 'action',
  label: 'Adjust image',
  placement: 'image.toolbar',
  run({ block }: { block: ImageToolbarBlockV1 }) {
    cropPanelStore.close();
    adjustPanelStore.open(block);
  },
});

export const cropImageAction = definePluginContribution({
  apiVersion: 1,
  kind: 'action',
  label: 'Crop image',
  placement: 'image.toolbar',
  run({ block }: { block: ImageToolbarBlockV1 }) {
    adjustPanelStore.close();
    cropPanelStore.open(block);
  },
});

export const localCropCapability = definePluginContribution({
  apiVersion: 1,
  definition: {
    capabilityId: cropCapabilityId,
    category: 'image_editing',
    definitionHash: 'sha256:image-local-crop-v1',
    displayName: 'Local image crop',
    inputSlots: [{
      artifactTypes: [],
      bindingKinds: ['asset', 'block'],
      cardinality: 'one',
      dataTypes: ['image'],
      required: true,
      semanticRole: 'source',
      slotId: 'source_image',
    }],
    outputSlots: [{
      cardinality: 'one',
      dataType: 'image',
      projectionBlockTypes: ['image'],
      semanticRole: 'cropped_image',
      slotId: resultSlotId,
    }],
    parametersSchemaRef: 'definitions/image.local_crop.parameters.json',
    runtimeRequirements: ['browser.canvas_2d'],
    schemaVersion: 1,
    supportedAdapterClasses: ['local_canvas'],
    version: '0.1.0',
  },
  kind: 'capability',
});

export const adjustImagePanel = definePluginContribution({
  apiVersion: 1,
  component: ImageStudioAdjustPanel,
  kind: 'panel',
  placement: 'workspace.overlay',
});

export const cropImagePanel = definePluginContribution({
  apiVersion: 1,
  component: ImageStudioCropPanel,
  kind: 'panel',
  placement: 'workspace.overlay',
});

export function activate(context: PluginActivationContextV1): {
  dispose(): void;
} {
  const close = () => {
    adjustPanelStore.close();
    cropPanelStore.close();
  };
  context.signal.addEventListener('abort', close, { once: true });
  return {
    dispose() {
      context.signal.removeEventListener('abort', close);
      close();
    },
  };
}

function ImageStudioAdjustPanel({
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
