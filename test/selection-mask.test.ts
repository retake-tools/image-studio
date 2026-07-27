import assert from 'node:assert/strict';
import test from 'node:test';
import {
  drawSelectionOverlay,
  normalizedSelectionPoint,
  selectionMaskHasContent,
  validateSelectionMaskDimensions,
} from '../plugin/src/selection-mask';

test('selection points remain normalized to the source image', () => {
  assert.deepEqual(normalizedSelectionPoint(-0.2, 1.4), { x: 0, y: 1 });
  assert.deepEqual(normalizedSelectionPoint(0.25, 0.75), {
    x: 0.25,
    y: 0.75,
  });
});

test('selection content distinguishes an empty mask from selected pixels', () => {
  assert.equal(
    selectionMaskHasContent({ inverted: false, strokes: [] }),
    false,
  );
  assert.equal(
    selectionMaskHasContent({ inverted: true, strokes: [] }),
    true,
  );
  assert.equal(
    selectionMaskHasContent({
      inverted: false,
      strokes: [{
        diameter: 0.1,
        points: [{ x: 0.5, y: 0.5 }],
        tool: 'erase',
      }],
    }),
    false,
  );
  assert.equal(
    selectionMaskHasContent({
      inverted: false,
      strokes: [{
        diameter: 0.1,
        points: [{ x: 0.5, y: 0.5 }],
        tool: 'select',
      }],
    }),
    true,
  );
});

test('selection mask output keeps safe source dimensions', () => {
  assert.deepEqual(
    validateSelectionMaskDimensions({ height: 1080, width: 1920 }),
    { height: 1080, width: 1920 },
  );
  assert.throws(
    () => validateSelectionMaskDimensions({ height: 9000, width: 100 }),
    /8192px/,
  );
  assert.throws(
    () => validateSelectionMaskDimensions({ height: 8000, width: 8000 }),
    /32 megapixels/,
  );
  assert.throws(
    () => validateSelectionMaskDimensions({ height: 0, width: 1920 }),
    /positive integers/,
  );
});

test('erase preview removes the teal overlay with an opaque source', () => {
  const operations: Array<{ composite: string; strokeStyle: string }> = [];
  const fakeContext = {
    beginPath() {},
    clearRect() {},
    fill() {
      operations.push({
        composite: fakeContext.globalCompositeOperation,
        strokeStyle: fakeContext.strokeStyle,
      });
    },
    fillRect() {},
    globalAlpha: 1,
    globalCompositeOperation: 'source-over',
    lineCap: 'round',
    lineJoin: 'round',
    lineTo() {},
    lineWidth: 1,
    moveTo() {},
    restore() {},
    save() {},
    stroke() {
      operations.push({
        composite: fakeContext.globalCompositeOperation,
        strokeStyle: fakeContext.strokeStyle,
      });
    },
    strokeStyle: '',
    fillStyle: '',
    arc() {},
  };
  drawSelectionOverlay(
    fakeContext as unknown as CanvasRenderingContext2D,
    { height: 100, width: 100 },
    {
    inverted: false,
    strokes: [{
      diameter: 0.1,
      points: [{ x: 0.5, y: 0.5 }],
      tool: 'erase',
    }],
    },
  );
  assert.deepEqual(operations, [{
    composite: 'destination-out',
    strokeStyle: '#000000',
  }]);
});
