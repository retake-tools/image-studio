import assert from 'node:assert/strict';
import test from 'node:test';
import {
  annotationDraftFromUnknown,
  annotationBrushStrokeWidthPixels,
  annotationLimits,
  annotationMarksMissingIntent,
  compileAnnotationInstruction,
  createAnnotationMark,
  finalizeDrawingAnnotationMark,
  fitAnnotationStage,
  hasExecutableAnnotationIntent,
  hitTestAnnotationEndpoint,
  hitTestAnnotationMark,
  nextAnnotationMarkId,
  translateAnnotationMark,
  updateAnnotationEndpoint,
  updateDrawingAnnotationMark,
  validateAnnotationDimensions,
  type AnnotationMark,
  type AnnotationMarkKind,
} from '../plugin/src/annotation';

test('100 percent annotation view contains landscape and portrait images', () => {
  assert.deepEqual(fitAnnotationStage(16 / 9, 760, 428), {
    height: 427.5,
    width: 760,
  });
  assert.deepEqual(fitAnnotationStage(9 / 16, 760, 428), {
    height: 428,
    width: 240.75,
  });
  assert.equal(fitAnnotationStage(null, 760, 428), null);
});

test('brush stroke widths remain screen-space values', () => {
  assert.equal(annotationBrushStrokeWidthPixels('m', 900, 600), 16.2);
  assert.ok(
    Math.abs(annotationBrushStrokeWidthPixels('s', 450, 900) - 10.8)
      < 1e-12,
  );
});

const kinds: readonly AnnotationMarkKind[] = [
  'marker',
  'arrow',
  'pen',
  'brush',
  'rect',
  'ellipse',
];

test('all annotation tools receive stable kind-specific IDs', () => {
  const marks = kinds.reduce<AnnotationMark[]>((current, kind) => [
    ...current,
    createAnnotationMark(
      kind,
      { x: 0.25, y: 0.75 },
      '#dc2626',
      'm',
      current,
    ),
  ], []);

  assert.deepEqual(
    marks.map((mark) => mark.id),
    ['M1', 'A1', 'S1', 'B1', 'R1', 'C1'],
  );
  assert.equal(nextAnnotationMarkId(marks, 'marker'), 'M2');
  assert.equal(nextAnnotationMarkId(marks, 'pen'), 'S2');
});

test('annotation prompts preserve geometry, intent, and cleanup rules', () => {
  const arrow = {
    ...createAnnotationMark(
      'arrow',
      { x: 0.1, y: 0.8 },
      '#2563eb',
      'l',
      [],
    ),
    intent: 'Move the lamp toward the arrowhead.',
  };
  const prompt = compileAnnotationInstruction({
    globalInstruction: 'Preserve the person.',
    marks: [arrow],
    schemaVersion: 1,
  });

  assert.match(prompt, /A1: blue directional arrow/);
  assert.match(prompt, /start \(0\.1000, 0\.8000\)/);
  assert.match(prompt, /Move the lamp toward the arrowhead/);
  assert.match(prompt, /tail is the start and the arrowhead is the destination/);
  assert.match(prompt, /preserve the primary product or subject/);
  assert.match(prompt, /Return a clean final image without annotation IDs/);
});

test('annotation prompts freeze explicit protected content choices', () => {
  const prompt = compileAnnotationInstruction({
    editScope: { mode: 'manual_annotations' },
    globalInstruction: 'Remove the wall shadow.',
    keepItems: { logo: true, product: true, text: false },
    marks: [],
    outputMode: 'clean_edit',
    schemaVersion: 1,
  });

  assert.match(prompt, /primary product or subject/);
  assert.match(prompt, /existing logos or brand marks/);
  assert.doesNotMatch(prompt, /existing text and typography/);
});

test('execution intent requires either a global or per-mark instruction', () => {
  const marker = createAnnotationMark(
    'marker',
    { x: 0.5, y: 0.5 },
    '#22c55e',
    'm',
    [],
  );
  const empty = {
    globalInstruction: '',
    marks: [marker],
    schemaVersion: 1 as const,
  };
  assert.equal(hasExecutableAnnotationIntent(empty), false);
  assert.deepEqual(annotationMarksMissingIntent(empty), ['M1']);
  assert.deepEqual(
    annotationMarksMissingIntent({
      ...empty,
      globalInstruction: 'Apply this instruction to every mark.',
    }),
    [],
  );
});

test('draft parsing sanitizes unknown fields and rejects unsafe payloads', () => {
  const parsed = annotationDraftFromUnknown({
    globalInstruction: 'Remove this object.',
    ignored: { deeply: ['nested'] },
    marks: [{
      color: '#dc2626',
      id: 'M1',
      ignored: 'not persisted',
      intent: 'Remove',
      kind: 'marker',
      point: { ignored: true, x: 0.5, y: 0.5 },
      strokeSize: 'm',
    }],
    schemaVersion: 1,
    sourceAssetId: 'asset-1',
  });
  assert.deepEqual(parsed, {
    editScope: { mode: 'manual_annotations' },
    globalInstruction: 'Remove this object.',
    keepItems: { logo: true, product: true, text: true },
    marks: [{
      color: '#dc2626',
      id: 'M1',
      intent: 'Remove',
      kind: 'marker',
      point: { x: 0.5, y: 0.5 },
      strokeSize: 'm',
    }],
    outputMode: 'clean_edit',
    schemaVersion: 1,
    sourceAssetId: 'asset-1',
  });
  assert.equal(annotationDraftFromUnknown({
    globalInstruction: '',
    marks: [
      parsed?.marks[0],
      parsed?.marks[0],
    ],
    schemaVersion: 1,
  }), null);
  assert.equal(annotationDraftFromUnknown({
    globalInstruction: '',
    marks: [{
      color: '#dc2626',
      id: 'S1',
      intent: '',
      kind: 'pen',
      points: Array.from(
        { length: annotationLimits.pathPointCount + 1 },
        () => ({ x: 0.5, y: 0.5 }),
      ),
      strokeSize: 'm',
    }],
    schemaVersion: 1,
  }), null);
  assert.equal(annotationDraftFromUnknown({
    editScope: { mode: 'whole_image' },
    globalInstruction: 'Change the background.',
    marks: [],
    schemaVersion: 1,
  }), null);
  assert.equal(annotationDraftFromUnknown({
    globalInstruction: 'Change the background.',
    keepItems: { logo: true, product: 'yes', text: true },
    marks: [],
    schemaVersion: 1,
  }), null);
  assert.equal(annotationDraftFromUnknown({
    globalInstruction: 'Change the background.',
    marks: [],
    outputMode: 'annotated_composite',
    schemaVersion: 1,
  }), null);
});

test('drawing, hit testing, and translation stay normalized', () => {
  const initial = createAnnotationMark(
    'rect',
    { x: 0.8, y: 0.8 },
    '#a855f7',
    's',
    [],
  );
  const drawn = updateDrawingAnnotationMark(initial, { x: 0.95, y: 0.95 });
  assert.equal(
    hitTestAnnotationMark([drawn], { x: 0.8, y: 0.9 })?.id,
    'R1',
  );
  assert.deepEqual(translateAnnotationMark(drawn, 0.4, -1), {
    ...drawn,
    end: { x: 1, y: 0 },
    start: { x: 1, y: 0 },
  });
});

test('arrow and rectangle endpoints remain directly editable', () => {
  const arrow = updateDrawingAnnotationMark(
    createAnnotationMark(
      'arrow',
      { x: 0.1, y: 0.2 },
      '#2563eb',
      'm',
      [],
    ),
    { x: 0.8, y: 0.9 },
  );
  assert.equal(
    hitTestAnnotationEndpoint(arrow, { x: 0.79, y: 0.89 }),
    'end',
  );
  assert.deepEqual(
    updateAnnotationEndpoint(arrow, 'start', { x: -1, y: 0.4 }),
    { ...arrow, start: { x: 0, y: 0.4 } },
  );

  const rectangle = updateDrawingAnnotationMark(
    createAnnotationMark(
      'rect',
      { x: 0.2, y: 0.3 },
      '#a855f7',
      's',
      [],
    ),
    { x: 0.7, y: 0.8 },
  );
  assert.equal(
    hitTestAnnotationEndpoint(rectangle, { x: 0.2, y: 0.8 }),
    'startXEndY',
  );
  assert.deepEqual(
    updateAnnotationEndpoint(
      rectangle,
      'startXEndY',
      { x: 0.4, y: 2 },
    ),
    {
      ...rectangle,
      end: { x: 0.7, y: 1 },
      start: { x: 0.4, y: 0.3 },
    },
  );
});

test('drawing finalization removes empty shapes and preserves click arrows', () => {
  const rectangle = createAnnotationMark(
    'rect',
    { x: 0.5, y: 0.5 },
    '#dc2626',
    'm',
    [],
  );
  assert.equal(finalizeDrawingAnnotationMark(rectangle), null);

  const arrow = createAnnotationMark(
    'arrow',
    { x: 0.5, y: 0.5 },
    '#dc2626',
    'm',
    [],
  );
  const collapsed = updateDrawingAnnotationMark(
    arrow,
    { x: 0.5, y: 0.5 },
  );
  assert.deepEqual(finalizeDrawingAnnotationMark(collapsed), arrow);
});

test('annotation composites enforce browser-safe dimensions', () => {
  assert.deepEqual(
    validateAnnotationDimensions({ height: 1080, width: 1920 }),
    { height: 1080, width: 1920 },
  );
  assert.throws(
    () => validateAnnotationDimensions({ height: 9000, width: 100 }),
    /8192px/,
  );
  assert.throws(
    () => validateAnnotationDimensions({ height: 8000, width: 8000 }),
    /32 megapixels/,
  );
  assert.throws(
    () => validateAnnotationDimensions({ height: 0, width: 100 }),
    /positive integers/,
  );
});
