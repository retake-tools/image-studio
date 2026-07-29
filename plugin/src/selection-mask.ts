export interface SelectionMaskPoint {
  readonly x: number;
  readonly y: number;
}

export type SelectionMaskTool = 'erase' | 'select';

export interface SelectionMaskStroke {
  readonly diameter: number;
  readonly points: readonly SelectionMaskPoint[];
  readonly tool: SelectionMaskTool;
}

export interface SelectionMaskState {
  readonly inverted: boolean;
  readonly strokes: readonly SelectionMaskStroke[];
}

export interface SelectionMaskDimensions {
  readonly height: number;
  readonly width: number;
}

export interface RenderedSelectionMask extends SelectionMaskDimensions {
  readonly dataUrl: string;
}

const maximumDimension = 8192;
const maximumPixels = 32_000_000;

export function normalizedSelectionPoint(
  x: number,
  y: number,
): SelectionMaskPoint {
  return {
    x: clamp(x, 0, 1),
    y: clamp(y, 0, 1),
  };
}

export function selectionMaskHasContent(
  state: SelectionMaskState,
): boolean {
  return state.inverted || state.strokes.some(
    (stroke) => stroke.tool === 'select' && stroke.points.length > 0,
  );
}

export function validateSelectionMaskDimensions(
  dimensions: SelectionMaskDimensions,
): SelectionMaskDimensions {
  const { height, width } = dimensions;
  if (
    !Number.isInteger(width)
    || !Number.isInteger(height)
    || width <= 0
    || height <= 0
  ) {
    throw new Error('Selection mask source dimensions must be positive integers.');
  }
  if (width > maximumDimension || height > maximumDimension) {
    throw new Error(`Selection mask dimensions cannot exceed ${maximumDimension}px.`);
  }
  if (width * height > maximumPixels) {
    throw new Error('Selection mask output cannot exceed 32 megapixels.');
  }
  return { height, width };
}

export function drawSelectionMask(
  context: CanvasRenderingContext2D,
  dimensions: SelectionMaskDimensions,
  state: SelectionMaskState,
): void {
  const { height, width } = validateSelectionMaskDimensions(dimensions);
  context.save();
  context.globalAlpha = 1;
  context.globalCompositeOperation = 'source-over';
  context.fillStyle = state.inverted ? '#ffffff' : '#000000';
  context.fillRect(0, 0, width, height);
  for (const stroke of state.strokes) {
    const selected = stroke.tool === 'select';
    context.strokeStyle = selected !== state.inverted ? '#ffffff' : '#000000';
    context.fillStyle = context.strokeStyle;
    drawStroke(context, stroke, dimensions);
  }
  context.restore();
}

export function drawSelectionOverlay(
  context: CanvasRenderingContext2D,
  dimensions: SelectionMaskDimensions,
  state: SelectionMaskState,
): void {
  const { height, width } = dimensions;
  context.clearRect(0, 0, width, height);
  context.save();
  context.globalAlpha = 1;
  context.globalCompositeOperation = 'source-over';
  context.fillStyle = 'rgb(20 184 166 / 48%)';
  if (state.inverted) context.fillRect(0, 0, width, height);
  for (const stroke of state.strokes) {
    const selected = stroke.tool === 'select';
    const addingSelection = selected !== state.inverted;
    context.globalCompositeOperation = addingSelection
      ? 'source-over'
      : 'destination-out';
    context.strokeStyle = addingSelection
      ? 'rgb(20 184 166 / 48%)'
      : '#000000';
    context.fillStyle = context.strokeStyle;
    drawStroke(context, stroke, dimensions);
  }
  context.restore();
}

export async function renderSelectionMask(
  dimensions: SelectionMaskDimensions,
  state: SelectionMaskState,
  signal?: AbortSignal,
): Promise<RenderedSelectionMask> {
  throwIfAborted(signal);
  const output = validateSelectionMaskDimensions(dimensions);
  const canvas = document.createElement('canvas');
  canvas.width = output.width;
  canvas.height = output.height;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Canvas 2D is unavailable.');
  drawSelectionMask(context, output, state);
  throwIfAborted(signal);
  return {
    dataUrl: canvas.toDataURL('image/png'),
    ...output,
  };
}

function drawStroke(
  context: CanvasRenderingContext2D,
  stroke: SelectionMaskStroke,
  dimensions: SelectionMaskDimensions,
): void {
  const first = stroke.points[0];
  if (!first) return;
  const scale = Math.min(dimensions.width, dimensions.height);
  const diameter = clamp(stroke.diameter, 1 / scale, 1) * scale;
  context.lineCap = 'round';
  context.lineJoin = 'round';
  context.lineWidth = diameter;
  if (stroke.points.length === 1) {
    context.beginPath();
    context.arc(
      first.x * dimensions.width,
      first.y * dimensions.height,
      diameter / 2,
      0,
      Math.PI * 2,
    );
    context.fill();
    return;
  }
  context.beginPath();
  context.moveTo(
    first.x * dimensions.width,
    first.y * dimensions.height,
  );
  for (const point of stroke.points.slice(1)) {
    context.lineTo(
      point.x * dimensions.width,
      point.y * dimensions.height,
    );
  }
  context.stroke();
}

function clamp(value: number, minimum: number, maximum: number): number {
  if (!Number.isFinite(value)) return minimum;
  return Math.min(maximum, Math.max(minimum, value));
}

function throwIfAborted(signal: AbortSignal | undefined): void {
  if (!signal?.aborted) return;
  throw new DOMException('Selection mask rendering was aborted.', 'AbortError');
}
