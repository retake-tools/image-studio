import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { createPluginTranslator } from '@retake/plugin-api';
import {
  adjustImageCommand,
  annotationImageCommand,
  cropImageCommand,
  guidedEditImageCommand,
  imageStudioMessages,
  imageStudioPlugin,
  maskedEditSelectionCommand,
  outpaintImageCommand,
  resizeImageCommand,
  selectionMaskImageCommand,
} from '../plugin/src/index';
import { imageStudioSettings } from '../plugin/src/settings';
import { imageStudioTheme } from '../plugin/src/theme';

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
      selectionMaskImageCommand.icon,
      guidedEditImageCommand.icon,
      maskedEditSelectionCommand.icon,
      outpaintImageCommand.icon,
    ],
    [
      'adjustments',
      'annotation',
      'crop',
      'resize',
      'selection-mask',
      'smart-edit',
      'smart-edit',
      'outpaint',
    ],
  );
});

test('panels do not own locale detection or private theme fallbacks', async () => {
  const sources = await Promise.all([
    'adjust-panel.tsx',
    'annotation-copy.ts',
    'crop-panel.tsx',
    'masked-edit-panel.tsx',
    'outpaint-copy.ts',
    'resize-panel.tsx',
    'selection-mask-panel.tsx',
  ].map((fileName) => (
    readFile(new URL(`../plugin/src/${fileName}`, import.meta.url), 'utf8')
  )));
  const combined = sources.join('\n');
  assert.doesNotMatch(combined, /isChineseLocale/);
  assert.doesNotMatch(combined, /startsWith\(['"]zh/);
  assert.doesNotMatch(combined, /var\(--retake-(?:accent|surface|text),/);
});

test('annotation view keeps compact controls and a conflict-free reset gesture', async () => {
  const [overlay, panel, styles] = await Promise.all([
    readFile(
      new URL('../plugin/src/annotation-overlay.tsx', import.meta.url),
      'utf8',
    ),
    readFile(
      new URL('../plugin/src/annotation-panel.tsx', import.meta.url),
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
  assert.match(panel, /<Trash2 aria-hidden="true" size=\{11\} \/>/);
  assert.match(
    styles,
    /\.retake-annotation-quick-delete\s*\{[^}]*width:\s*20px;[^}]*height:\s*20px;/s,
  );
});
