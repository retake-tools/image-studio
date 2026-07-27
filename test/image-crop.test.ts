import assert from 'node:assert/strict';
import test from 'node:test';
import {
  cropOutputGeometry,
  cropRegionForPreset,
  isFullImageCrop,
} from '../plugin/src/image-crop';

test('crop presets stay inside a landscape source', () => {
  const dimensions = { height: 900, width: 1600 };
  const square = cropRegionForPreset({
    dimensions,
    preset: '1:1',
    scale: 1,
  });
  assert.deepEqual(square, {
    height: 1,
    width: 0.5625,
    x: 0.21875,
    y: 0,
  });
  assert.deepEqual(cropOutputGeometry(dimensions, square), {
    height: 900,
    sourceHeight: 900,
    sourceWidth: 900,
    sourceX: 350,
    sourceY: 0,
    width: 900,
  });

  const portrait = cropRegionForPreset({
    dimensions,
    preset: '9:16',
    scale: 1,
  });
  assert.equal(portrait.height, 1);
  assert.equal(portrait.x + portrait.width <= 1, true);
  assert.equal(portrait.y + portrait.height <= 1, true);
});

test('crop presets stay inside a portrait source', () => {
  const dimensions = { height: 1600, width: 900 };
  const widescreen = cropRegionForPreset({
    dimensions,
    preset: '16:9',
    scale: 1,
  });
  assert.equal(widescreen.width, 1);
  assert.equal(widescreen.x, 0);
  assert.equal(widescreen.y + widescreen.height <= 1, true);
  assert.deepEqual(cropOutputGeometry(dimensions, widescreen), {
    height: 506,
    sourceHeight: 506,
    sourceWidth: 900,
    sourceX: 0,
    sourceY: 547,
    width: 900,
  });
});

test('crop scale and center are clamped to the source', () => {
  const region = cropRegionForPreset({
    centerX: 2,
    centerY: -1,
    dimensions: { height: 900, width: 1600 },
    preset: '1:1',
    scale: 0.5,
  });
  assert.equal(region.x + region.width, 1);
  assert.equal(region.y, 0);
  assert.equal(region.width, 0.28125);
  assert.equal(region.height, 0.5);
});

test('original preset is non-destructive only at full scale', () => {
  const dimensions = { height: 900, width: 1600 };
  assert.equal(
    isFullImageCrop(cropRegionForPreset({
      dimensions,
      preset: 'original',
      scale: 1,
    })),
    true,
  );
  assert.equal(
    isFullImageCrop(cropRegionForPreset({
      dimensions,
      preset: 'original',
      scale: 0.8,
    })),
    false,
  );
});

test('invalid crop regions are rejected before Canvas execution', () => {
  assert.throws(
    () => cropOutputGeometry(
      { height: 900, width: 1600 },
      { height: 0.5, width: 0.5, x: 0.75, y: 0 },
    ),
    /inside the source image/,
  );
});
