import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const repositoryRoot = new URL('../', import.meta.url);
const packageRoot = new URL('../plugin/', import.meta.url);

const authoringPackage = await readJson('package.json', repositoryRoot);
const rootPackage = await readJson('retake.package.json', packageRoot);
const pluginModule = await readJson('retake.plugin.json', packageRoot);
const capabilityDescriptors = pluginModule.contributions.filter(
  (entry) => entry.kind === 'capability',
);
const runtimeContributionDescriptors = pluginModule.contributions.filter(
  (entry) => entry.kind !== 'capability',
);
for (const descriptor of runtimeContributionDescriptors) {
  assert.equal(
    'definitionHash' in descriptor,
    false,
    `${descriptor.contributionId} must not carry a null definitionHash placeholder.`,
  );
  assert.equal(
    'definitionPath' in descriptor,
    false,
    `${descriptor.contributionId} must not carry a null definitionPath placeholder.`,
  );
}
const capabilities = await Promise.all(
  capabilityDescriptors.map((entry) => (
    readJson(entry.definitionPath, packageRoot)
  )),
);

assert.match(
  authoringPackage.version,
  /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-[0-9A-Za-z.-]+)?$/,
  'The release candidate must use a semantic version.',
);
assert.equal(rootPackage.version, authoringPackage.version);
assert.equal(pluginModule.version, authoringPackage.version);
assert.equal(rootPackage.packageId, 'design.retake.image-studio');
assert.equal(pluginModule.pluginModuleId, 'design.retake.image-studio.web');

const moduleDescriptor = rootPackage.components.pluginModules.find(
  (entry) => entry.pluginModuleId === pluginModule.pluginModuleId,
);
assert.ok(moduleDescriptor, 'Root Package must declare the PluginModule.');
assert.equal(moduleDescriptor.version, pluginModule.version);
assert.equal(moduleDescriptor.definitionHash, pluginModule.definitionHash);

for (const [index, capability] of capabilities.entries()) {
  const descriptor = capabilityDescriptors[index];
  assert.ok(descriptor);
  assert.match(
    capability.version,
    /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-[0-9A-Za-z.-]+)?$/,
    `${capability.capabilityId} must use a semantic version.`,
  );
  assert.equal(descriptor.definitionHash, capability.definitionHash);
}
assert.deepEqual(
  capabilities.map((capability) => capability.capabilityId).sort(),
  [
    'image.annotation_edit',
    'image.local_adjust',
    'image.local_crop',
    'image.local_resize',
    'image.local_selection_mask',
    'image.masked_edit',
    'image.outpaint',
  ],
);

const requiredPublicFiles = [
  'AGENTS.md',
  'CONTRIBUTING.md',
  'LICENSE',
  'README.md',
  'README.zh-CN.md',
  'docs/authoring.md',
  'docs/annotation.md',
  'docs/install.md',
  'docs/masked-edit.md',
  'docs/outpaint.md',
  'docs/releasing.md',
  'docs/selection-mask.md',
  '.github/workflows/ci.yml',
];
for (const filePath of requiredPublicFiles) {
  await readFile(new URL(filePath, repositoryRoot));
}

const readme = await readText('README.md', repositoryRoot);
for (const expectedLink of [
  './README.zh-CN.md',
  './docs/authoring.md',
  './docs/annotation.md',
  './docs/install.md',
  './docs/masked-edit.md',
  './docs/outpaint.md',
  './docs/releasing.md',
  './docs/selection-mask.md',
]) {
  assert.ok(
    readme.includes(expectedLink),
    `README must link ${expectedLink}.`,
  );
}
assert.ok(
  readme.includes(
    'github:retake-tools/image-studio@<commit-or-tag>#subdirectory=plugin',
  ),
  'README must document the exact Git source boundary.',
);

const workflow = await readText('.github/workflows/ci.yml', repositoryRoot);
assert.ok(
  workflow.includes('npm run release:check'),
  'CI must execute the release-candidate check.',
);

const forbiddenSourcePatterns = [
  /@retake-tools\/whiteboard/,
  /(?:^|["'])\/Users\//m,
  /(?:^|["'])\/home\//m,
  /(?:^|["'])[A-Za-z]:\\\\/,
];
const portableSourceFiles = rootPackage.files.filter(
  (filePath) => /\.(?:ts|tsx|js|jsx|mjs|cjs)$/.test(filePath),
);
for (const filePath of portableSourceFiles) {
  const source = await readText(filePath, packageRoot);
  for (const pattern of forbiddenSourcePatterns) {
    assert.doesNotMatch(
      source,
      pattern,
      `${filePath} must not depend on private Core or machine paths.`,
    );
  }
}

console.log(JSON.stringify({
  capabilityIds: capabilities.map((capability) => capability.capabilityId),
  definitionHashesSynchronized: true,
  documentationFiles: requiredPublicFiles.length,
  gitSourceRoot: 'plugin',
  packageId: rootPackage.packageId,
  pluginModuleId: pluginModule.pluginModuleId,
  portableSourceFiles: portableSourceFiles.length,
  version: authoringPackage.version,
}));

async function readJson(filePath, root) {
  return JSON.parse(await readText(filePath, root));
}

async function readText(filePath, root) {
  return readFile(new URL(filePath, root), 'utf8');
}
