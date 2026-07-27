import React, {
  useEffect,
  useState,
  useSyncExternalStore,
  type ReactElement,
} from 'react';
import type { PluginPanelPropsV1 } from './contracts';
import {
  normalizedResizeEncoding,
  renderResizedImage,
  resizeOutputDimensions,
  type ResizeMode,
  type ResizeOutputFormat,
} from './image-resize';
import { resizePanelStore } from './panel-store';
import { exactSourceImage } from './plugin-assets';
import { imageStudioStyles } from './styles';

const capabilityId = 'image.local_resize';
const resultSlotId = 'result_image';

export function ImageStudioResizePanel({
  host,
}: PluginPanelPropsV1): ReactElement | null {
  const panel = useSyncExternalStore(
    resizePanelStore.subscribe,
    resizePanelStore.getSnapshot,
    resizePanelStore.getSnapshot,
  );
  const hostSnapshot = useSyncExternalStore(
    host.subscribeReadSnapshot,
    host.getReadSnapshot,
    host.getReadSnapshot,
  );
  const [allowUpscale, setAllowUpscale] = useState(false);
  const [dimensions, setDimensions] = useState<{
    height: number;
    width: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [format, setFormat] = useState<ResizeOutputFormat>('png');
  const [matteColor, setMatteColor] = useState('#ffffff');
  const [mode, setMode] = useState<ResizeMode>('percentage');
  const [pending, setPending] = useState(false);
  const [quality, setQuality] = useState(90);
  const [value, setValue] = useState(50);
  const block = panel.block;
  const asset = block ? host.assets.getBound(block.assetId) : null;
  const assetId = asset?.assetId ?? block?.assetId;
  const assetWidth = validDimension(asset?.width);
  const assetHeight = validDimension(asset?.height);
  const blockId = block?.blockId;
  const blockIsBound = blockId
    ? hostSnapshot.boundBlockIds.includes(blockId)
    : false;
  const copy = localizedResizeCopy();

  useEffect(() => {
    setAllowUpscale(false);
    setDimensions(
      assetWidth && assetHeight
        ? { height: assetHeight, width: assetWidth }
        : null,
    );
    setError(null);
    setFormat('png');
    setMatteColor('#ffffff');
    setMode('percentage');
    setPending(false);
    setQuality(90);
    setValue(50);
  }, [assetHeight, assetId, assetWidth, blockId]);

  useEffect(() => {
    if (blockId && !pending && !blockIsBound) {
      resizePanelStore.close();
    }
  }, [blockId, blockIsBound, pending]);

  if (!block) return null;
  const sourceUrl = asset?.previewUrl ?? block.previewUrl;
  const outputResult = dimensions
    ? attemptOutput({
        allowUpscale,
        mode,
        source: dimensions,
        value,
      })
    : null;
  const output = outputResult?.output ?? null;
  const validationError = outputResult?.error ?? null;

  async function run(): Promise<void> {
    if (!block || !sourceUrl || !dimensions || !output || pending) return;
    setError(null);
    setPending(true);
    const encoding = normalizedResizeEncoding({
      format,
      matteColor: format === 'jpeg' ? matteColor : null,
      quality: format === 'png' ? null : quality,
    });
    const parameters = {
      allowUpscale,
      matteColor: encoding.matteColor,
      outputFormat: encoding.format,
      outputHeight: output.height,
      outputWidth: output.width,
      quality: encoding.quality,
      resizeMode: mode,
      resizeValue: value,
      sourceHeight: dimensions.height,
      sourceWidth: dimensions.width,
    };
    try {
      await host.execution.run({
        capabilityId,
        inputBlockIds: [block.blockId],
        parameters,
        async execute({ assets, signal }) {
          const source = exactSourceImage(assets);
          const rendered = await renderResizedImage(
            source.previewUrl,
            output,
            encoding,
            signal,
          );
          return {
            images: [{
              dataUrl: rendered.dataUrl,
              fileName: `resized-${block.blockId}${rendered.extension}`,
              height: rendered.height,
              slotId: resultSlotId,
              width: rendered.width,
            }],
          };
        },
      });
      resizePanelStore.close();
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
        data-retake-image-studio="resize"
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
            onClick={() => resizePanelStore.close()}
            type="button"
          >
            ×
          </button>
        </header>
        {sourceUrl ? (
          <div className="retake-image-studio-preview">
            <img
              alt={block.title}
              onLoad={(event) => {
                const next = {
                  height: event.currentTarget.naturalHeight,
                  width: event.currentTarget.naturalWidth,
                };
                if (next.width > 0 && next.height > 0) setDimensions(next);
              }}
              src={sourceUrl}
            />
          </div>
        ) : (
          <p className="retake-image-studio-panel__error">
            {copy.sourceUnavailable}
          </p>
        )}
        {dimensions ? (
          <div className="retake-image-studio-resize-source">
            <span>{copy.source}</span>
            <strong>{dimensions.width} × {dimensions.height} px</strong>
          </div>
        ) : null}
        <label className="retake-image-studio-field">
          <span>{copy.mode}</span>
          <select
            disabled={pending}
            onChange={(event) => {
              const nextMode = event.target.value as ResizeMode;
              setMode(nextMode);
              setValue(
                nextMode === 'percentage'
                  ? 50
                  : nextMode === 'width'
                    ? dimensions?.width ?? 1
                    : dimensions?.height ?? 1,
              );
            }}
            value={mode}
          >
            <option value="percentage">{copy.percentage}</option>
            <option value="width">{copy.width}</option>
            <option value="height">{copy.height}</option>
          </select>
        </label>
        <label className="retake-image-studio-field">
          <span>{mode === 'percentage' ? copy.scale : copy.pixels}</span>
          <input
            disabled={pending}
            max={mode === 'percentage' ? 400 : 8192}
            min={mode === 'percentage' ? 10 : 1}
            onChange={(event) => setValue(Number(event.target.value))}
            step={1}
            type="number"
            value={value}
          />
        </label>
        <label className="retake-image-studio-check">
          <input
            checked={allowUpscale}
            disabled={pending}
            onChange={(event) => setAllowUpscale(event.target.checked)}
            type="checkbox"
          />
          <span>{copy.allowUpscale}</span>
        </label>
        <label className="retake-image-studio-field">
          <span>{copy.format}</span>
          <select
            disabled={pending}
            onChange={(event) => {
              setFormat(event.target.value as ResizeOutputFormat);
            }}
            value={format}
          >
            <option value="png">PNG</option>
            <option value="jpeg">JPEG</option>
            <option value="webp">WebP</option>
          </select>
        </label>
        {format !== 'png' ? (
          <label className="retake-image-studio-field">
            <span>{copy.quality}</span>
            <input
              disabled={pending}
              max={100}
              min={60}
              onChange={(event) => setQuality(Number(event.target.value))}
              step={1}
              type="number"
              value={quality}
            />
          </label>
        ) : null}
        {format === 'jpeg' ? (
          <label className="retake-image-studio-field">
            <span>{copy.background}</span>
            <input
              disabled={pending}
              onChange={(event) => setMatteColor(event.target.value)}
              type="color"
              value={matteColor}
            />
          </label>
        ) : null}
        {output ? (
          <div className="retake-image-studio-crop-output">
            <span>{copy.output}</span>
            <strong>{output.width} × {output.height} px</strong>
          </div>
        ) : null}
        {validationError || error ? (
          <p className="retake-image-studio-panel__error" role="alert">
            {error ?? validationError}
          </p>
        ) : null}
        <button
          className="retake-image-studio-panel__run"
          disabled={pending || !sourceUrl || !output}
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

function attemptOutput(input: Parameters<typeof resizeOutputDimensions>[0]): {
  error: string | null;
  output: ReturnType<typeof resizeOutputDimensions> | null;
} {
  try {
    return { error: null, output: resizeOutputDimensions(input) };
  } catch (cause) {
    return {
      error: cause instanceof Error ? cause.message : 'Invalid resize settings.',
      output: null,
    };
  }
}

function validDimension(value: number | undefined): number | null {
  return typeof value === 'number'
    && Number.isInteger(value)
    && value > 0
    ? value
    : null;
}

function localizedResizeCopy(): {
  allowUpscale: string;
  background: string;
  close: string;
  failed: string;
  format: string;
  height: string;
  mode: string;
  output: string;
  percentage: string;
  pixels: string;
  quality: string;
  run: string;
  running: string;
  scale: string;
  source: string;
  sourceUnavailable: string;
  title: string;
  width: string;
} {
  if (navigator.language.toLowerCase().startsWith('zh')) {
    return {
      allowUpscale: '允许放大图片',
      background: '透明背景',
      close: '关闭',
      failed: '图片缩放失败',
      format: '文件格式',
      height: '按高度',
      mode: '调整方式',
      output: '输出尺寸',
      percentage: '按百分比',
      pixels: '目标像素',
      quality: '图片质量',
      run: '创建新图片',
      running: '处理中…',
      scale: '缩放比例 %',
      source: '原图尺寸',
      sourceUnavailable: '当前图片已不在插件可访问范围内。',
      title: '调整尺寸与格式',
      width: '按宽度',
    };
  }
  return {
    allowUpscale: 'Allow image upscale',
    background: 'Alpha background',
    close: 'Close',
    failed: 'Image resize failed',
    format: 'File format',
    height: 'By height',
    mode: 'Resize by',
    output: 'Output size',
    percentage: 'Percentage',
    pixels: 'Target pixels',
    quality: 'Quality',
    run: 'Create new image',
    running: 'Processing…',
    scale: 'Scale %',
    source: 'Source size',
    sourceUnavailable: 'The source image is no longer available to the plugin.',
    title: 'Resize and format',
    width: 'By width',
  };
}
