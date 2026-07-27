import {
  loadBrowserImage,
  throwIfImageProcessingAborted,
} from './browser-image';

export type CropAspectPreset =
  | 'original'
  | '1:1'
  | '4:3'
  | '3:4'
  | '16:9'
  | '9:16';

export interface ImageDimensions {
  readonly height: number;
  readonly width: number;
}

export interface NormalizedCropRegion {
  readonly height: number;
  readonly width: number;
  readonly x: number;
  readonly y: number;
}

export interface CropOutputGeometry {
  readonly height: number;
  readonly sourceHeight: number;
  readonly sourceWidth: number;
  readonly sourceX: number;
  readonly sourceY: number;
  readonly width: number;
}

export interface RenderedCroppedImage {
  readonly dataUrl: string;
  readonly height: number;
  readonly width: number;
}

const presetRatios: Record<
  Exclude<CropAspectPreset, 'original'>,
  number
> = {
  '1:1': 1,
  '4:3': 4 / 3,
  '3:4': 3 / 4,
  '16:9': 16 / 9,
  '9:16': 9 / 16,
};

export function cropRegionForPreset(input: {
  centerX?: number;
  centerY?: number;
  dimensions: ImageDimensions;
  preset: CropAspectPreset;
  scale: number;
}): NormalizedCropRegion {
  assertDimensions(input.dimensions);
  const scale = clamp(input.scale, 0.2, 1);
  const sourceRatio = input.dimensions.width / input.dimensions.height;
  const targetRatio = input.preset === 'original'
    ? sourceRatio
    : presetRatios[input.preset];
  const maximum = targetRatio >= sourceRatio
    ? {
        height: sourceRatio / targetRatio,
        width: 1,
      }
    : {
        height: 1,
        width: targetRatio / sourceRatio,
      };
  const width = maximum.width * scale;
  const height = maximum.height * scale;
  const centerX = clamp(
    input.centerX ?? 0.5,
    width / 2,
    1 - width / 2,
  );
  const centerY = clamp(
    input.centerY ?? 0.5,
    height / 2,
    1 - height / 2,
  );
  return {
    height,
    width,
    x: centerX - width / 2,
    y: centerY - height / 2,
  };
}

export function cropOutputGeometry(
  dimensions: ImageDimensions,
  region: NormalizedCropRegion,
): CropOutputGeometry {
  assertDimensions(dimensions);
  assertRegion(region);
  const sourceX = Math.round(region.x * dimensions.width);
  const sourceY = Math.round(region.y * dimensions.height);
  const sourceWidth = Math.max(
    1,
    Math.min(
      dimensions.width - sourceX,
      Math.round(region.width * dimensions.width),
    ),
  );
  const sourceHeight = Math.max(
    1,
    Math.min(
      dimensions.height - sourceY,
      Math.round(region.height * dimensions.height),
    ),
  );
  return {
    height: sourceHeight,
    sourceHeight,
    sourceWidth,
    sourceX,
    sourceY,
    width: sourceWidth,
  };
}

export function cropRegionCenter(
  region: NormalizedCropRegion,
): { x: number; y: number } {
  return {
    x: region.x + region.width / 2,
    y: region.y + region.height / 2,
  };
}

export function isFullImageCrop(region: NormalizedCropRegion): boolean {
  const epsilon = 0.000001;
  return region.x <= epsilon
    && region.y <= epsilon
    && Math.abs(region.width - 1) <= epsilon
    && Math.abs(region.height - 1) <= epsilon;
}

export async function renderCroppedImage(
  imageUrl: string,
  region: NormalizedCropRegion,
  signal: AbortSignal,
): Promise<RenderedCroppedImage> {
  throwIfImageProcessingAborted(signal);
  const image = await loadBrowserImage(imageUrl, signal);
  throwIfImageProcessingAborted(signal);
  const dimensions = {
    height: image.naturalHeight,
    width: image.naturalWidth,
  };
  const geometry = cropOutputGeometry(dimensions, region);
  const canvas = document.createElement('canvas');
  canvas.width = geometry.width;
  canvas.height = geometry.height;
  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('Canvas image processing is unavailable in this browser.');
  }
  context.drawImage(
    image,
    geometry.sourceX,
    geometry.sourceY,
    geometry.sourceWidth,
    geometry.sourceHeight,
    0,
    0,
    geometry.width,
    geometry.height,
  );
  throwIfImageProcessingAborted(signal);
  return {
    dataUrl: canvas.toDataURL('image/png'),
    height: geometry.height,
    width: geometry.width,
  };
}

function assertDimensions(dimensions: ImageDimensions): void {
  if (
    !Number.isInteger(dimensions.width)
    || !Number.isInteger(dimensions.height)
    || dimensions.width <= 0
    || dimensions.height <= 0
  ) {
    throw new Error('Crop requires positive integer source dimensions.');
  }
}

function assertRegion(region: NormalizedCropRegion): void {
  if (
    ![region.x, region.y, region.width, region.height].every(Number.isFinite)
    || region.x < 0
    || region.y < 0
    || region.width <= 0
    || region.height <= 0
    || region.x + region.width > 1.000001
    || region.y + region.height > 1.000001
  ) {
    throw new Error('Crop region must be finite and stay inside the source image.');
  }
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value));
}
