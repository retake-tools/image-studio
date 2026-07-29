import React, {
  useEffect,
  useMemo,
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
import {
  annotationColorOptions,
  annotationLimits,
  annotationMarksMissingIntent,
  compileAnnotationInstruction,
  createAnnotatedComposite,
  createAnnotationMark,
  finalizeDrawingAnnotationMark,
  hasExecutableAnnotationIntent,
  hitTestAnnotationEndpoint,
  hitTestAnnotationMark,
  translateAnnotationMark,
  updateAnnotationEndpoint,
  updateDrawingAnnotationMark,
  type AnnotationColor,
  type AnnotationEndpoint,
  type AnnotationManifest,
  type AnnotationMark,
  type AnnotationMarkKind,
  type AnnotationPoint,
  type AnnotationStrokeSize,
} from './annotation';
import {
  annotationColorLabel,
  annotationCopy,
  annotationKindLabel,
} from './annotation-copy';
import {
  AnnotationArrowDefinitions,
  AnnotationOverlayMark,
} from './annotation-overlay';
import {
  AnnotationToolButton,
  annotationDraftJson,
  annotationSourceSession,
  initialAnnotationDraft,
} from './annotation-panel-support';
import { annotationPanelStore } from './panel-store';
import { usePluginEnvironment } from './localization';
import { annotationStyles } from './annotation-styles';
import { imageStudioStyles } from './styles';

const capabilityId = 'image.annotation_edit';
const tools: readonly AnnotationMarkKind[] = [
  'marker',
  'arrow',
  'pen',
  'brush',
  'rect',
  'ellipse',
];
const strokeSizes: readonly AnnotationStrokeSize[] = ['xs', 's', 'm', 'l'];

type AnnotationTool = 'eraser' | 'select' | AnnotationMarkKind;
type Gesture =
  | { kind: 'draw'; markId: string }
  | {
      endpoint: AnnotationEndpoint;
      kind: 'endpoint';
      markId: string;
    }
  | { kind: 'move'; lastPoint: AnnotationPoint; markId: string }
  | { kind: 'pan'; lastClientX: number; lastClientY: number }
  | null;

export function ImageStudioAnnotationPanel({
  host,
}: PluginPanelPropsV2): ReactElement | null {
  const panel = useSyncExternalStore(
    annotationPanelStore.subscribe,
    annotationPanelStore.getSnapshot,
    annotationPanelStore.getSnapshot,
  );
  const hostSnapshot = useSyncExternalStore(
    host.subscribeReadSnapshot,
    host.getReadSnapshot,
    host.getReadSnapshot,
  );
  const environment = usePluginEnvironment(host);
  const copy = annotationCopy(environment.locale);
  const source = annotationSourceSession(panel, host);
  const sourceBlockId = source.blockId;
  const sourceAssetId = source.asset?.assetId;
  const isHistorical = panel.operation !== null;
  const [activeTool, setActiveTool] = useState<AnnotationTool>('select');
  const [color, setColor] = useState<AnnotationColor>(
    annotationColorOptions[0].value,
  );
  const [connectionId, setConnectionId] = useState('');
  const [draftRevision, setDraftRevision] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [globalInstruction, setGlobalInstruction] = useState('');
  const [hoveredMarkId, setHoveredMarkId] = useState<string | null>(null);
  const [imageAspectRatio, setImageAspectRatio] = useState<number | null>(null);
  const [marks, setMarks] = useState<AnnotationMark[]>([]);
  const [outputCount, setOutputCount] = useState<1 | 2 | 3 | 4>(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [pending, setPending] = useState(false);
  const [selectedMarkId, setSelectedMarkId] = useState<string | null>(null);
  const [strokeSize, setStrokeSize] = useState<AnnotationStrokeSize>('m');
  const [zoom, setZoom] = useState(1);
  const gestureRef = useRef<Gesture>(null);
  const intentRefs = useRef(new Map<string, HTMLTextAreaElement>());
  const historyRef = useRef<{
    future: AnnotationMark[][];
    past: AnnotationMark[][];
  }>({ future: [], past: [] });
  const stageRef = useRef<HTMLDivElement | null>(null);
  const connections = sourceBlockId
    ? host.execution.listConnections({ capabilityId })
    : [];
  const connectionKey = connections.map(
    (connection) => `${connection.connectionId}:${connection.selectedByDefault}`,
  ).join('|');
  const sourceIsBound = Boolean(
    sourceBlockId && hostSnapshot.boundBlockIds.includes(sourceBlockId),
  );

  useEffect(() => {
    if (!source.blockId) return;
    const draft = initialAnnotationDraft(panel, host, source.asset?.assetId);
    setActiveTool('select');
    setColor(annotationColorOptions[0].value);
    setDraftRevision(0);
    setError(null);
    setGlobalInstruction(draft?.globalInstruction ?? '');
    setHoveredMarkId(null);
    setImageAspectRatio(
      source.asset?.width && source.asset.height
        ? source.asset.width / source.asset.height
        : null,
    );
    setMarks(draft?.marks ?? []);
    setOutputCount(1);
    setPan({ x: 0, y: 0 });
    setPending(false);
    setSelectedMarkId(null);
    setStrokeSize('m');
    setZoom(1);
    gestureRef.current = null;
    historyRef.current = { future: [], past: [] };
  }, [panel.revision]);

  useEffect(() => {
    if (!selectedMarkId) return;
    const frame = requestAnimationFrame(() => {
      intentRefs.current.get(selectedMarkId)?.focus();
    });
    return () => cancelAnimationFrame(frame);
  }, [marks.length, selectedMarkId]);

  useEffect(() => {
    setConnectionId((current) => {
      if (connections.some((connection) => (
        connection.connectionId === current
      ))) return current;
      return connections.find(
        (connection) => connection.selectedByDefault,
      )?.connectionId ?? connections[0]?.connectionId ?? '';
    });
  }, [connectionKey]);

  useEffect(() => {
    if (
      isHistorical
      || !sourceBlockId
      || draftRevision === 0
      || pending
    ) return;
    const timeout = window.setTimeout(() => {
      void host.drafts.saveBound({
        blockId: sourceBlockId,
        capabilityId,
        value: annotationDraftJson({
          globalInstruction,
          marks,
          schemaVersion: 1,
          ...(sourceAssetId ? { sourceAssetId } : {}),
        }),
      }).catch((cause) => {
        setError(
          cause instanceof Error
            ? `${copy.draftFailed}: ${cause.message}`
            : copy.draftFailed,
        );
      });
    }, 300);
    return () => window.clearTimeout(timeout);
  }, [
    copy.draftFailed,
    draftRevision,
    globalInstruction,
    host,
    isHistorical,
    marks,
    pending,
    sourceAssetId,
    sourceBlockId,
  ]);

  useEffect(() => {
    if (
      panel.block
      && !pending
      && sourceBlockId
      && !sourceIsBound
    ) {
      annotationPanelStore.close();
    }
  }, [panel.block, pending, sourceBlockId, sourceIsBound]);

  const manifest = useMemo<AnnotationManifest>(() => ({
    globalInstruction,
    marks,
    schemaVersion: 1,
  }), [globalInstruction, marks]);
  const compiledInstruction = useMemo(
    () => compileAnnotationInstruction(manifest),
    [manifest],
  );
  const missingIntentIds = useMemo(
    () => annotationMarksMissingIntent(manifest),
    [manifest],
  );
  const canRun = Boolean(
    source.url
    && sourceIsBound
    && connectionId
    && hasExecutableAnnotationIntent(manifest)
    && missingIntentIds.length === 0
    && !pending,
  );

  if (!source.blockId) return null;

  function updateMarks(
    updater: (current: AnnotationMark[]) => AnnotationMark[],
  ): void {
    setMarks((current) => updater(current));
    setDraftRevision((revision) => revision + 1);
  }

  function recordHistory(): void {
    historyRef.current = {
      future: [],
      past: [...historyRef.current.past, structuredClone(marks)].slice(-80),
    };
  }

  function undo(): void {
    const previous = historyRef.current.past.at(-1);
    if (!previous) return;
    historyRef.current = {
      future: [structuredClone(marks), ...historyRef.current.future].slice(
        0,
        80,
      ),
      past: historyRef.current.past.slice(0, -1),
    };
    setMarks(structuredClone(previous));
    setSelectedMarkId(null);
    setDraftRevision((revision) => revision + 1);
  }

  function redo(): void {
    const next = historyRef.current.future[0];
    if (!next) return;
    historyRef.current = {
      future: historyRef.current.future.slice(1),
      past: [...historyRef.current.past, structuredClone(marks)].slice(-80),
    };
    setMarks(structuredClone(next));
    setSelectedMarkId(null);
    setDraftRevision((revision) => revision + 1);
  }

  function normalizedPoint(
    event: PointerEvent<HTMLDivElement>,
  ): AnnotationPoint | null {
    const bounds = event.currentTarget.getBoundingClientRect();
    if (bounds.width <= 0 || bounds.height <= 0) return null;
    const point = {
      x: (event.clientX - bounds.left) / bounds.width,
      y: (event.clientY - bounds.top) / bounds.height,
    };
    if (point.x < 0 || point.x > 1 || point.y < 0 || point.y > 1) {
      return null;
    }
    return point;
  }

  function onStagePointerDown(
    event: PointerEvent<HTMLDivElement>,
  ): void {
    event.preventDefault();
    event.stopPropagation();
    if (pending) return;
    stageRef.current?.focus();
    const point = normalizedPoint(event);
    const hit = point ? hitTestAnnotationMark(marks, point) : undefined;
    const selectedMark = marks.find((mark) => mark.id === selectedMarkId);
    const endpoint = point
      ? hitTestAnnotationEndpoint(selectedMark, point)
      : null;
    if (
      event.button === 1
      || (activeTool === 'select' && zoom > 1 && !hit)
    ) {
      event.currentTarget.setPointerCapture(event.pointerId);
      gestureRef.current = {
        kind: 'pan',
        lastClientX: event.clientX,
        lastClientY: event.clientY,
      };
      return;
    }
    if (!point) return;
    if (endpoint && selectedMarkId) {
      recordHistory();
      event.currentTarget.setPointerCapture(event.pointerId);
      gestureRef.current = {
        endpoint,
        kind: 'endpoint',
        markId: selectedMarkId,
      };
      return;
    }
    if (activeTool === 'select') {
      setSelectedMarkId(hit?.id ?? null);
      if (hit) {
        recordHistory();
        event.currentTarget.setPointerCapture(event.pointerId);
        gestureRef.current = {
          kind: 'move',
          lastPoint: point,
          markId: hit.id,
        };
      }
      return;
    }
    if (activeTool === 'eraser') {
      if (!hit) return;
      recordHistory();
      updateMarks((current) => current.filter((mark) => mark.id !== hit.id));
      if (selectedMarkId === hit.id) setSelectedMarkId(null);
      return;
    }
    if (marks.length >= annotationLimits.markCount) {
      setError(copy.markLimit);
      return;
    }
    recordHistory();
    const mark = createAnnotationMark(
      activeTool,
      point,
      color,
      strokeSize,
      marks,
    );
    updateMarks((current) => [...current, mark]);
    setSelectedMarkId(mark.id);
    event.currentTarget.setPointerCapture(event.pointerId);
    gestureRef.current = { kind: 'draw', markId: mark.id };
  }

  function onStagePointerMove(
    event: PointerEvent<HTMLDivElement>,
  ): void {
    const gesture = gestureRef.current;
    if (!gesture) {
      const point = normalizedPoint(event);
      const hit = point ? hitTestAnnotationMark(marks, point) : undefined;
      setHoveredMarkId((current) => current === hit?.id
        ? current
        : hit?.id ?? null);
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    if (gesture.kind === 'pan') {
      setPan((current) => ({
        x: current.x + event.clientX - gesture.lastClientX,
        y: current.y + event.clientY - gesture.lastClientY,
      }));
      gestureRef.current = {
        ...gesture,
        lastClientX: event.clientX,
        lastClientY: event.clientY,
      };
      return;
    }
    const point = normalizedPoint(event);
    if (!point) return;
    if (gesture.kind === 'draw') {
      updateMarks((current) => current.map((mark) => (
        mark.id === gesture.markId
          ? updateDrawingAnnotationMark(mark, point)
          : mark
      )));
      return;
    }
    if (gesture.kind === 'endpoint') {
      updateMarks((current) => current.map((mark) => (
        mark.id === gesture.markId
          ? updateAnnotationEndpoint(mark, gesture.endpoint, point)
          : mark
      )));
      return;
    }
    const dx = point.x - gesture.lastPoint.x;
    const dy = point.y - gesture.lastPoint.y;
    updateMarks((current) => current.map((mark) => (
      mark.id === gesture.markId
        ? translateAnnotationMark(mark, dx, dy)
        : mark
    )));
    gestureRef.current = { ...gesture, lastPoint: point };
  }

  function finishGesture(event: PointerEvent<HTMLDivElement>): void {
    const gesture = gestureRef.current;
    gestureRef.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    if (gesture?.kind !== 'draw') return;
    const mark = marks.find((candidate) => candidate.id === gesture.markId);
    if (!mark) return;
    const finalized = finalizeDrawingAnnotationMark(mark);
    updateMarks((current) => finalized
      ? current.map((candidate) => (
          candidate.id === gesture.markId ? finalized : candidate
        ))
      : current.filter((candidate) => candidate.id !== gesture.markId));
    if (!finalized) setSelectedMarkId(null);
    if (activeTool !== 'pen' && activeTool !== 'brush') {
      setActiveTool('select');
    }
  }

  function onPanelKeyDown(event: KeyboardEvent<HTMLElement>): void {
    const target = event.target;
    const editable = target instanceof HTMLElement && Boolean(
      target.closest('input, textarea, select, [contenteditable="true"]'),
    );
    if (
      !editable
      && (event.metaKey || event.ctrlKey)
      && event.key.toLowerCase() === 'z'
    ) {
      event.preventDefault();
      event.stopPropagation();
      if (event.shiftKey) redo();
      else undo();
      return;
    }
    if (
      !editable
      && selectedMarkId
      && (event.key === 'Delete' || event.key === 'Backspace')
    ) {
      event.preventDefault();
      event.stopPropagation();
      recordHistory();
      updateMarks((current) => (
        current.filter((mark) => mark.id !== selectedMarkId)
      ));
      setSelectedMarkId(null);
    }
  }

  async function run(): Promise<void> {
    if (!canRun || !source.url || !sourceBlockId) return;
    setError(null);
    setPending(true);
    try {
      const composite = await createAnnotatedComposite(source.url, marks);
      const compositeAsset = await host.assets.importImage({
        dataUrl: composite.dataUrl,
        fileName: `annotation-${sourceBlockId}.png`,
        height: composite.height,
        width: composite.width,
      });
      await host.execution.runConnected({
        capabilityId,
        connectionId,
        inputs: [
          { blockId: sourceBlockId, slotId: 'source_image' },
          {
            assetId: compositeAsset.assetId,
            slotId: 'annotated_composite',
          },
        ],
        outputCount,
        parameters: {
          manifest: annotationDraftJson(manifest),
        },
        prompt: compiledInstruction,
      });
      annotationPanelStore.close();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : copy.failed);
      setPending(false);
    }
  }

  return (
    <>
      <style>{imageStudioStyles + annotationStyles}</style>
      <section
        aria-label={copy.title}
        aria-busy={pending}
        className="retake-image-studio-panel is-annotation"
        data-retake-image-studio="annotation"
        onKeyDown={onPanelKeyDown}
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
            onClick={() => annotationPanelStore.close()}
            type="button"
          >
            ×
          </button>
        </header>

        {isHistorical ? (
          <p className="retake-annotation-notice">{copy.historical}</p>
        ) : null}

        <div className="retake-annotation-tools">
          <AnnotationToolButton
            active={activeTool === 'select'}
            disabled={pending}
            label={copy.select}
            onClick={() => setActiveTool('select')}
          />
          {tools.map((tool) => (
            <AnnotationToolButton
              active={activeTool === tool}
              disabled={pending}
              key={tool}
              label={annotationKindLabel(tool, copy)}
              onClick={() => setActiveTool(tool)}
            />
          ))}
          <AnnotationToolButton
            active={activeTool === 'eraser'}
            disabled={pending}
            label={copy.eraser}
            onClick={() => setActiveTool('eraser')}
          />
          <AnnotationToolButton
            disabled={pending || historyRef.current.past.length === 0}
            label={copy.undo}
            onClick={undo}
          />
          <AnnotationToolButton
            disabled={pending || historyRef.current.future.length === 0}
            label={copy.redo}
            onClick={redo}
          />
          <AnnotationToolButton
            disabled={pending || marks.length === 0}
            label={copy.clear}
            onClick={() => {
              if (marks.length === 0) return;
              recordHistory();
              updateMarks(() => []);
              setSelectedMarkId(null);
            }}
          />
        </div>

        <div className="retake-annotation-workspace">
          <div className="retake-annotation-stage-shell">
            {source.url ? (
              <div
                className="retake-annotation-stage"
                style={{
                  aspectRatio: imageAspectRatio ?? 1,
                  transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                  width: imageAspectRatio
                    ? `min(100%, 620px, ${62 * imageAspectRatio}vh)`
                    : 'min(100%, 620px)',
                }}
              >
                <img
                  alt={source.title}
                  draggable={false}
                  onLoad={(event) => {
                    const image = event.currentTarget;
                    if (image.naturalWidth && image.naturalHeight) {
                      setImageAspectRatio(
                        image.naturalWidth / image.naturalHeight,
                      );
                    }
                  }}
                  src={source.url}
                />
                <div
                  className="retake-annotation-pointer-layer"
                  onPointerCancel={finishGesture}
                  onPointerDown={onStagePointerDown}
                  onPointerMove={onStagePointerMove}
                  onPointerLeave={() => setHoveredMarkId(null)}
                  onPointerUp={finishGesture}
                  ref={stageRef}
                  role="application"
                  tabIndex={0}
                >
                  <svg
                    aria-hidden="true"
                    preserveAspectRatio="none"
                    viewBox="0 0 1 1"
                  >
                    <AnnotationArrowDefinitions />
                    {marks.map((mark) => (
                      <AnnotationOverlayMark
                        key={mark.id}
                        mark={mark}
                        selected={
                          selectedMarkId === mark.id
                          || hoveredMarkId === mark.id
                        }
                      />
                    ))}
                  </svg>
                </div>
              </div>
            ) : (
              <p className="retake-image-studio-panel__error">
                {copy.sourceUnavailable}
              </p>
            )}
          </div>
          <div className="retake-annotation-zoom">
            <button
              aria-label={copy.zoomOut}
              disabled={pending || zoom <= 1}
              onClick={() => {
                setZoom((current) => Math.max(1, current - 0.25));
                if (zoom <= 1.25) setPan({ x: 0, y: 0 });
              }}
              type="button"
            >
              −
            </button>
            <span>{Math.round(zoom * 100)}%</span>
            <button
              aria-label={copy.zoomIn}
              disabled={pending || zoom >= 4}
              onClick={() => setZoom((current) => Math.min(4, current + 0.25))}
              type="button"
            >
              +
            </button>
            <button
              disabled={pending}
              onClick={() => {
                setPan({ x: 0, y: 0 });
                setZoom(1);
              }}
              type="button"
            >
              {copy.zoomReset}
            </button>
          </div>
          <small className="retake-annotation-pan-hint">{copy.panHint}</small>
        </div>

        <div className="retake-annotation-settings">
          <fieldset disabled={pending}>
            <legend>{copy.color}</legend>
            <div className="retake-annotation-swatches">
              {annotationColorOptions.map((option) => (
                <button
                  aria-label={annotationColorLabel(option.value, copy)}
                  className={color === option.value ? 'is-active' : ''}
                  key={option.value}
                  onClick={() => {
                    setColor(option.value);
                    if (!selectedMarkId) return;
                    recordHistory();
                    updateMarks((current) => current.map((mark) => (
                      mark.id === selectedMarkId
                        ? { ...mark, color: option.value }
                        : mark
                    )));
                  }}
                  style={{ background: option.value }}
                  type="button"
                />
              ))}
            </div>
          </fieldset>
          <fieldset disabled={pending}>
            <legend>{copy.stroke}</legend>
            <div className="retake-annotation-strokes">
              {strokeSizes.map((size) => (
                <button
                  className={strokeSize === size ? 'is-active' : ''}
                  key={size}
                  onClick={() => {
                    setStrokeSize(size);
                    if (!selectedMarkId) return;
                    recordHistory();
                    updateMarks((current) => current.map((mark) => (
                      mark.id === selectedMarkId
                        ? { ...mark, strokeSize: size }
                        : mark
                    )));
                  }}
                  type="button"
                >
                  {size.toUpperCase()}
                </button>
              ))}
            </div>
          </fieldset>
        </div>

        <div className="retake-annotation-intents">
          <strong>{copy.intent}</strong>
          {marks.length === 0 ? <p>{copy.noMarks}</p> : marks.map((mark) => (
            <label
              className={selectedMarkId === mark.id ? 'is-selected' : ''}
              key={mark.id}
            >
              <button
                disabled={pending}
                onClick={() => setSelectedMarkId(mark.id)}
                type="button"
              >
                <i style={{ background: mark.color }} />
                {mark.id} · {annotationKindLabel(mark.kind, copy)}
              </button>
              <button
                aria-label={`${copy.deleteMark} ${mark.id}`}
                className="retake-annotation-delete"
                disabled={pending}
                onClick={() => {
                  recordHistory();
                  updateMarks((current) => (
                    current.filter((candidate) => candidate.id !== mark.id)
                  ));
                  if (selectedMarkId === mark.id) setSelectedMarkId(null);
                }}
                type="button"
              >
                ×
              </button>
              <textarea
                disabled={pending}
                maxLength={annotationLimits.markIntentLength}
                name={`annotation-intent-${mark.id}`}
                onChange={(event) => {
                  const intent = event.target.value;
                  updateMarks((current) => current.map((candidate) => (
                    candidate.id === mark.id
                      ? { ...candidate, intent }
                      : candidate
                  )));
                }}
                onFocus={() => setSelectedMarkId(mark.id)}
                placeholder={copy.intentPlaceholder}
                ref={(element) => {
                  if (element) intentRefs.current.set(mark.id, element);
                  else intentRefs.current.delete(mark.id);
                }}
                rows={2}
                value={mark.intent}
              />
            </label>
          ))}
        </div>

        <label className="retake-annotation-global">
          <span>{copy.globalInstruction}</span>
          <textarea
            disabled={pending}
            maxLength={annotationLimits.globalInstructionLength}
            name="annotation-global-instruction"
            onChange={(event) => {
              setGlobalInstruction(event.target.value);
              setDraftRevision((revision) => revision + 1);
            }}
            placeholder={copy.globalPlaceholder}
            rows={3}
            value={globalInstruction}
          />
        </label>

        <div className="retake-annotation-execution">
          <label>
            <span>{copy.connection}</span>
            <select
              disabled={pending || connections.length === 0}
              name="annotation-connection"
              onChange={(event) => setConnectionId(event.target.value)}
              value={connectionId}
            >
              {connections.map((connection) => (
                <option
                  key={connection.connectionId}
                  value={connection.connectionId}
                >
                  {connection.displayName}
                  {connection.modelLabel ? ` · ${connection.modelLabel}` : ''}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>{copy.candidateCount}</span>
            <select
              disabled={pending}
              name="annotation-candidate-count"
              onChange={(event) => {
                setOutputCount(
                  Number(event.target.value) as 1 | 2 | 3 | 4,
                );
              }}
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
        {!sourceIsBound ? (
          <p className="retake-image-studio-panel__error">
            {copy.sourceUnavailable}
          </p>
        ) : null}
        {missingIntentIds.length > 0 ? (
          <p className="retake-image-studio-panel__error">
            {copy.missingIntent}: {missingIntentIds.join(', ')}
          </p>
        ) : null}
        {error ? (
          <p className="retake-image-studio-panel__error" role="alert">
            {error}
          </p>
        ) : null}

        <details className="retake-annotation-prompt">
          <summary>{copy.promptPreview}</summary>
          <pre>{compiledInstruction}</pre>
        </details>

        <button
          className="retake-image-studio-panel__run"
          disabled={!canRun}
          onClick={() => void run()}
          type="button"
        >
          {pending ? copy.running : copy.run}
        </button>
      </section>
    </>
  );
}
