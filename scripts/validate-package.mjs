import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const packageRoot = new URL('../plugin/', import.meta.url);
const packageManifest = await readJson('retake.package.json');
const pluginManifest = await readJson('retake.plugin.json');
const capability = await readJson('definitions/image.local_adjust.json');
const parameters = await readJson(
  'definitions/image.local_adjust.parameters.json',
);
const cropCapability = await readJson('definitions/image.local_crop.json');
const cropParameters = await readJson(
  'definitions/image.local_crop.parameters.json',
);
const resizeCapability = await readJson('definitions/image.local_resize.json');
const resizeParameters = await readJson(
  'definitions/image.local_resize.parameters.json',
);
const selectionMaskCapability = await readJson(
  'definitions/image.local_selection_mask.json',
);
const selectionMaskParameters = await readJson(
  'definitions/image.local_selection_mask.parameters.json',
);

assert.equal(packageManifest.packageId, 'design.retake.image-studio');
assert.equal(
  packageManifest.build.profile,
  'retake_web_plugin_v1',
);
assert.equal(
  packageManifest.components.pluginModules[0].pluginModuleId,
  pluginManifest.pluginModuleId,
);
assert.equal(
  packageManifest.components.pluginModules[0].definitionHash,
  pluginManifest.definitionHash,
);
assert.deepEqual(
  packageManifest.components.pluginModules[0].resourcePaths,
  [
    'definitions/image.local_adjust.json',
    'definitions/image.local_adjust.parameters.json',
    'definitions/image.local_crop.json',
    'definitions/image.local_crop.parameters.json',
    'definitions/image.local_resize.json',
    'definitions/image.local_resize.parameters.json',
    'definitions/image.local_selection_mask.json',
    'definitions/image.local_selection_mask.parameters.json',
  ],
);
assert.deepEqual(
  [...packageManifest.files].sort(compareText),
  packageManifest.files,
  'Retake Package files must stay sorted.',
);
assert.deepEqual(
  [...pluginManifest.permissions].sort(compareText),
  pluginManifest.permissions,
  'Plugin permissions must stay sorted.',
);
assert.deepEqual(
  pluginManifest.contributions.map((entry) => entry.contributionId)
    .sort(compareText),
  pluginManifest.contributions.map((entry) => entry.contributionId),
  'Plugin contribution IDs must stay sorted.',
);

const capabilityDescriptor = pluginManifest.contributions.find(
  (entry) => entry.definitionPath === 'definitions/image.local_adjust.json',
);
assert.ok(capabilityDescriptor);
assert.equal(capabilityDescriptor.definitionHash, capability.definitionHash);
assert.equal(capabilityDescriptor.definitionPath, 'definitions/image.local_adjust.json');
assert.equal(capability.capabilityId, 'image.local_adjust');
assert.equal(capability.parametersSchemaRef, 'definitions/image.local_adjust.parameters.json');
assert.deepEqual(parameters.required, [
  'brightness',
  'contrast',
  'saturation',
]);
assert.equal(parameters.additionalProperties, false);

const cropCapabilityDescriptor = pluginManifest.contributions.find(
  (entry) => entry.definitionPath === 'definitions/image.local_crop.json',
);
assert.ok(cropCapabilityDescriptor);
assert.equal(
  cropCapabilityDescriptor.definitionHash,
  cropCapability.definitionHash,
);
assert.equal(cropCapability.capabilityId, 'image.local_crop');
assert.equal(
  cropCapability.parametersSchemaRef,
  'definitions/image.local_crop.parameters.json',
);
assert.deepEqual(cropParameters.required, [
  'aspectPreset',
  'height',
  'outputHeight',
  'outputWidth',
  'sourceHeight',
  'sourceWidth',
  'width',
  'x',
  'y',
]);
assert.equal(cropParameters.additionalProperties, false);

const resizeCapabilityDescriptor = pluginManifest.contributions.find(
  (entry) => entry.definitionPath === 'definitions/image.local_resize.json',
);
assert.ok(resizeCapabilityDescriptor);
assert.equal(
  resizeCapabilityDescriptor.definitionHash,
  resizeCapability.definitionHash,
);
assert.equal(resizeCapability.capabilityId, 'image.local_resize');
assert.equal(
  resizeCapability.parametersSchemaRef,
  'definitions/image.local_resize.parameters.json',
);
assert.deepEqual(resizeParameters.required, [
  'allowUpscale',
  'matteColor',
  'outputFormat',
  'outputHeight',
  'outputWidth',
  'quality',
  'resizeMode',
  'resizeValue',
  'sourceHeight',
  'sourceWidth',
]);
assert.equal(resizeParameters.additionalProperties, false);

const selectionMaskCapabilityDescriptor = pluginManifest.contributions.find(
  (entry) => (
    entry.definitionPath === 'definitions/image.local_selection_mask.json'
  ),
);
assert.ok(selectionMaskCapabilityDescriptor);
assert.equal(
  selectionMaskCapabilityDescriptor.definitionHash,
  selectionMaskCapability.definitionHash,
);
assert.equal(
  selectionMaskCapability.capabilityId,
  'image.local_selection_mask',
);
assert.equal(
  selectionMaskCapability.parametersSchemaRef,
  'definitions/image.local_selection_mask.parameters.json',
);
assert.deepEqual(selectionMaskParameters.required, [
  'inverted',
  'maskEncoding',
  'sourceHeight',
  'sourceWidth',
  'strokeCount',
]);
assert.equal(selectionMaskParameters.additionalProperties, false);

for (const filePath of packageManifest.files) {
  await readFile(new URL(filePath, packageRoot));
}

console.log(JSON.stringify({
  capabilityId: capability.capabilityId,
  capabilityIds: [
    capability.capabilityId,
    cropCapability.capabilityId,
    resizeCapability.capabilityId,
    selectionMaskCapability.capabilityId,
  ],
  packageId: packageManifest.packageId,
  pluginModuleId: pluginManifest.pluginModuleId,
  sourceFiles: packageManifest.files.length,
}));

async function readJson(filePath) {
  return JSON.parse(await readFile(new URL(filePath, packageRoot), 'utf8'));
}

function compareText(left, right) {
  return left < right ? -1 : left > right ? 1 : 0;
}
