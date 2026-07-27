import assert from 'node:assert/strict';
import test from 'node:test';
import {
  normalizedResizeEncoding,
  resizeOutputDimensions,
} from '../plugin/src/image-resize';

test('resize modes preserve source aspect ratio', () => {
  const source = { height: 900, width: 1600 };
  assert.deepEqual(
    resizeOutputDimensions({
      allowUpscale: false,
      mode: 'percentage',
      source,
      value: 50,
    }),
    { height: 450, width: 800 },
  );
  assert.deepEqual(
    resizeOutputDimensions({
      allowUpscale: false,
      mode: 'width',
      source,
      value: 1024,
    }),
    { height: 576, width: 1024 },
  );
  assert.deepEqual(
    resizeOutputDimensions({
      allowUpscale: false,
      mode: 'height',
      source,
      value: 720,
    }),
    { height: 720, width: 1280 },
  );
});

test('resize requires explicit upscale permission', () => {
  assert.throws(
    () => resizeOutputDimensions({
      allowUpscale: false,
      mode: 'percentage',
      source: { height: 900, width: 1600 },
      value: 200,
    }),
    /Enable upscale/,
  );
  assert.deepEqual(
    resizeOutputDimensions({
      allowUpscale: true,
      mode: 'percentage',
      source: { height: 900, width: 1600 },
      value: 200,
    }),
    { height: 1800, width: 3200 },
  );
});

test('resize rejects invalid or unsafe output geometry', () => {
  assert.throws(
    () => resizeOutputDimensions({
      allowUpscale: true,
      mode: 'width',
      source: { height: 900, width: 1600 },
      value: 9000,
    }),
    /8192px/,
  );
  assert.throws(
    () => resizeOutputDimensions({
      allowUpscale: true,
      mode: 'width',
      source: { height: 8192, width: 8192 },
      value: 8192,
    }),
    /32 megapixels/,
  );
  assert.throws(
    () => resizeOutputDimensions({
      allowUpscale: true,
      mode: 'height',
      source: { height: 900, width: 1600 },
      value: 12.5,
    }),
    /integers/,
  );
});

test('resize encoding normalizes format-specific settings', () => {
  assert.deepEqual(
    normalizedResizeEncoding({
      format: 'png',
      matteColor: '#123456',
      quality: 75,
    }),
    { format: 'png', matteColor: null, quality: null },
  );
  assert.deepEqual(
    normalizedResizeEncoding({
      format: 'webp',
      matteColor: '#123456',
      quality: 80,
    }),
    { format: 'webp', matteColor: null, quality: 80 },
  );
  assert.deepEqual(
    normalizedResizeEncoding({
      format: 'jpeg',
      matteColor: '#f8fafc',
      quality: 90,
    }),
    { format: 'jpeg', matteColor: '#f8fafc', quality: 90 },
  );
  assert.throws(
    () => normalizedResizeEncoding({
      format: 'jpeg',
      matteColor: 'white',
      quality: 90,
    }),
    /hex color/,
  );
});
