export interface LocalImageAdjustments {
  readonly brightness: number;
  readonly contrast: number;
  readonly saturation: number;
}

export interface RenderedLocalImage {
  readonly dataUrl: string;
  readonly height: number;
  readonly width: number;
}

export const defaultImageAdjustments: LocalImageAdjustments = Object.freeze({
  brightness: 0,
  contrast: 0,
  saturation: 0,
});

export function imageAdjustmentFilter(
  adjustments: LocalImageAdjustments,
): string {
  return [
    `brightness(${percentage(adjustments.brightness)}%)`,
    `contrast(${percentage(adjustments.contrast)}%)`,
    `saturate(${percentage(adjustments.saturation)}%)`,
  ].join(' ');
}

export function hasImageAdjustments(
  adjustments: LocalImageAdjustments,
): boolean {
  return adjustments.brightness !== 0
    || adjustments.contrast !== 0
    || adjustments.saturation !== 0;
}

export async function renderAdjustedImage(
  imageUrl: string,
  adjustments: LocalImageAdjustments,
  signal: AbortSignal,
): Promise<RenderedLocalImage> {
  throwIfAborted(signal);
  const image = await loadImage(imageUrl, signal);
  throwIfAborted(signal);
  const width = image.naturalWidth;
  const height = image.naturalHeight;
  if (width <= 0 || height <= 0) {
    throw new Error('The source image has no usable dimensions.');
  }

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('Canvas image processing is unavailable in this browser.');
  }

  context.filter = imageAdjustmentFilter(adjustments);
  context.drawImage(image, 0, 0, width, height);
  throwIfAborted(signal);
  return {
    dataUrl: canvas.toDataURL('image/png'),
    height,
    width,
  };
}

function percentage(value: number): number {
  return Math.max(0, Math.min(200, 100 + value));
}

function loadImage(
  imageUrl: string,
  signal: AbortSignal,
): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    const abort = () => {
      image.src = '';
      reject(new DOMException('Image adjustment was aborted.', 'AbortError'));
    };
    const cleanup = () => signal.removeEventListener('abort', abort);
    image.decoding = 'async';
    image.onload = () => {
      cleanup();
      resolve(image);
    };
    image.onerror = () => {
      cleanup();
      reject(new Error(
        'The source image could not be loaded for local processing.',
      ));
    };
    signal.addEventListener('abort', abort, { once: true });
    if (signal.aborted) {
      abort();
      return;
    }
    image.src = imageUrl;
  });
}

function throwIfAborted(signal: AbortSignal): void {
  if (!signal.aborted) return;
  throw new DOMException('Image adjustment was aborted.', 'AbortError');
}
