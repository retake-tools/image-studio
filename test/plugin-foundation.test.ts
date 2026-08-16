import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { createPluginTranslator } from '@retake/plugin-api';
import {
  adjustImageCommand,
  annotationImageCommand,
  cropImageCommand,
  imageStudioMessages,
  imageStudioPlugin,
  ipCharacterDefinitionCapability,
  outpaintImageCommand,
  resizeImageCommand,
} from '../plugin/src/index';
import { imageStudioSettings } from '../plugin/src/settings';
import { imageStudioTheme } from '../plugin/src/theme';
import { imageStudioPanelClassName } from '../plugin/src/panel-presentation';

test('plugin declares public messages and typed workspace settings', () => {
  assert.equal(imageStudioPlugin.messages, imageStudioMessages);
  assert.equal(imageStudioPlugin.settings, imageStudioSettings);
  assert.deepEqual(
    imageStudioSettings.fields.defaultOutputFormat.enum,
    ['png', 'jpeg', 'webp'],
  );
  assert.equal(
    imageStudioSettings.fields.defaultOutputFormat.scope,
    'workspace',
  );
  assert.equal(
    imageStudioSettings.fields.defaultOutputFormat.default,
    'png',
  );

  const english = createPluginTranslator(imageStudioMessages, 'en-US');
  const chinese = createPluginTranslator(imageStudioMessages, 'zh-CN');
  assert.equal(english.t('pluginName'), 'Image Studio');
  assert.equal(chinese.t('pluginName'), '图片工作室');
});

test('plugin theme values come from the public token facade', () => {
  assert.equal(imageStudioTheme.accent, 'var(--retake-color-accent)');
  assert.equal(imageStudioTheme.background, 'var(--retake-color-background)');
  assert.equal(imageStudioTheme.border, 'var(--retake-color-border)');
  assert.equal(imageStudioTheme.foreground, 'var(--retake-color-foreground)');
  assert.equal(imageStudioTheme.muted, 'var(--retake-color-muted)');
  assert.equal(imageStudioTheme.surface, 'var(--retake-color-surface)');
});

test('image commands publish intentional host toolbar icons', () => {
  assert.deepEqual(
    [
      adjustImageCommand.icon,
      annotationImageCommand.icon,
      cropImageCommand.icon,
      resizeImageCommand.icon,
      outpaintImageCommand.icon,
    ],
    [
      'adjustments',
      'annotation',
      'crop',
      'resize',
      'outpaint',
    ],
  );
});

test('IP character strategy capability is plugin-owned and provider-neutral', () => {
  assert.equal(
    ipCharacterDefinitionCapability.definition.capabilityId,
    'design.ip_character.define',
  );
  assert.deepEqual(
    ipCharacterDefinitionCapability.definition.supportedAdapterClasses,
    ['text.document', 'agent_runtime.text'],
  );
  assert.equal(
    ipCharacterDefinitionCapability.definition.outputSlots[0]?.artifactType,
    'character_bible',
  );
  assert.equal(
    imageStudioPlugin.contributions.ipCharacterDefinitionCapability,
    ipCharacterDefinitionCapability,
  );
});

test('panels do not own locale detection or private theme fallbacks', async () => {
  const sources = await Promise.all([
    'adjust-panel.tsx',
    'annotation-copy.ts',
    'crop-panel.tsx',
    'outpaint-copy.ts',
    'resize-panel.tsx',
  ].map((fileName) => (
    readFile(new URL(`../plugin/src/${fileName}`, import.meta.url), 'utf8')
  )));
  const combined = sources.join('\n');
  assert.doesNotMatch(combined, /isChineseLocale/);
  assert.doesNotMatch(combined, /startsWith\(['"]zh/);
  assert.doesNotMatch(combined, /var\(--retake-(?:accent|surface|text),/);
});

test('host-selected focus editor presentation preserves overlay fallback', async () => {
  assert.equal(
    imageStudioPanelClassName('retake-image-studio-panel'),
    'retake-image-studio-panel',
  );
  assert.equal(
    imageStudioPanelClassName(
      'retake-image-studio-panel',
      'focus-editor',
    ),
    'retake-image-studio-panel is-focus-editor',
  );
  const [annotationPanel, styles, annotationStyles, editorPanels] = await Promise.all([
    readFile(new URL('../plugin/src/annotation-panel.tsx', import.meta.url), 'utf8'),
    readFile(new URL('../plugin/src/styles.ts', import.meta.url), 'utf8'),
    readFile(new URL('../plugin/src/annotation-styles.ts', import.meta.url), 'utf8'),
    Promise.all([
      'adjust-panel.tsx',
      'annotation-panel.tsx',
      'crop-panel.tsx',
      'outpaint-panel.tsx',
      'resize-panel.tsx',
    ].map((fileName) => (
      readFile(new URL(`../plugin/src/${fileName}`, import.meta.url), 'utf8')
    ))),
  ]);
  assert.match(annotationPanel, /presentation === 'overlay' \? \(/);
  assert.match(annotationPanel, /role=\{presentation === 'overlay' \? 'dialog' : 'region'\}/);
  assert.match(styles, /\.retake-image-studio-panel\.is-focus-editor/);
  assert.match(
    annotationStyles,
    /\.retake-image-studio-panel\.is-annotation\.is-focus-editor/,
  );
  assert.doesNotMatch(editorPanels.join('\n'), /<span>Image Studio<\/span>/);
  assert.match(editorPanels.join('\n'), /const defaultCropScale = 0\.9/);
});

test('annotation view keeps compact controls and a conflict-free reset gesture', async () => {
  const [overlay, panel, panelSupport, styles] = await Promise.all([
    readFile(
      new URL('../plugin/src/annotation-overlay.tsx', import.meta.url),
      'utf8',
    ),
    readFile(
      new URL('../plugin/src/annotation-panel.tsx', import.meta.url),
      'utf8',
    ),
    readFile(
      new URL('../plugin/src/annotation-panel-support.tsx', import.meta.url),
      'utf8',
    ),
    readFile(
      new URL('../plugin/src/annotation-styles.ts', import.meta.url),
      'utf8',
    ),
  ]);

  assert.match(overlay, /scale\(0\.86 \$\{fixedShapeYScale \* 0\.86\}\)/);
  assert.match(panel, /onDoubleClick=\{\(event\) => \{/);
  assert.match(panel, /activeTool !== 'select' \|\| pending/);
  assert.match(panel, /useLayoutEffect/);
  assert.match(panel, /visibility: imageAspectRatio === null \? 'hidden' : 'visible'/);
  assert.match(panel, /'brush'/);
  assert.match(panelSupport, /data-tool-label=\{label\}/);
  assert.doesNotMatch(
    styles,
    /\.retake-annotation-modal-layer\s*\{[^}]*backdrop-filter/s,
  );
  assert.match(panel, /is-annotation nodrag nopan nowheel/);
  assert.match(panel, /onWheelCapture=\{onStageWheel\}/);
  assert.match(panel, /translate3d\(\$\{pan\.x\}px, \$\{pan\.y\}px, 0\)/);
  assert.match(panel, /applyStageTransform/);
  assert.match(panel, /function annotationStageTransform/);
  assert.match(panel, /return 'none'/);
  const panPointerMove = panel.slice(
    panel.indexOf("if (gesture.kind === 'pan')"),
    panel.indexOf('const point = normalizedPoint', panel.indexOf("if (gesture.kind === 'pan')")),
  );
  assert.match(panPointerMove, /applyStageTransform/);
  assert.doesNotMatch(panPointerMove, /setPan/);
  assert.doesNotMatch(
    styles,
    /\.retake-annotation-(?:hover-prompt|zoom)\s*\{[^}]*backdrop-filter/s,
  );
  assert.match(
    styles,
    /\.retake-image-studio-panel\.is-annotation\s*\{[^}]*inset: 48px 18px/s,
  );
  assert.doesNotMatch(
    styles,
    /\.retake-image-studio-panel\.is-annotation\s*\{[^}]*transform:/s,
  );
  assert.doesNotMatch(
    styles,
    /\.retake-annotation-stage-shell\s*\{[^}]*(?:contain: layout paint|isolation: isolate)/s,
  );
  assert.match(
    panel,
    /<X aria-hidden="true" size=\{8\} strokeWidth=\{2\.25\} \/>/,
  );
  assert.match(
    styles,
    /\.retake-annotation-quick-delete\s*\{[^}]*width:\s*14px;[^}]*height:\s*14px;/s,
  );
});

test('outpaint measures the source when persisted dimensions are absent', async () => {
  const [source, styles] = await Promise.all([
    readFile(
      new URL('../plugin/src/outpaint-panel.tsx', import.meta.url),
      'utf8',
    ),
    readFile(
      new URL('../plugin/src/outpaint-styles.ts', import.meta.url),
      'utf8',
    ),
  ]);

  assert.match(source, /sourceUrl \? \(/);
  assert.match(source, /geometry \? \(/);
  assert.match(source, /retake-outpaint-source-measure/);
  assert.match(source, /naturalHeight/);
  assert.match(source, /naturalWidth/);
  assert.match(source, /300 \* geometry\.targetWidth \/ geometry\.targetHeight/);
  assert.doesNotMatch(styles, /\.retake-outpaint-stage\s*\{[^}]*max-height:/s);
});

test('percentage resize uses the same inspectable range control as outpaint', async () => {
  const source = await readFile(
    new URL('../plugin/src/resize-panel.tsx', import.meta.url),
    'utf8',
  );

  assert.match(source, /retake-image-studio-range is-resize-scale/);
  assert.match(source, /type="range"/);
  assert.match(source, /<output>\{value\}%<\/output>/);
});
