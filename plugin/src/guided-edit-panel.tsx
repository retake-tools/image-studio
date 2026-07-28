import React, {
  useEffect,
  useState,
  useSyncExternalStore,
  type ReactElement,
} from 'react';
import {
  defineMessages,
  type PluginPanelProps as PluginPanelPropsV2,
} from '@retake/plugin-api';
import { usePluginTranslator } from './localization';
import { maskedEditStyles } from './masked-edit-styles';
import { guidedEditPanelStore } from './panel-store';
import { imageStudioStyles } from './styles';

const capabilityId = 'image.guided_edit';

export function ImageStudioGuidedEditPanel({
  host,
}: PluginPanelPropsV2): ReactElement | null {
  const panel = useSyncExternalStore(
    guidedEditPanelStore.subscribe,
    guidedEditPanelStore.getSnapshot,
    guidedEditPanelStore.getSnapshot,
  );
  const hostSnapshot = useSyncExternalStore(
    host.subscribeReadSnapshot,
    host.getReadSnapshot,
    host.getReadSnapshot,
  );
  const translator = usePluginTranslator(host, guidedEditMessages);
  const copy = translatedCopy(translator);
  const [connectionId, setConnectionId] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [outputCount, setOutputCount] = useState<1 | 2 | 3 | 4>(1);
  const [pending, setPending] = useState(false);
  const [prompt, setPrompt] = useState('');
  const block = panel.block;
  const blockId = block?.blockId;
  const blockIsBound = blockId
    ? hostSnapshot.boundBlockIds.includes(blockId)
    : false;
  const asset = block ? host.assets.getBound(block.assetId) : null;
  const connections = blockId
    ? host.execution.listConnections({ capabilityId })
    : [];
  const connectionKey = connections.map(
    (connection) => (
      `${connection.connectionId}:${connection.selectedByDefault}`
    ),
  ).join('|');

  useEffect(() => {
    setError(null);
    setOutputCount(1);
    setPending(false);
    setPrompt('');
  }, [blockId, panel.revision]);

  useEffect(() => {
    setConnectionId((current) => {
      if (connections.some(
        (connection) => connection.connectionId === current,
      )) return current;
      return connections.find(
        (connection) => connection.selectedByDefault,
      )?.connectionId ?? connections[0]?.connectionId ?? '';
    });
  }, [connectionKey]);

  useEffect(() => {
    if (blockId && !pending && !blockIsBound) guidedEditPanelStore.close();
  }, [blockId, blockIsBound, pending]);

  if (!block) return null;
  const sourceUrl = asset?.previewUrl ?? block.previewUrl;

  async function run(): Promise<void> {
    if (
      !blockId
      || !blockIsBound
      || !connectionId
      || pending
      || prompt.trim().length === 0
    ) return;
    setError(null);
    setPending(true);
    try {
      await host.execution.runConnected({
        capabilityId,
        connectionId,
        inputs: [{ blockId, slotId: 'source_image' }],
        outputCount,
        parameters: {},
        prompt: prompt.trim(),
      });
      guidedEditPanelStore.close();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : copy.failed);
      setPending(false);
    }
  }

  return (
    <>
      <style>{imageStudioStyles + maskedEditStyles}</style>
      <section
        aria-label={copy.title}
        className="retake-image-studio-panel is-masked-edit"
        data-retake-image-studio="guided-edit"
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
            onClick={() => guidedEditPanelStore.close()}
            type="button"
          >
            ×
          </button>
        </header>

        {sourceUrl ? (
          <div className="retake-image-studio-preview">
            <img alt={block.title} src={sourceUrl} />
          </div>
        ) : (
          <p className="retake-image-studio-panel__error">
            {copy.sourceUnavailable}
          </p>
        )}

        <label className="retake-image-studio-field">
          <span>{copy.connection}</span>
          <select
            disabled={pending}
            onChange={(event) => setConnectionId(event.target.value)}
            value={connectionId}
          >
            <option value="">{copy.noConnection}</option>
            {connections.map((connection) => (
              <option
                key={connection.connectionId}
                value={connection.connectionId}
              >
                {connection.displayName}
              </option>
            ))}
          </select>
        </label>

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

        <label className="retake-image-studio-field">
          <span>{copy.candidates}</span>
          <select
            disabled={pending}
            onChange={(event) => {
              setOutputCount(Number(event.target.value) as 1 | 2 | 3 | 4);
            }}
            value={outputCount}
          >
            {[1, 2, 3, 4].map((count) => (
              <option key={count} value={count}>{count}</option>
            ))}
          </select>
        </label>

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
            || !connectionId
            || prompt.trim().length === 0
          }
          onClick={() => void run()}
          type="button"
        >
          {pending ? copy.running : copy.run}
        </button>
      </section>
    </>
  );
}

const guidedEditMessages = defineMessages({
  candidates: localized('Candidates', '候选数量'),
  close: localized('Close', '关闭'),
  connection: localized('Image connection', '图片连接'),
  failed: localized('Failed to start guided edit', '引导式编辑启动失败'),
  noConnection: localized('Choose a connection', '选择连接'),
  prompt: localized('Edit instruction', '编辑要求'),
  promptPlaceholder: localized(
    'Describe the intended change and what must remain unchanged.',
    '说明要修改的内容，以及必须保持不变的内容。',
  ),
  run: localized('Run guided edit', '执行引导式编辑'),
  running: localized('Starting…', '正在启动…'),
  sourceUnavailable: localized(
    'The source image is no longer available to the plugin.',
    '当前源图已不在插件可访问范围内。',
  ),
  title: localized('Guided image edit', '引导式图片编辑'),
});

function translatedCopy(translator: {
  t(messageId: keyof typeof guidedEditMessages): string;
}) {
  return Object.fromEntries(
    Object.keys(guidedEditMessages).map((messageId) => [
      messageId,
      translator.t(messageId as keyof typeof guidedEditMessages),
    ]),
  ) as Record<keyof typeof guidedEditMessages, string>;
}

function localized(english: string, chinese: string) {
  return { default: english, locales: { 'zh-CN': chinese } };
}
