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
  PluginPanelProps as PluginPanelPropsV2,
} from '@retake/plugin-api';
import { usePluginEnvironment } from './localization';
import { outpaintCopy } from './outpaint-copy';
import {
  createOutpaintInputs,
  outpaintGeometry,
  outpaintGeometryIssue,
  outpaintParameters,
  type OutpaintAspectPreset,
} from './outpaint';
import { outpaintPanelStore } from './panel-store';
import { outpaintStyles } from './outpaint-styles';
import { imageStudioStyles } from './styles';

const capabilityId = 'image.outpaint';
const aspectPresets: readonly OutpaintAspectPreset[] = [
  '1:1',
  '4:3',
  '3:4',
  '16:9',
  '9:16',
];

interface DragState {
  readonly bounds: DOMRect;
  readonly pointerId: number;
  readonly positionX: number;
  readonly positionY: number;
  readonly startX: number;
  readonly startY: number;
}

export function ImageStudioOutpaintPanel({
  host,
}: PluginPanelPropsV2): ReactElement | null {
  const panel = useSyncExternalStore(
    outpaintPanelStore.subscribe,
    outpaintPanelStore.getSnapshot,
    outpaintPanelStore.getSnapshot,
  );
  const hostSnapshot = useSyncExternalStore(
    host.subscribeReadSnapshot,
    host.getReadSnapshot,
    host.getReadSnapshot,
  );
  const environment = usePluginEnvironment(host);
  const copy = outpaintCopy(environment.locale);
  const block = panel.block;
  const asset = block ? host.assets.getBound(block.assetId) : null;
  const sourceUrl = asset?.previewUrl ?? block?.previewUrl;
  const blockId = block?.blockId;
  const sourceAssetId = asset?.assetId ?? block?.assetId;
  const assetWidth = validDimension(asset?.width);
  const assetHeight = validDimension(asset?.height);
  const blockIsBound = blockId
    ? hostSnapshot.boundBlockIds.includes(blockId)
    : false;
  const [aspectPreset, setAspectPreset] =
    useState<OutpaintAspectPreset>('16:9');
  const [connectionId, setConnectionId] = useState('');
  const [dimensions, setDimensions] = useState<{
    height: number;
    width: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [outputCount, setOutputCount] = useState<1 | 2 | 3 | 4>(1);
  const [pending, setPending] = useState(false);
  const [position, setPosition] = useState({ x: 0.5, y: 0.5 });
  const [prompt, setPrompt] = useState('');
  const [scalePercent, setScalePercent] = useState(125);
  const dragRef = useRef<DragState | null>(null);
  const connections = blockId
    ? host.execution.listConnections({ capabilityId })
    : [];
  const connectionKey = connections.map(
    (connection) => (
      `${connection.connectionId}:${connection.selectedByDefault}`
    ),
  ).join('|');

  useEffect(() => {
    setAspectPreset('16:9');
    setDimensions(
      assetWidth && assetHeight
        ? { height: assetHeight, width: assetWidth }
        : null,
    );
    setError(null);
    setOutputCount(1);
    setPending(false);
    setPosition({ x: 0.5, y: 0.5 });
    setPrompt('');
    setScalePercent(125);
  }, [assetHeight, assetWidth, blockId, sourceAssetId]);

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
    if (blockId && !pending && !blockIsBound) {
      outpaintPanelStore.close();
    }
  }, [blockId, blockIsBound, pending]);

  if (!block) return null;
  const geometry = dimensions
    ? outpaintGeometry({
        aspectPreset,
        positionX: position.x,
        positionY: position.y,
        scale: scalePercent / 100,
        sourceHeight: dimensions.height,
        sourceWidth: dimensions.width,
      })
    : null;
  const issue = geometry ? outpaintGeometryIssue(geometry) : null;
  const issueMessage = issue === 'no_expansion'
    ? copy.noExpansion
    : issue === 'target_too_large'
      ? copy.targetTooLarge
      : null;
  const canRun = Boolean(
    blockId
    && sourceUrl
    && geometry
    && !issue
    && connectionId
    && blockIsBound
    && !pending,
  );

  async function run(): Promise<void> {
    if (!canRun || !blockId || !sourceUrl || !geometry) return;
    setError(null);
    setPending(true);
    try {
      const generated = await createOutpaintInputs(
        sourceUrl,
        geometry,
        new AbortController().signal,
      );
      const [guideAsset, maskAsset] = await Promise.all([
        host.assets.importImage({
          dataUrl: generated.guideDataUrl,
          fileName: `outpaint-guide-${blockId}.png`,
          height: geometry.guideHeight,
          width: geometry.guideWidth,
        }),
        host.assets.importImage({
          dataUrl: generated.maskDataUrl,
          fileName: `outpaint-mask-${blockId}.png`,
          height: geometry.guideHeight,
          width: geometry.guideWidth,
        }),
      ]);
      await host.execution.runConnected({
        capabilityId,
        connectionId,
        inputs: [
          { blockId, slotId: 'source_image' },
          { assetId: guideAsset.assetId, slotId: 'outpaint_guide' },
          { assetId: maskAsset.assetId, slotId: 'inpaint_mask' },
        ],
        outputCount,
        parameters: outpaintParameters(geometry),
        prompt: prompt.trim() || copy.defaultPrompt,
      });
      outpaintPanelStore.close();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : copy.failed);
      setPending(false);
    }
  }

  function beginDrag(event: PointerEvent<HTMLDivElement>): void {
    if (!geometry || pending) return;
    const bounds = event.currentTarget.parentElement?.getBoundingClientRect();
    if (!bounds || bounds.width <= 0 || bounds.height <= 0) return;
    dragRef.current = {
      bounds,
      pointerId: event.pointerId,
      positionX: position.x,
      positionY: position.y,
      startX: event.clientX,
      startY: event.clientY,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function drag(event: PointerEvent<HTMLDivElement>): void {
    const state = dragRef.current;
    if (
      !geometry
      || !state
      || state.pointerId !== event.pointerId
    ) return;
    const horizontalTravel = state.bounds.width * (
      1 - geometry.sourceWidth / geometry.targetWidth
    );
    const verticalTravel = state.bounds.height * (
      1 - geometry.sourceHeight / geometry.targetHeight
    );
    setPosition({
      x: horizontalTravel > 0
        ? state.positionX + (event.clientX - state.startX) / horizontalTravel
        : 0.5,
      y: verticalTravel > 0
        ? state.positionY + (event.clientY - state.startY) / verticalTravel
        : 0.5,
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
    const step = event.shiftKey ? 0.1 : 0.025;
    const delta = {
      ArrowDown: { x: 0, y: step },
      ArrowLeft: { x: -step, y: 0 },
      ArrowRight: { x: step, y: 0 },
      ArrowUp: { x: 0, y: -step },
    }[event.key];
    if (!delta) return;
    event.preventDefault();
    setPosition((current) => ({
      x: clamp(current.x + delta.x, 0, 1),
      y: clamp(current.y + delta.y, 0, 1),
    }));
  }

  return (
    <>
      <style>{imageStudioStyles + outpaintStyles}</style>
      <section
        aria-busy={pending}
        aria-label={copy.title}
        className="retake-image-studio-panel is-outpaint"
        data-retake-image-studio="outpaint"
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
            onClick={() => outpaintPanelStore.close()}
            type="button"
          >
            ×
          </button>
        </header>

        {sourceUrl && geometry ? (
          <div className="retake-outpaint-stage-shell">
            <div
              className="retake-outpaint-stage"
              style={{
                aspectRatio:
                  `${geometry.targetWidth} / ${geometry.targetHeight}`,
              }}
            >
              <div
                aria-label={copy.sourcePosition}
                className="retake-outpaint-source"
                onKeyDown={moveWithKeyboard}
                onPointerCancel={endDrag}
                onPointerDown={beginDrag}
                onPointerMove={drag}
                onPointerUp={endDrag}
                style={{
                  height:
                    `${geometry.sourceHeight / geometry.targetHeight * 100}%`,
                  left: `${geometry.sourceX / geometry.targetWidth * 100}%`,
                  top: `${geometry.sourceY / geometry.targetHeight * 100}%`,
                  width:
                    `${geometry.sourceWidth / geometry.targetWidth * 100}%`,
                }}
                tabIndex={pending ? -1 : 0}
              >
                <img
                  alt={block.title}
                  draggable={false}
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
              </div>
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
              setAspectPreset(
                event.currentTarget.value as OutpaintAspectPreset,
              );
              setPosition({ x: 0.5, y: 0.5 });
            }}
            value={aspectPreset}
          >
            {aspectPresets.map((preset) => (
              <option key={preset} value={preset}>{preset}</option>
            ))}
          </select>
        </label>

        <div className="retake-image-studio-range is-outpaint">
          <span>{copy.expandAmount}</span>
          <button
            aria-label={copy.decrease}
            disabled={pending || scalePercent <= 100}
            onClick={() => setScalePercent(
              (current) => Math.max(100, current - 5),
            )}
            type="button"
          >
            −
          </button>
          <input
            aria-label={copy.expandAmount}
            disabled={pending}
            max={200}
            min={100}
            onChange={(event) => setScalePercent(
              Number(event.currentTarget.value),
            )}
            step={1}
            type="range"
            value={scalePercent}
          />
          <button
            aria-label={copy.increase}
            disabled={pending || scalePercent >= 200}
            onClick={() => setScalePercent(
              (current) => Math.min(200, current + 5),
            )}
            type="button"
          >
            +
          </button>
          <output>{scalePercent}%</output>
        </div>

        <div aria-label={copy.anchor} className="retake-outpaint-anchors">
          {[0, 0.5, 1].flatMap((y) => (
            [0, 0.5, 1].map((x) => (
              <button
                aria-label={`${copy.anchor} ${x},${y}`}
                className={
                  position.x === x && position.y === y
                    ? 'is-active'
                    : undefined
                }
                disabled={pending}
                key={`${x}-${y}`}
                onClick={() => setPosition({ x, y })}
                type="button"
              />
            ))
          ))}
        </div>

        {geometry ? (
          <div className="retake-image-studio-crop-output">
            <span>{copy.output}</span>
            <strong>
              {geometry.targetWidth} × {geometry.targetHeight}
            </strong>
          </div>
        ) : null}

        <label className="retake-outpaint-prompt">
          <span>{copy.prompt}</span>
          <textarea
            disabled={pending}
            maxLength={32_000}
            onChange={(event) => setPrompt(event.currentTarget.value)}
            placeholder={copy.promptPlaceholder}
            rows={3}
            value={prompt}
          />
        </label>

        <div className="retake-outpaint-run-options">
          <label>
            <span>{copy.connection}</span>
            <select
              disabled={pending || connections.length === 0}
              onChange={(event) => setConnectionId(
                event.currentTarget.value,
              )}
              value={connectionId}
            >
              {connections.map((connection) => (
                <option
                  key={connection.connectionId}
                  value={connection.connectionId}
                >
                  {connection.displayName}
                  {connection.modelLabel
                    ? ` · ${connection.modelLabel}`
                    : ''}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>{copy.candidates}</span>
            <select
              disabled={pending}
              onChange={(event) => setOutputCount(
                Number(event.currentTarget.value) as 1 | 2 | 3 | 4,
              )}
              value={outputCount}
            >
              {[1, 2, 3, 4].map((count) => (
                <option key={count} value={count}>{count}</option>
              ))}
            </select>
          </label>
        </div>

        {connections.length === 0 ? (
          <p className="retake-image-studio-panel__error">
            {copy.noConnection}
          </p>
        ) : null}
        {issueMessage || error ? (
          <p className="retake-image-studio-panel__error" role="alert">
            {error ?? issueMessage}
          </p>
        ) : null}

        <button
          className="retake-image-studio-panel__run"
          disabled={!canRun}
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

function validDimension(value: number | undefined): number | undefined {
  return typeof value === 'number' && Number.isInteger(value) && value > 0
    ? value
    : undefined;
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value));
}
