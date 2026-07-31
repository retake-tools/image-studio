import assert from 'node:assert/strict';
import test from 'node:test';
import {
  outpaintExpansionRegions,
  outpaintGeometry,
  outpaintGeometryIssue,
  outpaintParameters,
} from '../plugin/src/outpaint';
import { outpaintCopy } from '../plugin/src/outpaint-copy';

test('outpaint creates a centered minimal 16:9 canvas around a square source', () => {
  const geometry = outpaintGeometry({
    aspectPreset: '16:9',
    positionX: 0.5,
    positionY: 0.5,
    scale: 1,
    sourceHeight: 1024,
    sourceWidth: 1024,
  });
  assert.deepEqual(geometry, {
    aspectPreset: '16:9',
    guideHeight: 1024,
    guideWidth: 1820,
    sourceHeight: 1024,
    sourceWidth: 1024,
    sourceX: 398,
    sourceY: 0,
    targetHeight: 1024,
    targetWidth: 1820,
  });
  assert.equal(outpaintGeometryIssue(geometry), null);
});

test('outpaint anchor moves the natural-size source inside the target', () => {
  const geometry = outpaintGeometry({
    aspectPreset: '4:3',
    positionX: 1,
    positionY: 0,
    scale: 1.25,
    sourceHeight: 800,
    sourceWidth: 1200,
  });
  assert.equal(geometry.targetWidth, 1500);
  assert.equal(geometry.targetHeight, 1125);
  assert.equal(geometry.sourceX, 300);
  assert.equal(geometry.sourceY, 0);
});

test('outpaint rejects an unchanged source-ratio canvas', () => {
  const geometry = outpaintGeometry({
    aspectPreset: '16:9',
    positionX: 0.5,
    positionY: 0.5,
    scale: 1,
    sourceHeight: 1080,
    sourceWidth: 1920,
  });
  assert.equal(outpaintGeometryIssue(geometry), 'no_expansion');
  assert.throws(() => outpaintParameters(geometry), /must extend/);
});

test('outpaint rejects target canvases beyond the V0 browser limit', () => {
  const geometry = outpaintGeometry({
    aspectPreset: '9:16',
    positionX: 0.5,
    positionY: 0.5,
    scale: 2,
    sourceHeight: 2160,
    sourceWidth: 3840,
  });
  assert.equal(outpaintGeometryIssue(geometry), 'target_too_large');
});

test('outpaint preserves an exact portrait 9:16 target ratio', () => {
  const geometry = outpaintGeometry({
    aspectPreset: '9:16',
    positionX: 0.5,
    positionY: 0.5,
    scale: 1,
    sourceHeight: 1024,
    sourceWidth: 1024,
  });
  assert.equal(geometry.targetWidth, 1024);
  assert.equal(geometry.targetHeight, 1820);
  assert.equal(geometry.targetWidth / geometry.targetHeight, 1024 / 1820);
});

test('outpaint parameters freeze exact target and source geometry', () => {
  const geometry = outpaintGeometry({
    aspectPreset: '1:1',
    positionX: 0,
    positionY: 1,
    scale: 1.5,
    sourceHeight: 512,
    sourceWidth: 512,
  });
  assert.deepEqual(outpaintParameters(geometry), {
    aspectPreset: '1:1',
    contractVersion: 1,
    guideHeight: 768,
    guideWidth: 768,
    maskEncoding: 'grayscale_white_expand_v1',
    sourceHeight: 512,
    sourceWidth: 512,
    sourceX: 0,
    sourceY: 256,
    targetHeight: 768,
    targetWidth: 768,
  });
});

test('outpaint preview exposes only the generated regions around the source', () => {
  const geometry = outpaintGeometry({
    aspectPreset: '16:9',
    positionX: 0.5,
    positionY: 0.5,
    scale: 1,
    sourceHeight: 1024,
    sourceWidth: 1024,
  });
  const regions = outpaintExpansionRegions(geometry);
  assert.deepEqual(regions.map((region) => region.key), ['right', 'left']);
  assert.equal(
    regions.reduce(
      (area, region) => area
        + region.widthPercent * region.heightPercent,
      0,
    ) > 0,
    true,
  );
});

test('outpaint default prompt forbids copied or repeated source content', () => {
  const english = outpaintCopy('en').defaultPrompt;
  const chinese = outpaintCopy('zh-CN').defaultPrompt;
  assert.match(english, /Do not copy, mirror, tile, repeat/);
  assert.match(chinese, /不得复制、镜像、平铺、重复主体/);
});
