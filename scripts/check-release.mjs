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
const declarativeComponentCounts = {
  agentPresets: rootPackage.components.agentPresets.length,
  skills: rootPackage.components.skills.length,
  workflows: rootPackage.components.workflows.length,
};

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
assert.deepEqual(
  declarativeComponentCounts,
  {
    agentPresets: 0,
    skills: 4,
    workflows: 1,
  },
  'The Image Studio Package must carry only its active IP Design definitions.',
);
assert.deepEqual(rootPackage.dependencies, []);

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
    'design.ip_character.define',
    'image.annotation_edit',
    'image.local_adjust',
    'image.local_crop',
    'image.local_resize',
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
]) {
  assert.ok(
    readme.includes(expectedLink),
    `README must link ${expectedLink}.`,
  );
}
assert.ok(
  readme.includes(
    'github:retake-tools/image-studio@main#subdirectory=plugin',
  ),
  'README must document the stable Git update source.',
);
assert.ok(
  readme.includes(
    `github:retake-tools/image-studio@v${authoringPackage.version}#subdirectory=plugin`,
  ),
  'README must document the immutable version-tag source.',
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
for (const requiredBuildFile of [
  'package-lock.json',
  'package.json',
  'vendor/npm/retake-plugin-api-0.1.7.tgz',
  'vendor/npm/retake-tools-package-contracts-0.1.7.tgz',
  'vendor/npm/retake-tools-plugin-runtime-0.1.7.tgz',
]) {
  assert.ok(
    rootPackage.files.includes(requiredBuildFile),
    `Portable source must include ${requiredBuildFile}.`,
  );
}
assert.equal(rootPackage.files.includes('src/contracts.ts'), false);
assert.equal(rootPackage.files.includes('src/retake-plugin-api.d.ts'), false);
const pluginEntrypoint = await readText('src/index.tsx', packageRoot);
for (const authoringHelper of [
  'defineCapability',
  'defineCommand',
  'definePanel',
  'definePlugin',
]) {
  assert.ok(
    pluginEntrypoint.includes(authoringHelper),
    `Plugin entrypoint must use ${authoringHelper}.`,
  );
}
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
  declarativeComponentCounts,
  version: authoringPackage.version,
}));

async function readJson(filePath, root) {
  return JSON.parse(await readText(filePath, root));
}

async function readText(filePath, root) {
  return readFile(new URL(filePath, root), 'utf8');
}
