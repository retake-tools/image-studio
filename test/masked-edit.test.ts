import assert from 'node:assert/strict';
import test from 'node:test';
import { validateMaskedEditImages } from '../plugin/src/masked-edit';

test('masked edit accepts a matching PNG selection mask', () => {
  assert.equal(
    validateMaskedEditImages(
      { height: 768, mimeType: 'image/jpeg', width: 1024 },
      { height: 768, mimeType: 'image/png', width: 1024 },
    ),
    null,
  );
});

test('masked edit rejects non-PNG masks', () => {
  assert.equal(
    validateMaskedEditImages(
      { mimeType: 'image/png' },
      { mimeType: 'image/jpeg' },
    ),
    'mask_must_be_png',
  );
});

test('masked edit rejects masks with different pixel dimensions', () => {
  assert.equal(
    validateMaskedEditImages(
      { height: 768, mimeType: 'image/jpeg', width: 1024 },
      { height: 1024, mimeType: 'image/png', width: 1024 },
    ),
    'dimension_mismatch',
  );
});
