import React, {
  useEffect,
  useState,
  useSyncExternalStore,
  type ReactElement,
} from 'react';
import { defineMessages } from '@retake/plugin-api';
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
import { usePluginTranslator } from './localization';
import { useDefaultOutputFormat } from './settings';
import {
  imageStudioPanelClassName,
  type ImageStudioPanelProps,
  useImageStudioPanelEscape,
} from './panel-presentation';

const capabilityId = 'image.local_resize';
const resultSlotId = 'result_image';

export function ImageStudioResizePanel({
  host,
  presentation,
}: ImageStudioPanelProps): ReactElement | null {
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
  const defaultOutputFormat = useDefaultOutputFormat(host);
  const [format, setFormat] = useState<ResizeOutputFormat>(
    defaultOutputFormat,
  );
  const [matteColor, setMatteColor] = useState('#ffffff');
  const [mode, setMode] = useState<ResizeMode>('percentage');
  const [pending, setPending] = useState(false);
  const [quality, setQuality] = useState(90);
  const [value, setValue] = useState(50);
  const block = panel.block;
  useImageStudioPanelEscape({
    active: Boolean(block),
    disabled: pending,
    onClose: resizePanelStore.close,
  });
  const asset = block ? host.assets.getBound(block.assetId) : null;
  const assetId = asset?.assetId ?? block?.assetId;
  const assetWidth = validDimension(asset?.width);
  const assetHeight = validDimension(asset?.height);
  const blockId = block?.blockId;
  const blockIsBound = blockId
    ? hostSnapshot.boundBlockIds.includes(blockId)
    : false;
  const translator = usePluginTranslator(host, resizeMessages);
  const copy = localizedResizeCopy(translator);

  useEffect(() => {
    setAllowUpscale(false);
    setDimensions(
      assetWidth && assetHeight
        ? { height: assetHeight, width: assetWidth }
        : null,
    );
    setError(null);
    setFormat(defaultOutputFormat);
    setMatteColor('#ffffff');
    setMode('percentage');
    setPending(false);
    setQuality(90);
    setValue(50);
  }, [assetHeight, assetId, assetWidth, blockId, defaultOutputFormat]);

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
        className={imageStudioPanelClassName(
          'retake-image-studio-panel is-editor is-resize',
          presentation,
        )}
        data-retake-image-studio="resize"
      >
        <header className="retake-image-studio-panel__header">
          <h2>{copy.title}</h2>
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
                        setDimensions(next);
                      }
                    }}
                    src={sourceUrl}
                  />
                </div>
              </div>
            ) : (
              <p className="retake-image-studio-panel__error">
                {copy.sourceUnavailable}
              </p>
            )}
          </div>
          <div className="retake-image-studio-editor-controls">
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
            {mode === 'percentage' ? (
              <div className="retake-image-studio-range is-resize-scale">
                <span>{copy.scale}</span>
                <button
                  aria-label={copy.decrease}
                  disabled={pending || value <= 10}
                  onClick={() => setValue((current) => (
                    Math.max(10, current - 5)
                  ))}
                  type="button"
                >
                  −
                </button>
                <input
                  aria-label={copy.scale}
                  disabled={pending}
                  max={400}
                  min={10}
                  onChange={(event) => setValue(
                    Number(event.currentTarget.value),
                  )}
                  step={1}
                  type="range"
                  value={value}
                />
                <button
                  aria-label={copy.increase}
                  disabled={pending || value >= 400}
                  onClick={() => setValue((current) => (
                    Math.min(400, current + 5)
                  ))}
                  type="button"
                >
                  +
                </button>
                <output>{value}%</output>
              </div>
            ) : (
              <label className="retake-image-studio-field">
                <span>{copy.pixels}</span>
                <input
                  disabled={pending}
                  max={8192}
                  min={1}
                  onChange={(event) => setValue(Number(event.target.value))}
                  step={1}
                  type="number"
                  value={value}
                />
              </label>
            )}
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
          </div>
        </div>
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

const resizeMessages = defineMessages({
  allowUpscale: localized('Allow image upscale', '允许放大图片'),
  background: localized('Alpha background', '透明背景'),
  close: localized('Close', '关闭'),
  decrease: localized('Decrease scale', '减小缩放比例'),
  failed: localized('Image resize failed', '图片缩放失败'),
  format: localized('File format', '文件格式'),
  height: localized('By height', '按高度'),
  increase: localized('Increase scale', '增大缩放比例'),
  mode: localized('Resize by', '调整方式'),
  output: localized('Output size', '输出尺寸'),
  percentage: localized('Percentage', '按百分比'),
  pixels: localized('Target pixels', '目标像素'),
  quality: localized('Quality', '图片质量'),
  run: localized('Create new image', '创建新图片'),
  running: localized('Processing…', '处理中…'),
  scale: localized('Scale %', '缩放比例 %'),
  source: localized('Source size', '原图尺寸'),
  sourceUnavailable: localized(
    'The source image is no longer available to the plugin.',
    '当前图片已不在插件可访问范围内。',
  ),
  title: localized('Resize and format', '调整尺寸与格式'),
  width: localized('By width', '按宽度'),
});

function localizedResizeCopy(
  translator: {
    t(messageId: keyof typeof resizeMessages): string;
  },
): {
  allowUpscale: string;
  background: string;
  close: string;
  decrease: string;
  failed: string;
  format: string;
  height: string;
  increase: string;
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
  return {
    allowUpscale: translator.t('allowUpscale'),
    background: translator.t('background'),
    close: translator.t('close'),
    decrease: translator.t('decrease'),
    failed: translator.t('failed'),
    format: translator.t('format'),
    height: translator.t('height'),
    increase: translator.t('increase'),
    mode: translator.t('mode'),
    output: translator.t('output'),
    percentage: translator.t('percentage'),
    pixels: translator.t('pixels'),
    quality: translator.t('quality'),
    run: translator.t('run'),
    running: translator.t('running'),
    scale: translator.t('scale'),
    source: translator.t('source'),
    sourceUnavailable: translator.t('sourceUnavailable'),
    title: translator.t('title'),
    width: translator.t('width'),
  };
}

function localized(english: string, chinese: string) {
  return {
    default: english,
    locales: { 'zh-CN': chinese },
  };
}
