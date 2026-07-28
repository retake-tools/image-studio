export const annotationColorOptions = [
  { name: 'red', value: '#dc2626' },
  { name: 'yellow', value: '#facc15' },
  { name: 'green', value: '#22c55e' },
  { name: 'blue', value: '#2563eb' },
  { name: 'purple', value: '#a855f7' },
] as const;

export type AnnotationColor =
  (typeof annotationColorOptions)[number]['value'];
export type AnnotationMarkKind =
  | 'arrow'
  | 'brush'
  | 'ellipse'
  | 'marker'
  | 'pen'
  | 'rect';
export type AnnotationStrokeSize = 'l' | 'm' | 's' | 'xl' | 'xs';
export type AnnotationEndpoint =
  | 'end'
  | 'endXStartY'
  | 'start'
  | 'startXEndY';

export interface AnnotationPoint {
  x: number;
  y: number;
}

interface BaseAnnotationMark {
  color: AnnotationColor;
  id: string;
  intent: string;
  strokeSize: AnnotationStrokeSize;
}

export interface MarkerAnnotationMark extends BaseAnnotationMark {
  kind: 'marker';
  point: AnnotationPoint;
}

interface PositionedAnnotationMark extends BaseAnnotationMark {
  end: AnnotationPoint;
  start: AnnotationPoint;
}

export type LineAnnotationMark =
  | (PositionedAnnotationMark & { kind: 'arrow' })
  | (PositionedAnnotationMark & { kind: 'ellipse' })
  | (PositionedAnnotationMark & { kind: 'rect' });

interface PointsAnnotationMark extends BaseAnnotationMark {
  points: AnnotationPoint[];
}

export type PathAnnotationMark =
  | (PointsAnnotationMark & { kind: 'brush' })
  | (PointsAnnotationMark & { kind: 'pen' });

export type AnnotationMark =
  | LineAnnotationMark
  | MarkerAnnotationMark
  | PathAnnotationMark;

export interface AnnotationManifest {
  globalInstruction: string;
  marks: AnnotationMark[];
  schemaVersion: 1;
}

export interface AnnotationDraft extends AnnotationManifest {
  sourceAssetId?: string;
}

export interface AnnotationComposite {
  dataUrl: string;
  height: number;
  width: number;
}

export const annotationLimits = {
  globalInstructionLength: 32_000,
  markCount: 256,
  markIdLength: 64,
  markIntentLength: 32_000,
  pathPointCount: 8_192,
  sourceAssetIdLength: 512,
} as const;

export const strokeBySize = {
  l: 2.8,
  m: 1.8,
  s: 1.2,
  xl: 4,
  xs: 0.8,
} satisfies Record<AnnotationStrokeSize, number>;

export function annotationBrushStrokeWidthPixels(
  strokeSize: AnnotationStrokeSize,
  imageWidth: number,
  imageHeight: number,
): number {
  return strokeBySize[strokeSize]
    * 9
    * Math.max(imageWidth, imageHeight)
    / 900;
}

export function fitAnnotationStage(
  imageAspectRatio: number | null,
  availableWidth: number,
  availableHeight: number,
): { height: number; width: number } | null {
  if (
    !imageAspectRatio
    || !Number.isFinite(imageAspectRatio)
    || imageAspectRatio <= 0
    || !Number.isFinite(availableWidth)
    || !Number.isFinite(availableHeight)
    || availableWidth <= 0
    || availableHeight <= 0
  ) return null;

  const availableAspectRatio = availableWidth / availableHeight;
  if (availableAspectRatio > imageAspectRatio) {
    return {
      height: availableHeight,
      width: availableHeight * imageAspectRatio,
    };
  }
  return {
    height: availableWidth / imageAspectRatio,
    width: availableWidth,
  };
}

const markPrefixes = {
  arrow: 'A',
  brush: 'B',
  ellipse: 'C',
  marker: 'M',
  pen: 'S',
  rect: 'R',
} satisfies Record<AnnotationMarkKind, string>;

const markDescriptions = {
  arrow: 'directional arrow',
  brush: 'semi-transparent brushed region',
  ellipse: 'ellipse',
  marker: 'numbered point marker',
  pen: 'freehand line or outline',
  rect: 'rectangle',
} satisfies Record<AnnotationMarkKind, string>;

export function annotationDraftHasContent(draft: AnnotationDraft): boolean {
  return Boolean(draft.globalInstruction.trim() || draft.marks.length);
}

export function annotationMarksMissingIntent(
  manifest: AnnotationManifest,
): string[] {
  if (manifest.globalInstruction.trim()) return [];
  return manifest.marks
    .filter((mark) => !mark.intent.trim())
    .map((mark) => mark.id);
}

export function hasExecutableAnnotationIntent(
  manifest: AnnotationManifest,
): boolean {
  return Boolean(
    manifest.globalInstruction.trim()
    || manifest.marks.some((mark) => mark.intent.trim()),
  );
}

export function nextAnnotationMarkId(
  marks: readonly AnnotationMark[],
  kind: AnnotationMarkKind,
): string {
  const prefix = markPrefixes[kind];
  const highest = marks.reduce((current, mark) => {
    if (!mark.id.startsWith(prefix)) return current;
    const suffix = Number.parseInt(mark.id.slice(prefix.length), 10);
    return Number.isFinite(suffix)
      ? Math.max(current, suffix)
      : current;
  }, 0);
  return `${prefix}${highest + 1}`;
}

export function createAnnotationMark(
  kind: AnnotationMarkKind,
  point: AnnotationPoint,
  color: AnnotationColor,
  strokeSize: AnnotationStrokeSize,
  marks: readonly AnnotationMark[],
): AnnotationMark {
  const base = {
    color,
    id: nextAnnotationMarkId(marks, kind),
    intent: '',
    strokeSize,
  };
  if (kind === 'marker') {
    return { ...base, kind, point };
  }
  if (kind === 'pen' || kind === 'brush') {
    return { ...base, kind, points: [point] };
  }
  if (kind === 'arrow') {
    return {
      ...base,
      end: clampPoint({ x: point.x + 0.16, y: point.y - 0.08 }),
      kind,
      start: point,
    };
  }
  if (kind === 'rect') {
    return { ...base, end: point, kind, start: point };
  }
  return { ...base, end: point, kind: 'ellipse', start: point };
}

export function updateDrawingAnnotationMark(
  mark: AnnotationMark,
  point: AnnotationPoint,
): AnnotationMark {
  if (mark.kind === 'marker') return { ...mark, point };
  if (mark.kind === 'pen' || mark.kind === 'brush') {
    const previous = mark.points.at(-1);
    if (previous && distance(previous, point) < 0.0025) return mark;
    if (mark.points.length >= annotationLimits.pathPointCount) return mark;
    return { ...mark, points: [...mark.points, point] };
  }
  return { ...mark, end: point };
}

export function finalizeDrawingAnnotationMark(
  mark: AnnotationMark,
): AnnotationMark | null {
  if (mark.kind === 'pen' || mark.kind === 'brush') {
    return mark.points.length >= 2 ? mark : null;
  }
  if (mark.kind === 'rect' || mark.kind === 'ellipse') {
    return distance(mark.start, mark.end) > 0.015 ? mark : null;
  }
  if (mark.kind === 'arrow' && distance(mark.start, mark.end) <= 0.015) {
    return {
      ...mark,
      end: clampPoint({
        x: mark.start.x + 0.16,
        y: mark.start.y - 0.08,
      }),
    };
  }
  return mark;
}

export function hitTestAnnotationMark(
  marks: readonly AnnotationMark[],
  point: AnnotationPoint,
): AnnotationMark | undefined {
  return [...marks].reverse().find((mark) => {
    if (mark.kind === 'marker') return distance(mark.point, point) < 0.055;
    if (mark.kind === 'pen' || mark.kind === 'brush') {
      const threshold = mark.kind === 'brush' ? 0.065 : 0.035;
      return mark.points.some((candidate) => (
        distance(candidate, point) < threshold
      ));
    }
    if (mark.kind === 'arrow') {
      return distanceToSegment(point, mark.start, mark.end) < 0.04;
    }
    const bounds = normalizedBounds(mark.start, mark.end);
    return mark.kind === 'rect'
      ? distanceToRectBorder(point, bounds) < 0.04
      : distanceToEllipseBorder(point, bounds) < 0.04;
  });
}

export function hitTestAnnotationEndpoint(
  mark: AnnotationMark | undefined,
  point: AnnotationPoint,
): AnnotationEndpoint | null {
  if (!mark || (mark.kind !== 'arrow' && mark.kind !== 'rect')) return null;
  const candidates: Array<{
    endpoint: AnnotationEndpoint;
    point: AnnotationPoint;
  }> = mark.kind === 'arrow'
    ? [
        { endpoint: 'start', point: mark.start },
        { endpoint: 'end', point: mark.end },
      ]
    : [
        { endpoint: 'start', point: mark.start },
        { endpoint: 'end', point: mark.end },
        {
          endpoint: 'startXEndY',
          point: { x: mark.start.x, y: mark.end.y },
        },
        {
          endpoint: 'endXStartY',
          point: { x: mark.end.x, y: mark.start.y },
        },
      ];
  return candidates.find(
    (candidate) => distance(candidate.point, point) <= 0.028,
  )?.endpoint ?? null;
}

export function updateAnnotationEndpoint(
  mark: AnnotationMark,
  endpoint: AnnotationEndpoint,
  point: AnnotationPoint,
): AnnotationMark {
  if (mark.kind !== 'arrow' && mark.kind !== 'rect') return mark;
  if (endpoint === 'start') return { ...mark, start: clampPoint(point) };
  if (endpoint === 'end') return { ...mark, end: clampPoint(point) };
  if (mark.kind !== 'rect') return mark;
  if (endpoint === 'startXEndY') {
    return {
      ...mark,
      end: { ...mark.end, y: clamp(point.y, 0, 1) },
      start: { ...mark.start, x: clamp(point.x, 0, 1) },
    };
  }
  return {
    ...mark,
    end: { ...mark.end, x: clamp(point.x, 0, 1) },
    start: { ...mark.start, y: clamp(point.y, 0, 1) },
  };
}

export function translateAnnotationMark(
  mark: AnnotationMark,
  dx: number,
  dy: number,
): AnnotationMark {
  const translate = (point: AnnotationPoint): AnnotationPoint => (
    clampPoint({ x: point.x + dx, y: point.y + dy })
  );
  if (mark.kind === 'marker') {
    return { ...mark, point: translate(mark.point) };
  }
  if (mark.kind === 'pen' || mark.kind === 'brush') {
    return { ...mark, points: mark.points.map(translate) };
  }
  return {
    ...mark,
    end: translate(mark.end),
    start: translate(mark.start),
  };
}

export function normalizedBounds(
  start: AnnotationPoint,
  end: AnnotationPoint,
): { height: number; width: number; x: number; y: number } {
  return {
    height: Math.abs(end.y - start.y),
    width: Math.abs(end.x - start.x),
    x: Math.min(start.x, end.x),
    y: Math.min(start.y, end.y),
  };
}

export function compileAnnotationInstruction(
  manifest: AnnotationManifest,
): string {
  const markLines = manifest.marks.map((mark) => {
    const intent = mark.intent.trim();
    const fallback = manifest.globalInstruction.trim()
      ? 'Apply the global instruction to this marked location.'
      : 'No edit instruction was provided for this mark.';
    return [
      `- ${mark.id}: ${annotationColorName(mark.color)}`,
      `${markDescriptions[mark.kind]}; geometry:`,
      `${annotationGeometryDescription(mark)}.`,
      intent || fallback,
    ].join(' ');
  });
  const globalInstruction = manifest.globalInstruction.trim();
  const hasDirectionalArrow = manifest.marks.some(
    (mark) => mark.kind === 'arrow',
  );
  return [
    'Edit the clean source image using the visible annotations in the annotated composite as spatial references.',
    markLines.length ? '' : undefined,
    markLines.length ? 'Annotation legend:' : undefined,
    ...markLines,
    markLines.length ? '' : undefined,
    markLines.length
      ? 'Geometry coordinates are normalized to the clean source image: x runs left-to-right and y runs top-to-bottom. Use them to keep position, size, and movement precise; use the visible composite for the exact contour.'
      : undefined,
    markLines.length
      ? 'Annotation colors identify marks only. Do not use a mark color as the requested output color unless its instruction explicitly says so.'
      : undefined,
    hasDirectionalArrow
      ? 'For directional arrows, the tail is the start and the arrowhead is the destination or direction. Use the mark instruction to decide whether the arrow means move, point, extend, connect, or orient.'
      : undefined,
    globalInstruction ? '' : undefined,
    globalInstruction ? 'Global instruction:' : undefined,
    globalInstruction || undefined,
    '',
    'Preserve all unmarked content, subject identity, composition, camera, lighting, and style unless an instruction explicitly changes them.',
    'Return a clean final image without annotation IDs, markers, arrows, outlines, brush overlays, annotation notes, or editor UI.',
  ].filter((line): line is string => typeof line === 'string').join('\n');
}

export function annotationDraftFromUnknown(
  value: unknown,
): AnnotationDraft | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const candidate = value as Record<string, unknown>;
  if (
    candidate.schemaVersion !== 1
    || typeof candidate.globalInstruction !== 'string'
    || candidate.globalInstruction.length
      > annotationLimits.globalInstructionLength
    || !Array.isArray(candidate.marks)
    || candidate.marks.length > annotationLimits.markCount
    || (
      candidate.sourceAssetId !== undefined
      && (
        typeof candidate.sourceAssetId !== 'string'
        || candidate.sourceAssetId.length === 0
        || candidate.sourceAssetId.length
          > annotationLimits.sourceAssetIdLength
      )
    )
  ) return null;
  const marks = candidate.marks.map(parseAnnotationMark);
  if (
    marks.some((mark) => mark === null)
    || new Set(marks.map((mark) => mark?.id)).size !== marks.length
  ) return null;
  return {
    globalInstruction: candidate.globalInstruction,
    marks: marks.filter((mark): mark is AnnotationMark => mark !== null),
    schemaVersion: 1,
    ...(typeof candidate.sourceAssetId === 'string'
      ? { sourceAssetId: candidate.sourceAssetId }
      : {}),
  };
}

export async function createAnnotatedComposite(
  imageUrl: string,
  marks: readonly AnnotationMark[],
): Promise<AnnotationComposite> {
  const image = await loadImage(imageUrl);
  const width = image.naturalWidth || 1024;
  const height = image.naturalHeight || 768;
  validateAnnotationDimensions({ height, width });
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Could not create annotation canvas.');
  context.drawImage(image, 0, 0, width, height);
  for (const mark of marks) drawCanvasMark(context, mark, width, height);
  return {
    dataUrl: canvas.toDataURL('image/png'),
    height,
    width,
  };
}

export function validateAnnotationDimensions(input: {
  height: number;
  width: number;
}): { height: number; width: number } {
  const { height, width } = input;
  if (
    !Number.isInteger(width)
    || !Number.isInteger(height)
    || width <= 0
    || height <= 0
  ) {
    throw new Error('Annotation source dimensions must be positive integers.');
  }
  if (width > 8_192 || height > 8_192) {
    throw new Error('Annotation source dimensions must not exceed 8192px.');
  }
  if (width * height > 32_000_000) {
    throw new Error('Annotation source must not exceed 32 megapixels.');
  }
  return { height, width };
}

function parseAnnotationMark(value: unknown): AnnotationMark | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const mark = value as Record<string, unknown>;
  if (
    typeof mark.id !== 'string'
    || mark.id.length === 0
    || mark.id.length > annotationLimits.markIdLength
    || typeof mark.intent !== 'string'
    || mark.intent.length > annotationLimits.markIntentLength
    || !isAnnotationColor(mark.color)
    || !isAnnotationStrokeSize(mark.strokeSize)
  ) return null;
  const base = {
    color: mark.color,
    id: mark.id,
    intent: mark.intent,
    strokeSize: mark.strokeSize,
  };
  if (mark.kind === 'marker') {
    const point = parsePoint(mark.point);
    return point ? { ...base, kind: mark.kind, point } : null;
  }
  if (mark.kind === 'pen' || mark.kind === 'brush') {
    if (
      !Array.isArray(mark.points)
      || mark.points.length === 0
      || mark.points.length > annotationLimits.pathPointCount
    ) return null;
    const points = mark.points.map(parsePoint);
    return points.some((point) => point === null)
      ? null
      : {
          ...base,
          kind: mark.kind,
          points: points.filter(
            (point): point is AnnotationPoint => point !== null,
          ),
        };
  }
  if (
    mark.kind !== 'arrow'
    && mark.kind !== 'rect'
    && mark.kind !== 'ellipse'
  ) return null;
  const start = parsePoint(mark.start);
  const end = parsePoint(mark.end);
  if (!start || !end) return null;
  if (mark.kind === 'arrow') {
    return { ...base, end, kind: mark.kind, start };
  }
  if (mark.kind === 'rect') {
    return { ...base, end, kind: mark.kind, start };
  }
  return { ...base, end, kind: mark.kind, start };
}

function parsePoint(value: unknown): AnnotationPoint | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const point = value as Record<string, unknown>;
  if (
    typeof point.x === 'number'
    && Number.isFinite(point.x)
    && point.x >= 0
    && point.x <= 1
    && typeof point.y === 'number'
    && Number.isFinite(point.y)
    && point.y >= 0
    && point.y <= 1
  ) return { x: point.x, y: point.y };
  return null;
}

function isAnnotationColor(value: unknown): value is AnnotationColor {
  return annotationColorOptions.some((option) => option.value === value);
}

function isAnnotationStrokeSize(
  value: unknown,
): value is AnnotationStrokeSize {
  return (
    value === 'xs'
    || value === 's'
    || value === 'm'
    || value === 'l'
    || value === 'xl'
  );
}

function annotationColorName(color: AnnotationColor): string {
  return annotationColorOptions.find(
    (option) => option.value === color,
  )?.name ?? color;
}

function annotationGeometryDescription(mark: AnnotationMark): string {
  if (mark.kind === 'marker') {
    return `point (${format(mark.point.x)}, ${format(mark.point.y)})`;
  }
  if (mark.kind === 'pen' || mark.kind === 'brush') {
    const bounds = mark.points.reduce(
      (current, point) => ({
        maxX: Math.max(current.maxX, point.x),
        maxY: Math.max(current.maxY, point.y),
        minX: Math.min(current.minX, point.x),
        minY: Math.min(current.minY, point.y),
      }),
      {
        maxX: mark.points[0]?.x ?? 0.5,
        maxY: mark.points[0]?.y ?? 0.5,
        minX: mark.points[0]?.x ?? 0.5,
        minY: mark.points[0]?.y ?? 0.5,
      },
    );
    return [
      `path with ${mark.points.length} points`,
      `inside (${format(bounds.minX)}, ${format(bounds.minY)})`,
      `to (${format(bounds.maxX)}, ${format(bounds.maxY)})`,
    ].join(' ');
  }
  return [
    `start (${format(mark.start.x)}, ${format(mark.start.y)})`,
    `end (${format(mark.end.x)}, ${format(mark.end.y)})`,
  ].join(', ');
}

function drawCanvasMark(
  context: CanvasRenderingContext2D,
  mark: AnnotationMark,
  width: number,
  height: number,
): void {
  context.save();
  context.fillStyle = mark.color;
  context.strokeStyle = mark.color;
  context.lineCap = 'round';
  context.lineJoin = 'round';
  context.lineWidth = strokeBySize[mark.strokeSize]
    * Math.max(width, height) / 900;
  if (mark.kind === 'marker') {
    drawLocationPin(context, mark.id, mark.point, width, height, mark.color);
  } else if (mark.kind === 'arrow') {
    drawArrow(
      context,
      scalePoint(mark.start, width, height),
      scalePoint(mark.end, width, height),
    );
  } else if (mark.kind === 'pen' || mark.kind === 'brush') {
    if (mark.kind === 'brush') {
      context.globalAlpha = 0.38;
      context.lineWidth = strokeBySize[mark.strokeSize]
        * 9 * Math.max(width, height) / 900;
    }
    context.beginPath();
    if (mark.points.length === 1 && mark.points[0]) {
      const scaled = scalePoint(mark.points[0], width, height);
      context.arc(
        scaled.x,
        scaled.y,
        context.lineWidth / 2,
        0,
        Math.PI * 2,
      );
      context.fill();
    } else {
      mark.points.forEach((point, index) => {
        const scaled = scalePoint(point, width, height);
        if (index === 0) context.moveTo(scaled.x, scaled.y);
        else context.lineTo(scaled.x, scaled.y);
      });
      context.stroke();
    }
  } else {
    const bounds = normalizedBounds(
      scalePoint(mark.start, width, height),
      scalePoint(mark.end, width, height),
    );
    if (mark.kind === 'ellipse') {
      context.beginPath();
      context.ellipse(
        bounds.x + bounds.width / 2,
        bounds.y + bounds.height / 2,
        bounds.width / 2,
        bounds.height / 2,
        0,
        0,
        Math.PI * 2,
      );
      context.stroke();
    } else {
      context.strokeRect(
        bounds.x,
        bounds.y,
        bounds.width,
        bounds.height,
      );
    }
  }
  context.restore();
  if (mark.kind !== 'marker') {
    drawIdBadge(
      context,
      mark.id,
      annotationAnchor(mark),
      width,
      height,
      mark.color,
    );
  }
}

function drawLocationPin(
  context: CanvasRenderingContext2D,
  id: string,
  anchor: AnnotationPoint,
  width: number,
  height: number,
  color: string,
): void {
  const radius = Math.max(18, Math.min(32, width / 34));
  const tip = {
    x: clamp(anchor.x * width, radius + 4, width - radius - 4),
    y: clamp(anchor.y * height, radius * 2.9 + 4, height - 4),
  };
  const center = { x: tip.x, y: tip.y - radius * 1.7 };
  context.save();
  context.fillStyle = color;
  context.strokeStyle = '#fff';
  context.lineWidth = Math.max(2.5, radius * 0.12);
  context.beginPath();
  context.moveTo(tip.x, tip.y);
  context.lineTo(center.x - radius * 0.62, center.y + radius * 0.5);
  context.lineTo(center.x + radius * 0.62, center.y + radius * 0.5);
  context.closePath();
  context.fill();
  context.stroke();
  context.beginPath();
  context.arc(center.x, center.y, radius, 0, Math.PI * 2);
  context.fill();
  context.stroke();
  context.fillStyle = '#fff';
  context.font = `850 ${radius * 0.82}px Inter, Arial, sans-serif`;
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillText(id, center.x, center.y);
  context.restore();
}

function drawIdBadge(
  context: CanvasRenderingContext2D,
  id: string,
  anchor: AnnotationPoint,
  width: number,
  height: number,
  color: string,
): void {
  const fontSize = Math.max(16, Math.min(28, width / 42));
  const radius = fontSize * 1.12;
  const x = clamp(anchor.x * width, radius + 4, width - radius - 4);
  const y = clamp(anchor.y * height, radius + 4, height - radius - 4);
  context.save();
  context.fillStyle = color;
  context.strokeStyle = '#fff';
  context.lineWidth = Math.max(2, fontSize * 0.12);
  context.beginPath();
  context.arc(x, y, radius, 0, Math.PI * 2);
  context.fill();
  context.stroke();
  context.fillStyle = '#fff';
  context.font = `850 ${fontSize}px Inter, Arial, sans-serif`;
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillText(id, x, y);
  context.restore();
}

function drawArrow(
  context: CanvasRenderingContext2D,
  start: AnnotationPoint,
  end: AnnotationPoint,
): void {
  const angle = Math.atan2(end.y - start.y, end.x - start.x);
  const headLength = Math.max(14, context.lineWidth * 4);
  context.beginPath();
  context.moveTo(start.x, start.y);
  context.lineTo(end.x, end.y);
  context.stroke();
  context.beginPath();
  context.moveTo(end.x, end.y);
  context.lineTo(
    end.x - headLength * Math.cos(angle - Math.PI / 6),
    end.y - headLength * Math.sin(angle - Math.PI / 6),
  );
  context.lineTo(
    end.x - headLength * Math.cos(angle + Math.PI / 6),
    end.y - headLength * Math.sin(angle + Math.PI / 6),
  );
  context.closePath();
  context.fill();
}

function annotationAnchor(mark: AnnotationMark): AnnotationPoint {
  if (mark.kind === 'marker') return mark.point;
  if (mark.kind === 'pen' || mark.kind === 'brush') {
    return mark.points[0] ?? { x: 0.5, y: 0.5 };
  }
  return mark.start;
}

function loadImage(source: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', () => {
      reject(new Error('Could not load annotation source image.'));
    });
    image.src = source;
  });
}

function scalePoint(
  point: AnnotationPoint,
  width: number,
  height: number,
): AnnotationPoint {
  return { x: point.x * width, y: point.y * height };
}

function clampPoint(point: AnnotationPoint): AnnotationPoint {
  return {
    x: clamp(point.x, 0, 1),
    y: clamp(point.y, 0, 1),
  };
}

function distance(left: AnnotationPoint, right: AnnotationPoint): number {
  return Math.hypot(left.x - right.x, left.y - right.y);
}

function distanceToSegment(
  point: AnnotationPoint,
  start: AnnotationPoint,
  end: AnnotationPoint,
): number {
  const lengthSquared = (end.x - start.x) ** 2 + (end.y - start.y) ** 2;
  if (lengthSquared === 0) return distance(point, start);
  const t = clamp(
    ((point.x - start.x) * (end.x - start.x)
      + (point.y - start.y) * (end.y - start.y)) / lengthSquared,
    0,
    1,
  );
  return distance(point, {
    x: start.x + t * (end.x - start.x),
    y: start.y + t * (end.y - start.y),
  });
}

function distanceToRectBorder(
  point: AnnotationPoint,
  bounds: { height: number; width: number; x: number; y: number },
): number {
  const topLeft = { x: bounds.x, y: bounds.y };
  const topRight = { x: bounds.x + bounds.width, y: bounds.y };
  const bottomLeft = { x: bounds.x, y: bounds.y + bounds.height };
  const bottomRight = {
    x: bounds.x + bounds.width,
    y: bounds.y + bounds.height,
  };
  return Math.min(
    distanceToSegment(point, topLeft, topRight),
    distanceToSegment(point, topRight, bottomRight),
    distanceToSegment(point, bottomRight, bottomLeft),
    distanceToSegment(point, bottomLeft, topLeft),
  );
}

function distanceToEllipseBorder(
  point: AnnotationPoint,
  bounds: { height: number; width: number; x: number; y: number },
): number {
  const radiusX = Math.max(bounds.width / 2, Number.EPSILON);
  const radiusY = Math.max(bounds.height / 2, Number.EPSILON);
  const centerX = bounds.x + radiusX;
  const centerY = bounds.y + radiusY;
  const normalizedRadius = Math.hypot(
    (point.x - centerX) / radiusX,
    (point.y - centerY) / radiusY,
  );
  return Math.abs(normalizedRadius - 1) * Math.min(radiusX, radiusY);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function format(value: number): string {
  return value.toFixed(4);
}
