export function exactSourceImage(
  assets: readonly {
    kind: string;
    previewUrl: string;
  }[],
): {
  previewUrl: string;
} {
  if (assets.length !== 1 || assets[0]?.kind !== 'image') {
    throw new Error(
      'Image Studio requires exactly one bound source image.',
    );
  }
  return assets[0];
}
