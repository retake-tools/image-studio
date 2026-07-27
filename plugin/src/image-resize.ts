import {
  loadBrowserImage,
  throwIfImageProcessingAborted,
} from './browser-image';

export type ResizeMode = 'percentage' | 'width' | 'height';
export type ResizeOutputFormat = 'png' | 'jpeg' | 'webp';

export interface ResizeDimensions {
  readonly height: number;
  readonly width: number;
}

export interface ResizeRequest {
  readonly allowUpscale: boolean;
  readonly mode: ResizeMode;
  readonly source: ResizeDimensions;
  readonly value: number;
}

export interface ResizeEncoding {
  readonly format: ResizeOutputFormat;
  readonly matteColor: string | null;
  readonly quality: number | null;
}

export interface RenderedResizedImage extends ResizeDimensions {
  readonly dataUrl: string;
  readonly extension: '.jpg' | '.png' | '.webp';
  readonly mimeType: 'image/jpeg' | 'image/png' | 'image/webp';
}

const maximumDimension = 8192;
const maximumPixels = 33_554_432;

export function resizeOutputDimensions(
  request: ResizeRequest,
): ResizeDimensions {
  assertDimensions(request.source);
  if (!Number.isFinite(request.value) || request.value <= 0) {
    throw new Error('Resize value must be a positive number.');
  }
  let width: number;
  let height: number;
  if (request.mode === 'percentage') {
    if (request.value < 10 || request.value > 400) {
      throw new Error('Resize percentage must be between 10 and 400.');
    }
    width = roundedDimension(request.source.width * request.value / 100);
    height = roundedDimension(request.source.height * request.value / 100);
  } else if (request.mode === 'width') {
    width = integerDimension(request.value);
    height = roundedDimension(
      request.source.height * width / request.source.width,
    );
  } else if (request.mode === 'height') {
    height = integerDimension(request.value);
    width = roundedDimension(
      request.source.width * height / request.source.height,
    );
  } else {
    throw new Error('Resize mode is not supported.');
  }

  if (
    !request.allowUpscale
    && (width > request.source.width || height > request.source.height)
  ) {
    throw new Error('Enable upscale to create an image larger than the source.');
  }
  if (width > maximumDimension || height > maximumDimension) {
    throw new Error(`Resize output cannot exceed ${maximumDimension}px on either side.`);
  }
  if (width * height > maximumPixels) {
    throw new Error('Resize output cannot exceed 32 megapixels.');
  }
  return { height, width };
}

export function normalizedResizeEncoding(
  encoding: ResizeEncoding,
): Required<ResizeEncoding> {
  if (!['png', 'jpeg', 'webp'].includes(encoding.format)) {
    throw new Error('Resize output format is not supported.');
  }
  if (encoding.format === 'png') {
    return { format: 'png', matteColor: null, quality: null };
  }
  const quality = encoding.quality ?? 90;
  if (!Number.isInteger(quality) || quality < 60 || quality > 100) {
    throw new Error('JPEG and WebP quality must be an integer from 60 to 100.');
  }
  if (encoding.format === 'webp') {
    return { format: 'webp', matteColor: null, quality };
  }
  const matteColor = encoding.matteColor ?? '#ffffff';
  if (!/^#[0-9a-fA-F]{6}$/.test(matteColor)) {
    throw new Error('JPEG background must be a six-digit hex color.');
  }
  return { format: 'jpeg', matteColor, quality };
}

export async function renderResizedImage(
  imageUrl: string,
  output: ResizeDimensions,
  encoding: ResizeEncoding,
  signal: AbortSignal,
): Promise<RenderedResizedImage> {
  throwIfImageProcessingAborted(signal);
  assertDimensions(output);
  const normalized = normalizedResizeEncoding(encoding);
  const image = await loadBrowserImage(imageUrl, signal);
  throwIfImageProcessingAborted(signal);
  assertDimensions({
    height: image.naturalHeight,
    width: image.naturalWidth,
  });

  const canvas = document.createElement('canvas');
  canvas.width = output.width;
  canvas.height = output.height;
  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('Canvas image processing is unavailable in this browser.');
  }
  if (normalized.format === 'jpeg') {
    context.fillStyle = normalized.matteColor ?? '#ffffff';
    context.fillRect(0, 0, output.width, output.height);
  }
  context.drawImage(image, 0, 0, output.width, output.height);
  throwIfImageProcessingAborted(signal);

  const mimeType = mimeForFormat(normalized.format);
  const dataUrl = canvas.toDataURL(
    mimeType,
    normalized.quality === null ? undefined : normalized.quality / 100,
  );
  if (!dataUrl.startsWith(`data:${mimeType}`)) {
    throw new Error(`This browser cannot encode ${normalized.format.toUpperCase()} images.`);
  }
  return {
    dataUrl,
    extension: extensionForFormat(normalized.format),
    height: output.height,
    mimeType,
    width: output.width,
  };
}

function assertDimensions(dimensions: ResizeDimensions): void {
  if (
    !Number.isInteger(dimensions.width)
    || !Number.isInteger(dimensions.height)
    || dimensions.width <= 0
    || dimensions.height <= 0
  ) {
    throw new Error('Resize requires positive integer dimensions.');
  }
}

function roundedDimension(value: number): number {
  return Math.max(1, Math.round(value));
}

function integerDimension(value: number): number {
  if (!Number.isInteger(value)) {
    throw new Error('Pixel resize values must be integers.');
  }
  return value;
}

function mimeForFormat(
  format: ResizeOutputFormat,
): RenderedResizedImage['mimeType'] {
  if (format === 'jpeg') return 'image/jpeg';
  if (format === 'webp') return 'image/webp';
  return 'image/png';
}

function extensionForFormat(
  format: ResizeOutputFormat,
): RenderedResizedImage['extension'] {
  if (format === 'jpeg') return '.jpg';
  if (format === 'webp') return '.webp';
  return '.png';
}
