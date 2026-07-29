import React, {
  useEffect,
  useState,
  useSyncExternalStore,
  type ReactElement,
} from 'react';
import {
  defineMessages,
  PluginImageBlock as ImageToolbarBlockV2,
  PluginAssetV2,
  PluginPanelProps as PluginPanelPropsV2,
} from '@retake/plugin-api';
import { usePluginTranslator } from './localization';
import { maskedEditStyles } from './masked-edit-styles';
import { validateMaskedEditImages } from './masked-edit';
import { maskedEditPanelStore } from './panel-store';
import { imageStudioStyles } from './styles';

const capabilityId = 'image.masked_edit';

export function ImageStudioMaskedEditPanel({
  host,
}: PluginPanelPropsV2): ReactElement | null {
  const panel = useSyncExternalStore(
    maskedEditPanelStore.subscribe,
    maskedEditPanelStore.getSnapshot,
    maskedEditPanelStore.getSnapshot,
  );
  const hostSnapshot = useSyncExternalStore(
    host.subscribeReadSnapshot,
    host.getReadSnapshot,
    host.getReadSnapshot,
  );
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [sourceIndex, setSourceIndex] = useState(0);
  const translator = usePluginTranslator(host, maskedEditMessages);
  const copy = localizedMaskedEditCopy(translator);
  const blocks = panel.blocks;
  const sourceBlock = blocks[sourceIndex];
  const maskBlock = blocks[sourceIndex === 0 ? 1 : 0];
  const sourceAsset = sourceBlock
    ? host.assets.getBound(sourceBlock.assetId)
    : null;
  const maskAsset = maskBlock
    ? host.assets.getBound(maskBlock.assetId)
    : null;
  const allBlocksAreBound = blocks.every(
    (block) => hostSnapshot.boundBlockIds.includes(block.blockId),
  );

  useEffect(() => {
    setError(null);
    setPending(false);
    setPrompt('');
    setSourceIndex(0);
  }, [panel.revision]);

  useEffect(() => {
    if (blocks.length > 0 && !pending && !allBlocksAreBound) {
      maskedEditPanelStore.close();
    }
  }, [allBlocksAreBound, blocks.length, pending]);

  if (blocks.length === 0) return null;
  const inputError = validateInputs(
    blocks,
    sourceAsset,
    maskAsset,
    copy,
  );

  async function run(): Promise<void> {
    if (
      !sourceBlock
      || !maskBlock
      || pending
      || prompt.trim().length === 0
      || inputError
    ) return;
    setError(null);
    setPending(true);
    try {
      await host.execution.runConnected({
        capabilityId,
        inputs: [
          {
            blockId: sourceBlock.blockId,
            slotId: 'source_image',
          },
          {
            blockId: maskBlock.blockId,
            slotId: 'inpaint_mask',
          },
        ],
        parameters: {
          maskEncoding: 'grayscale_white_selected_v1',
        },
        prompt: prompt.trim(),
      });
      maskedEditPanelStore.close();
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : copy.failed,
      );
      setPending(false);
    }
  }

  return (
    <>
      <style>{imageStudioStyles + maskedEditStyles}</style>
      <section
        aria-label={copy.title}
        className="retake-image-studio-panel is-masked-edit"
        data-retake-image-studio="masked-edit"
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
            onClick={() => maskedEditPanelStore.close()}
            type="button"
          >
            ×
          </button>
        </header>

        <p className="retake-image-studio-connected-note">
          {copy.connectionNote}
        </p>

        <div className="retake-image-studio-masked-inputs">
          <InputPreview
            asset={sourceAsset}
            block={sourceBlock}
            label={copy.source}
          />
          <InputPreview
            asset={maskAsset}
            block={maskBlock}
            label={copy.mask}
          />
        </div>

        <button
          className="retake-image-studio-mask-swap"
          disabled={pending || blocks.length !== 2}
          onClick={() => setSourceIndex((current) => current === 0 ? 1 : 0)}
          type="button"
        >
          {copy.swap}
        </button>

        <label className="retake-image-studio-prompt">
          <span>{copy.prompt}</span>
          <textarea
            disabled={pending}
            maxLength={32_000}
            onChange={(event) => setPrompt(event.target.value)}
            placeholder={copy.promptPlaceholder}
            rows={5}
            value={prompt}
          />
        </label>

        {inputError || error ? (
          <p className="retake-image-studio-panel__error" role="alert">
            {error ?? inputError}
          </p>
        ) : null}

        <button
          className="retake-image-studio-panel__run"
          disabled={
            pending
            || Boolean(inputError)
            || prompt.trim().length === 0
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

function InputPreview({
  asset,
  block,
  label,
}: {
  asset: PluginAssetV2 | null;
  block: ImageToolbarBlockV2 | undefined;
  label: string;
}): ReactElement {
  const source = asset?.previewUrl ?? block?.previewUrl;
  return (
    <figure className="retake-image-studio-masked-input">
      <figcaption>{label}</figcaption>
      {source ? <img alt={block?.title ?? label} src={source} /> : null}
      <small>
        {asset?.width && asset.height
          ? `${asset.width} × ${asset.height}`
          : block?.title ?? '—'}
      </small>
    </figure>
  );
}

function validateInputs(
  blocks: readonly ImageToolbarBlockV2[],
  source: PluginAssetV2 | null,
  mask: PluginAssetV2 | null,
  copy: ReturnType<typeof localizedMaskedEditCopy>,
): string | null {
  if (blocks.length !== 2) return copy.twoImages;
  if (!source || !mask) return copy.unavailable;
  const issue = validateMaskedEditImages(source, mask);
  if (issue === 'mask_must_be_png') return copy.maskPng;
  if (issue === 'dimension_mismatch') return copy.dimensionMismatch;
  return null;
}

const maskedEditMessages = defineMessages({
  close: localized('Close', '关闭'),
  connectionNote: localized(
    'Uses the current Retake image default Connection. Change or test it in Settings.',
    '将使用 Retake 当前图片默认连接。可在设置中修改或测试连接。',
  ),
  dimensionMismatch: localized(
    'The Selection Mask must match the source pixel dimensions.',
    '选区蒙版必须与源图像素尺寸完全一致。',
  ),
  failed: localized('Failed to start masked AI edit', '局部 AI 编辑启动失败'),
  mask: localized('Selection Mask', '选区蒙版'),
  maskPng: localized(
    'The Selection Mask must be an opaque PNG.',
    '选区蒙版必须是不透明 PNG。',
  ),
  prompt: localized('Edit instruction', '编辑要求'),
  promptPlaceholder: localized(
    'For example: change only the selected jacket to dark blue and preserve everything else.',
    '例如：只把选区内的外套改成深蓝色，其他内容保持不变。',
  ),
  run: localized('Run masked AI edit', '执行局部 AI 编辑'),
  running: localized('Starting…', '正在启动…'),
  source: localized('Source', '源图'),
  swap: localized('Swap source and mask', '交换源图与蒙版'),
  title: localized('Masked AI edit', '局部 AI 编辑'),
  twoImages: localized(
    'Select exactly one source image and one Selection Mask on the canvas.',
    '请在画布上只选择一个源图和一个选区蒙版。',
  ),
  unavailable: localized(
    'The selected images are no longer available to the Plugin.',
    '当前图片已不在插件可访问范围内。',
  ),
});

function localizedMaskedEditCopy(translator: {
  t(messageId: keyof typeof maskedEditMessages): string;
}) {
  return Object.fromEntries(
    Object.keys(maskedEditMessages).map((messageId) => [
      messageId,
      translator.t(messageId as keyof typeof maskedEditMessages),
    ]),
  ) as Record<keyof typeof maskedEditMessages, string>;
}

function localized(english: string, chinese: string) {
  return { default: english, locales: { 'zh-CN': chinese } };
}
