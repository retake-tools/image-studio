import assert from 'node:assert/strict';
import test from 'node:test';
import {
  defaultImageAdjustments,
  hasImageAdjustments,
  imageAdjustmentFilter,
} from '../plugin/src/image-adjustments';

test('local adjustment filter matches the migrated Core behavior', () => {
  assert.equal(
    imageAdjustmentFilter({
      brightness: 20,
      contrast: -10,
      saturation: 100,
    }),
    'brightness(120%) contrast(90%) saturate(200%)',
  );
  assert.equal(
    imageAdjustmentFilter({
      brightness: -100,
      contrast: 100,
      saturation: 200,
    }),
    'brightness(0%) contrast(200%) saturate(200%)',
  );
});

test('zero adjustments stay non-destructive until the user changes a value', () => {
  assert.equal(hasImageAdjustments(defaultImageAdjustments), false);
  assert.equal(
    hasImageAdjustments({
      ...defaultImageAdjustments,
      contrast: 1,
    }),
    true,
  );
});
