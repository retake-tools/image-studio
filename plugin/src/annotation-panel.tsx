import React, {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent,
  type ReactElement,
  type WheelEvent,
} from 'react';
import {
  ArrowUpRight,
  Circle,
  Eraser,
  MapPin,
  Maximize2,
  MousePointer2,
  Paintbrush,
  PenLine,
  RectangleHorizontal,
  Redo2,
  RotateCcw,
  Trash2,
  Undo2,
  X,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import {
  imageStudioPanelClassName,
  type ImageStudioPanelProps,
} from './panel-presentation';
import {
  annotationColorOptions,
  annotationLimits,
  annotationMarksMissingIntent,
  compileAnnotationInstruction,
  createAnnotatedComposite,
  createAnnotationMark,
  createDefaultAnnotationEditScope,
  createDefaultAnnotationKeepItems,
  finalizeDrawingAnnotationMark,
  fitAnnotationStage,
  hasExecutableAnnotationIntent,
  hitTestAnnotationEndpoint,
  hitTestAnnotationMark,
  translateAnnotationMark,
  updateAnnotationEndpoint,
  updateDrawingAnnotationMark,
  type AnnotationColor,
  type AnnotationEndpoint,
  type AnnotationKeepItems,
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
import { AnnotationTaskPanel } from './annotation-task-panel';
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

function annotationStageTransform(
  pan: { x: number; y: number },
  zoom: number,
): string {
  if (
    Math.abs(pan.x) < 0.01
    && Math.abs(pan.y) < 0.01
    && Math.abs(zoom - 1) < 0.001
  ) return 'none';
  return `translate3d(${pan.x}px, ${pan.y}px, 0) scale(${zoom})`;
}

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
  presentation = 'overlay',
}: ImageStudioPanelProps): ReactElement | null {
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
  const [draftStatus, setDraftStatus] = useState<
    'failed' | 'saved' | 'saving'
  >('saved');
  const [error, setError] = useState<string | null>(null);
  const [globalInstruction, setGlobalInstruction] = useState('');
  const [hoveredMarkId, setHoveredMarkId] = useState<string | null>(null);
  const [imageAspectRatio, setImageAspectRatio] = useState<number | null>(null);
  const [keepItems, setKeepItems] = useState<AnnotationKeepItems>(
    createDefaultAnnotationKeepItems,
  );
  const [marks, setMarks] = useState<AnnotationMark[]>([]);
  const [outputCount, setOutputCount] = useState<1 | 2 | 3 | 4>(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [pending, setPending] = useState(false);
  const [selectedMarkId, setSelectedMarkId] = useState<string | null>(null);
  const [strokeSize, setStrokeSize] = useState<AnnotationStrokeSize>('m');
  const [stageShellSize, setStageShellSize] = useState({
    height: 0,
    width: 0,
  });
  const [zoom, setZoom] = useState(1);
  const gestureRef = useRef<Gesture>(null);
  const intentRefs = useRef(new Map<string, HTMLTextAreaElement>());
  const historyRef = useRef<{
    future: AnnotationMark[][];
    past: AnnotationMark[][];
  }>({ future: [], past: [] });
  const panRef = useRef(pan);
  const panelRef = useRef<HTMLElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const stageShellRef = useRef<HTMLDivElement | null>(null);
  const stageTransformFrameRef = useRef<number | undefined>(undefined);
  const stageVisualRef = useRef<HTMLDivElement | null>(null);
  const connections = sourceBlockId
    ? host.execution.listConnections({ capabilityId })
    : [];
  const connectionKey = connections.map(
    (connection) => `${connection.connectionId}:${connection.selectedByDefault}`,
  ).join('|');
  const sourceIsBound = Boolean(
    sourceBlockId && hostSnapshot.boundBlockIds.includes(sourceBlockId),
  );

  useLayoutEffect(() => {
    if (!source.blockId) return;
    const draft = initialAnnotationDraft(panel, host, source.asset?.assetId);
    setActiveTool('select');
    setColor(annotationColorOptions[0].value);
    setDraftRevision(0);
    setDraftStatus('saved');
    setError(null);
    setGlobalInstruction(draft?.globalInstruction ?? '');
    setHoveredMarkId(null);
    setImageAspectRatio(
      source.asset?.width && source.asset.height
        ? source.asset.width / source.asset.height
        : null,
    );
    setKeepItems(draft?.keepItems ?? createDefaultAnnotationKeepItems());
    setMarks(draft?.marks ?? []);
    setOutputCount(1);
    const nextPan = { x: 0, y: 0 };
    panRef.current = nextPan;
    setPan(nextPan);
    setPending(false);
    setSelectedMarkId(null);
    setStrokeSize('m');
    setZoom(1);
    gestureRef.current = null;
    historyRef.current = { future: [], past: [] };
  }, [panel.revision]);

  useLayoutEffect(() => {
    panelRef.current?.focus();
  }, [panel.revision]);

  useLayoutEffect(() => {
    if (!selectedMarkId) return;
    const frame = requestAnimationFrame(() => {
      intentRefs.current.get(selectedMarkId)?.focus();
    });
    return () => cancelAnimationFrame(frame);
  }, [marks.length, selectedMarkId]);

  useLayoutEffect(() => {
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
    setDraftStatus('saving');
    const timeout = window.setTimeout(() => {
      void saveCurrentDraft()
        .then(() => setDraftStatus('saved'))
        .catch((cause) => {
          setDraftStatus('failed');
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
    keepItems,
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

  useLayoutEffect(() => {
    const shell = stageShellRef.current;
    if (!shell) return;
    const stageShell = shell;

    function updateStageShellSize(): void {
      setStageShellSize((current) => {
        const next = {
          height: stageShell.clientHeight,
          width: stageShell.clientWidth,
        };
        return (
          Math.abs(current.height - next.height) < 0.5
          && Math.abs(current.width - next.width) < 0.5
        ) ? current : next;
      });
    }

    updateStageShellSize();
    const observer = typeof ResizeObserver === 'undefined'
      ? null
      : new ResizeObserver(updateStageShellSize);
    observer?.observe(stageShell);
    window.addEventListener('resize', updateStageShellSize);
    return () => {
      observer?.disconnect();
      window.removeEventListener('resize', updateStageShellSize);
    };
  }, [sourceBlockId]);

  useLayoutEffect(() => {
    panRef.current = pan;
  }, [pan.x, pan.y]);

  useEffect(() => () => {
    if (stageTransformFrameRef.current !== undefined) {
      window.cancelAnimationFrame(stageTransformFrameRef.current);
    }
  }, []);

  const manifest = useMemo<AnnotationManifest>(() => ({
    editScope: createDefaultAnnotationEditScope(),
    globalInstruction,
    keepItems,
    marks,
    outputMode: 'clean_edit',
    schemaVersion: 1,
  }), [globalInstruction, keepItems, marks]);
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
  const selectedMark = marks.find((mark) => mark.id === selectedMarkId);
  const hoveredMark = marks.find((mark) => mark.id === hoveredMarkId);
  const overlayActionMark = hoveredMark ?? selectedMark;
  const displayedSelectedMarkId = hoveredMarkId ?? selectedMarkId;
  const stageSize = fitAnnotationStage(
    imageAspectRatio,
    stageShellSize.width,
    stageShellSize.height,
  );

  if (!source.blockId) return null;

  function applyStageTransform(
    nextPan = panRef.current,
    nextZoom = zoom,
  ): void {
    panRef.current = nextPan;
    if (stageTransformFrameRef.current !== undefined) {
      window.cancelAnimationFrame(stageTransformFrameRef.current);
    }
    stageTransformFrameRef.current = window.requestAnimationFrame(() => {
      stageTransformFrameRef.current = undefined;
      if (!stageVisualRef.current) return;
      stageVisualRef.current.style.transform = annotationStageTransform(
        nextPan,
        nextZoom,
      );
    });
  }

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

  function selectMark(markId: string | null): void {
    setSelectedMarkId(markId);
    const mark = marks.find((candidate) => candidate.id === markId);
    if (!mark) return;
    setColor(mark.color);
    setStrokeSize(mark.strokeSize);
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
      stageVisualRef.current?.classList.add('is-panning');
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
      selectMark(hit?.id ?? null);
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
    setColor(mark.color);
    setStrokeSize(mark.strokeSize);
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
      applyStageTransform({
        x: panRef.current.x + event.clientX - gesture.lastClientX,
        y: panRef.current.y + event.clientY - gesture.lastClientY,
      });
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
    stageVisualRef.current?.classList.remove('is-panning');
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    if (gesture?.kind === 'pan') {
      setPan(panRef.current);
      return;
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
    if (event.key === 'Escape' && !pending) {
      event.preventDefault();
      event.stopPropagation();
      void closeWithoutExecution();
      return;
    }
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

  function onStageWheel(event: WheelEvent<HTMLDivElement>): void {
    event.preventDefault();
    event.stopPropagation();
    setZoom((current) => {
      const next = Math.min(5, Math.max(1, (
        current * Math.exp(-event.deltaY * 0.0014)
      )));
      if (next <= 1.001) {
        const nextPan = { x: 0, y: 0 };
        panRef.current = nextPan;
        setPan(nextPan);
      }
      return next;
    });
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

  async function saveCurrentDraft(): Promise<void> {
    if (isHistorical || !sourceBlockId || !sourceIsBound) return;
    await host.drafts.saveBound({
      blockId: sourceBlockId,
      capabilityId,
      value: annotationDraftJson({
        editScope: createDefaultAnnotationEditScope(),
        globalInstruction,
        keepItems,
        marks,
        outputMode: 'clean_edit',
        schemaVersion: 1,
        ...(sourceAssetId ? { sourceAssetId } : {}),
      }),
    });
  }

  async function closeWithoutExecution(): Promise<void> {
    if (pending) return;
    if (!isHistorical && draftRevision > 0) {
      setDraftStatus('saving');
      try {
        await saveCurrentDraft();
        setDraftStatus('saved');
      } catch (cause) {
        setDraftStatus('failed');
        setError(
          cause instanceof Error
            ? `${copy.draftFailed}: ${cause.message}`
            : copy.draftFailed,
        );
        return;
      }
    }
    annotationPanelStore.close();
  }

  return (
    <>
      <style>{imageStudioStyles + annotationStyles}</style>
      {presentation === 'overlay' ? (
        <div aria-hidden="true" className="retake-annotation-modal-layer" />
      ) : null}
      <section
        aria-label={copy.title}
        aria-busy={pending}
        aria-modal={presentation === 'overlay' ? true : undefined}
        className={imageStudioPanelClassName(
          'retake-image-studio-panel is-annotation nodrag nopan nowheel',
          presentation,
        )}
        data-retake-image-studio="annotation"
        onKeyDown={onPanelKeyDown}
        ref={panelRef}
        role={presentation === 'overlay' ? 'dialog' : 'region'}
        tabIndex={-1}
      >
        <header className="retake-image-studio-panel__header">
          <h2>{copy.title}</h2>
          <button
            aria-label={copy.close}
            className="retake-image-studio-panel__close"
            disabled={pending}
            onClick={() => void closeWithoutExecution()}
            type="button"
          >
            <X aria-hidden="true" size={16} />
          </button>
        </header>

        {isHistorical ? (
          <p className="retake-annotation-notice">{copy.historical}</p>
        ) : null}

        <div className="retake-annotation-editor">
          <div className="retake-annotation-editor-shell">
            <div
              aria-label={copy.title}
              className="retake-annotation-tools"
            >
              <AnnotationToolButton
                active={activeTool === 'select'}
                disabled={pending}
                label={copy.select}
                onClick={() => setActiveTool('select')}
              >
                <MousePointer2 aria-hidden="true" size={15} />
              </AnnotationToolButton>
              {tools.map((tool) => (
                <AnnotationToolButton
                  active={activeTool === tool}
                  disabled={pending}
                  key={tool}
                  label={annotationKindLabel(tool, copy)}
                  onClick={() => setActiveTool(tool)}
                >
                  <AnnotationKindIcon kind={tool} />
                </AnnotationToolButton>
              ))}
              <AnnotationToolButton
                active={activeTool === 'eraser'}
                disabled={pending}
                label={copy.eraser}
                onClick={() => setActiveTool('eraser')}
              >
                <Eraser aria-hidden="true" size={15} />
              </AnnotationToolButton>
              <span className="retake-annotation-tool-separator" />
              <AnnotationToolButton
                disabled={pending || historyRef.current.past.length === 0}
                label={copy.undo}
                onClick={undo}
              >
                <Undo2 aria-hidden="true" size={15} />
              </AnnotationToolButton>
              <AnnotationToolButton
                disabled={pending || historyRef.current.future.length === 0}
                label={copy.redo}
                onClick={redo}
              >
                <Redo2 aria-hidden="true" size={15} />
              </AnnotationToolButton>
              <AnnotationToolButton
                disabled={pending || marks.length === 0}
                label={copy.clear}
                onClick={() => {
                  if (
                    marks.length === 0
                    || !window.confirm(copy.clearConfirm)
                  ) return;
                  recordHistory();
                  updateMarks(() => []);
                  setSelectedMarkId(null);
                }}
              >
                <RotateCcw aria-hidden="true" size={15} />
              </AnnotationToolButton>
            </div>

            <div className="retake-annotation-workspace">
              <div
                className="retake-annotation-stage-shell"
                onWheelCapture={onStageWheel}
                ref={stageShellRef}
              >
                {source.url ? (
                  <div
                    className={`retake-annotation-stage is-${activeTool}-tool`}
                    ref={stageVisualRef}
                    style={{
                      ...(stageSize
                        ? {
                            height: stageSize.height,
                            width: stageSize.width,
                          }
                        : {
                            aspectRatio: imageAspectRatio ?? 1,
                            width: '100%',
                          }),
                      visibility: imageAspectRatio === null ? 'hidden' : 'visible',
                      transform: annotationStageTransform(pan, zoom),
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
                      onDoubleClick={(event) => {
                        if (activeTool !== 'select' || pending) return;
                        event.preventDefault();
                        event.stopPropagation();
                        gestureRef.current = null;
                        const nextPan = { x: 0, y: 0 };
                        panRef.current = nextPan;
                        setPan(nextPan);
                        setZoom(1);
                      }}
                      onPointerCancel={finishGesture}
                      onPointerDown={onStagePointerDown}
                      onPointerMove={onStagePointerMove}
                      onPointerLeave={(event) => {
                        if (gestureRef.current) return;
                        const relatedTarget = event.relatedTarget;
                        if (
                          relatedTarget instanceof Node
                          && event.currentTarget.parentElement?.contains(
                            relatedTarget,
                          )
                        ) return;
                        setHoveredMarkId(null);
                      }}
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
                            imageHeight={stageSize?.height ?? 1}
                            imageWidth={stageSize?.width ?? 1}
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
                    {hoveredMark?.intent.trim() ? (
                      <div
                        className="retake-annotation-hover-prompt"
                        role="tooltip"
                        style={annotationAnchorStyle(hoveredMark)}
                      >
                        <strong>{hoveredMark.id}</strong>
                        <span>{hoveredMark.intent.trim()}</span>
                      </div>
                    ) : null}
                    {overlayActionMark ? (
                      <button
                        aria-label={`${copy.deleteMark} ${overlayActionMark.id}`}
                        className="retake-annotation-quick-delete"
                        disabled={pending}
                        onClick={() => {
                          recordHistory();
                          updateMarks((current) => current.filter(
                            (mark) => mark.id !== overlayActionMark.id,
                          ));
                          if (selectedMarkId === overlayActionMark.id) {
                            setSelectedMarkId(null);
                          }
                          setHoveredMarkId(null);
                        }}
                        onPointerEnter={() => {
                          setHoveredMarkId(overlayActionMark.id);
                        }}
                        onPointerLeave={() => {
                          if (selectedMarkId !== overlayActionMark.id) {
                            setHoveredMarkId(null);
                          }
                        }}
                        style={annotationQuickDeleteStyle(
                          overlayActionMark,
                          stageSize?.width ?? 1,
                          stageSize?.height ?? 1,
                        )}
                        type="button"
                      >
                        <X aria-hidden="true" size={8} strokeWidth={2.25} />
                      </button>
                    ) : null}
                  </div>
                ) : (
                  <p className="retake-image-studio-panel__error">
                    {copy.sourceUnavailable}
                  </p>
                )}
                <div className="retake-annotation-zoom">
                  <button
                    aria-label={copy.zoomOut}
                    disabled={pending || zoom <= 1}
                    onClick={() => {
                      setZoom((current) => Math.max(1, current / 1.2));
                      if (zoom <= 1.2) {
                        const nextPan = { x: 0, y: 0 };
                        panRef.current = nextPan;
                        setPan(nextPan);
                      }
                    }}
                    type="button"
                  >
                    <ZoomOut aria-hidden="true" size={14} />
                  </button>
                  <span>{Math.round(zoom * 100)}%</span>
                  <button
                    aria-label={copy.zoomIn}
                    disabled={pending || zoom >= 5}
                    onClick={() => setZoom((current) => (
                      Math.min(5, current * 1.2)
                    ))}
                    type="button"
                  >
                    <ZoomIn aria-hidden="true" size={14} />
                  </button>
                  <button
                    aria-label={copy.zoomReset}
                    disabled={pending}
                    onClick={() => {
                      const nextPan = { x: 0, y: 0 };
                      panRef.current = nextPan;
                      setPan(nextPan);
                      setZoom(1);
                    }}
                    type="button"
                  >
                    <Maximize2 aria-hidden="true" size={14} />
                  </button>
                </div>
              </div>
              <small className="retake-annotation-pan-hint">
                {copy.panHint}
              </small>
            </div>

            <aside className="retake-annotation-side-panel">
              <AnnotationTaskPanel
                copy={copy}
                disabled={pending}
                draftStatus={draftStatus}
                globalInstruction={globalInstruction}
                keepItems={keepItems}
                marks={marks}
                onKeepItemsChange={(next) => {
                  setKeepItems(next);
                  setDraftRevision((revision) => revision + 1);
                }}
                showDraftStatus={!isHistorical}
              />

              <div className="retake-annotation-settings">
                <fieldset disabled={pending}>
                  <legend>
                    {selectedMark
                      ? `${selectedMark.id} · ${copy.color}`
                      : copy.color}
                  </legend>
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
                    className={
                      displayedSelectedMarkId === mark.id
                        ? 'is-selected'
                        : ''
                    }
                    key={mark.id}
                  >
                    <button
                      disabled={pending}
                      onClick={() => selectMark(mark.id)}
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
                      <Trash2 aria-hidden="true" size={12} />
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
                      onFocus={() => selectMark(mark.id)}
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

              <details className="retake-annotation-prompt">
                <summary>{copy.promptPreview}</summary>
                <pre>{compiledInstruction}</pre>
              </details>
            </aside>
          </div>

          <div className="retake-annotation-errors">
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
          </div>

          <div className="retake-annotation-run-controls">
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
            <div
              aria-label={copy.candidateCount}
              className="retake-annotation-result-count"
            >
              <span>{copy.candidateCount}</span>
              {[1, 2, 3, 4].map((count) => (
                <button
                  aria-pressed={outputCount === count}
                  className={outputCount === count ? 'is-active' : ''}
                  disabled={pending}
                  key={count}
                  onClick={() => setOutputCount(count as 1 | 2 | 3 | 4)}
                  type="button"
                >
                  {count}
                </button>
              ))}
            </div>
            <button
              className="retake-annotation-cancel"
              disabled={pending}
              onClick={() => void closeWithoutExecution()}
              type="button"
            >
              {copy.cancel}
            </button>
            <button
              className="retake-image-studio-panel__run"
              disabled={!canRun}
              onClick={() => void run()}
              type="button"
            >
              {pending ? copy.running : copy.done}
            </button>
          </div>
        </div>
      </section>
    </>
  );
}

function AnnotationKindIcon({
  kind,
}: {
  kind: AnnotationMarkKind;
}): ReactElement {
  if (kind === 'marker') return <MapPin aria-hidden="true" size={15} />;
  if (kind === 'arrow') return <ArrowUpRight aria-hidden="true" size={15} />;
  if (kind === 'pen') return <PenLine aria-hidden="true" size={15} />;
  if (kind === 'brush') return <Paintbrush aria-hidden="true" size={15} />;
  if (kind === 'rect') {
    return <RectangleHorizontal aria-hidden="true" size={15} />;
  }
  return <Circle aria-hidden="true" size={15} />;
}

function annotationAnchorStyle(mark: AnnotationMark): CSSProperties {
  const point = annotationMarkAnchor(mark);
  return {
    left: `${point.x * 100}%`,
    top: `${point.y * 100}%`,
  };
}

function annotationQuickDeleteStyle(
  mark: AnnotationMark,
  imageWidth: number,
  imageHeight: number,
): CSSProperties {
  const anchor = annotationMarkAnchor(mark);
  const fixedShapeYScale = imageWidth / imageHeight;
  const badgeCenter = mark.kind === 'marker'
    ? { x: mark.point.x, y: mark.point.y - 0.04 }
    : anchor;
  const radius = 0.014;
  const x = clamp(
    badgeCenter.x - 0.018,
    radius,
    1 - radius,
  );
  const y = clamp(
    badgeCenter.y - 0.018 * fixedShapeYScale,
    radius * fixedShapeYScale,
    1 - radius * fixedShapeYScale,
  );
  return {
    left: `${x * 100}%`,
    top: `${y * 100}%`,
  };
}

function annotationMarkAnchor(mark: AnnotationMark): AnnotationPoint {
  if (mark.kind === 'marker') return mark.point;
  if (mark.kind === 'pen' || mark.kind === 'brush') {
    return mark.points[0] ?? { x: 0.5, y: 0.5 };
  }
  return {
    x: (mark.start.x + mark.end.x) / 2,
    y: (mark.start.y + mark.end.y) / 2,
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
