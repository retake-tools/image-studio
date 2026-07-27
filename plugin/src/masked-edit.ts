export interface MaskedEditImageDescriptor {
  readonly height?: number;
  readonly mimeType: string;
  readonly width?: number;
}

export type MaskedEditInputIssue =
  | 'dimension_mismatch'
  | 'mask_must_be_png'
  | null;

export function validateMaskedEditImages(
  source: MaskedEditImageDescriptor,
  mask: MaskedEditImageDescriptor,
): MaskedEditInputIssue {
  if (mask.mimeType !== 'image/png') return 'mask_must_be_png';
  if (
    source.width !== undefined
    && source.height !== undefined
    && mask.width !== undefined
    && mask.height !== undefined
    && (
      source.width !== mask.width
      || source.height !== mask.height
    )
  ) {
    return 'dimension_mismatch';
  }
  return null;
}
