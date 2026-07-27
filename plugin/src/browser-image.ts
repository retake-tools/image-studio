export function loadBrowserImage(
  imageUrl: string,
  signal: AbortSignal,
): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    const abort = () => {
      image.src = '';
      reject(new DOMException('Image processing was aborted.', 'AbortError'));
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

export function throwIfImageProcessingAborted(
  signal: AbortSignal,
): void {
  if (!signal.aborted) return;
  throw new DOMException('Image processing was aborted.', 'AbortError');
}
