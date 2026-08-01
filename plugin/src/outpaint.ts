import {
  loadBrowserImage,
  throwIfImageProcessingAborted,
} from './browser-image';

export type OutpaintAspectPreset =
  | '1:1'
  | '4:3'
  | '3:4'
  | '16:9'
  | '9:16';

export interface OutpaintGeometry {
  readonly aspectPreset: OutpaintAspectPreset;
  readonly guideHeight: number;
  readonly guideWidth: number;
  readonly sourceHeight: number;
  readonly sourceWidth: number;
  readonly sourceX: number;
  readonly sourceY: number;
  readonly targetHeight: number;
  readonly targetWidth: number;
}

export interface OutpaintInputs {
  readonly guideDataUrl: string;
  readonly maskDataUrl: string;
}

export interface OutpaintExpansionRegion {
  readonly heightPercent: number;
  readonly key: 'bottom' | 'left' | 'right' | 'top';
  readonly leftPercent: number;
  readonly topPercent: number;
  readonly widthPercent: number;
}

export const outpaintMaxDimension = 4096;
export const outpaintMaxArea = 16_777_216;
export const outpaintMaskEncoding = 'grayscale_white_expand_v1';

const presetRatios: Record<OutpaintAspectPreset, number> = {
  '1:1': 1,
  '4:3': 4 / 3,
  '3:4': 3 / 4,
  '16:9': 16 / 9,
  '9:16': 9 / 16,
};

export function outpaintGeometry(input: {
  aspectPreset: OutpaintAspectPreset;
  positionX: number;
  positionY: number;
  scale: number;
  sourceHeight: number;
  sourceWidth: number;
}): OutpaintGeometry {
  assertSourceDimensions(input.sourceWidth, input.sourceHeight);
  const ratio = presetRatios[input.aspectPreset];
  const sourceRatio = input.sourceWidth / input.sourceHeight;
  const scale = clamp(input.scale, 1, 2);
  let targetWidth: number;
  let targetHeight: number;
  if (ratio >= sourceRatio) {
    targetHeight = Math.max(
      input.sourceHeight,
      Math.round(input.sourceHeight * scale),
    );
    targetWidth = Math.max(
      input.sourceWidth,
      Math.round(targetHeight * ratio),
    );
  } else {
    targetWidth = Math.max(
      input.sourceWidth,
      Math.round(input.sourceWidth * scale),
    );
    targetHeight = Math.max(
      input.sourceHeight,
      Math.round(targetWidth / ratio),
    );
  }
  const availableX = targetWidth - input.sourceWidth;
  const availableY = targetHeight - input.sourceHeight;
  return {
    aspectPreset: input.aspectPreset,
    guideHeight: targetHeight,
    guideWidth: targetWidth,
    sourceHeight: input.sourceHeight,
    sourceWidth: input.sourceWidth,
    sourceX: Math.round(availableX * clamp(input.positionX, 0, 1)),
    sourceY: Math.round(availableY * clamp(input.positionY, 0, 1)),
    targetHeight,
    targetWidth,
  };
}

export function outpaintGeometryIssue(
  geometry: OutpaintGeometry,
): 'no_expansion' | 'target_too_large' | null {
  if (
    geometry.targetWidth === geometry.sourceWidth
    && geometry.targetHeight === geometry.sourceHeight
  ) {
    return 'no_expansion';
  }
  if (
    geometry.targetWidth > outpaintMaxDimension
    || geometry.targetHeight > outpaintMaxDimension
    || geometry.targetWidth * geometry.targetHeight > outpaintMaxArea
  ) {
    return 'target_too_large';
  }
  return null;
}

export function outpaintParameters(
  geometry: OutpaintGeometry,
): Record<string, number | string> {
  const issue = outpaintGeometryIssue(geometry);
  if (issue) {
    throw new Error(
      issue === 'no_expansion'
        ? 'Outpaint target must extend the source image.'
        : 'Outpaint target exceeds the supported browser canvas size.',
    );
  }
  return {
    aspectPreset: geometry.aspectPreset,
    contractVersion: 1,
    guideHeight: geometry.guideHeight,
    guideWidth: geometry.guideWidth,
    maskEncoding: outpaintMaskEncoding,
    sourceHeight: geometry.sourceHeight,
    sourceWidth: geometry.sourceWidth,
    sourceX: geometry.sourceX,
    sourceY: geometry.sourceY,
    targetHeight: geometry.targetHeight,
    targetWidth: geometry.targetWidth,
  };
}

export function outpaintExpansionRegions(
  geometry: OutpaintGeometry,
): readonly OutpaintExpansionRegion[] {
  const left = geometry.sourceX / geometry.targetWidth * 100;
  const right = (
    geometry.targetWidth - geometry.sourceX - geometry.sourceWidth
  ) / geometry.targetWidth * 100;
  const top = geometry.sourceY / geometry.targetHeight * 100;
  const bottom = (
    geometry.targetHeight - geometry.sourceY - geometry.sourceHeight
  ) / geometry.targetHeight * 100;
  const sourceWidth = geometry.sourceWidth / geometry.targetWidth * 100;
  const sourceHeight = geometry.sourceHeight / geometry.targetHeight * 100;
  const regions: OutpaintExpansionRegion[] = [
    {
      heightPercent: top,
      key: 'top',
      leftPercent: 0,
      topPercent: 0,
      widthPercent: 100,
    },
    {
      heightPercent: sourceHeight,
      key: 'right',
      leftPercent: left + sourceWidth,
      topPercent: top,
      widthPercent: right,
    },
    {
      heightPercent: bottom,
      key: 'bottom',
      leftPercent: 0,
      topPercent: top + sourceHeight,
      widthPercent: 100,
    },
    {
      heightPercent: sourceHeight,
      key: 'left',
      leftPercent: 0,
      topPercent: top,
      widthPercent: left,
    },
  ];
  return regions.filter((region) => (
    region.widthPercent > 0.01 && region.heightPercent > 0.01
  ));
}

export async function createOutpaintInputs(
  imageUrl: string,
  geometry: OutpaintGeometry,
  signal: AbortSignal,
): Promise<OutpaintInputs> {
  if (outpaintGeometryIssue(geometry)) {
    throw new Error('Outpaint geometry is not executable.');
  }
  throwIfImageProcessingAborted(signal);
  const image = await loadBrowserImage(imageUrl, signal);
  throwIfImageProcessingAborted(signal);
  if (
    image.naturalWidth !== geometry.sourceWidth
    || image.naturalHeight !== geometry.sourceHeight
  ) {
    throw new Error(
      'Outpaint source dimensions changed before execution.',
    );
  }
  const guide = createCanvas(geometry.targetWidth, geometry.targetHeight);
  const guideContext = context2d(guide);
  guideContext.clearRect(0, 0, guide.width, guide.height);
  guideContext.drawImage(
    image,
    geometry.sourceX,
    geometry.sourceY,
    geometry.sourceWidth,
    geometry.sourceHeight,
  );
  const mask = createCanvas(geometry.targetWidth, geometry.targetHeight);
  const maskContext = context2d(mask);
  maskContext.fillStyle = '#ffffff';
  maskContext.fillRect(0, 0, mask.width, mask.height);
  maskContext.fillStyle = '#000000';
  maskContext.fillRect(
    geometry.sourceX,
    geometry.sourceY,
    geometry.sourceWidth,
    geometry.sourceHeight,
  );
  throwIfImageProcessingAborted(signal);
  return {
    guideDataUrl: guide.toDataURL('image/png'),
    maskDataUrl: mask.toDataURL('image/png'),
  };
}

function assertSourceDimensions(width: number, height: number): void {
  if (
    !Number.isInteger(width)
    || !Number.isInteger(height)
    || width <= 0
    || height <= 0
  ) {
    throw new Error(
      'Outpaint requires positive integer source dimensions.',
    );
  }
}

function createCanvas(width: number, height: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

function context2d(canvas: HTMLCanvasElement): CanvasRenderingContext2D {
  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error(
      'Canvas image processing is unavailable in this browser.',
    );
  }
  return context;
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value));
}
