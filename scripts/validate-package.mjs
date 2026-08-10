import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const packageRoot = new URL('../plugin/', import.meta.url);
const packageManifest = await readJson('retake.package.json');
const pluginManifest = await readJson('retake.plugin.json');
const ipCharacterCapability = await readJson(
  'definitions/design.ip_character.define.json',
);
const ipCharacterParameters = await readJson(
  'definitions/design.ip_character.define.parameters.json',
);
const annotationCapability = await readJson(
  'definitions/image.annotation_edit.json',
);
const annotationParameters = await readJson(
  'definitions/image.annotation_edit.parameters.json',
);
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
const maskedEditCapability = await readJson(
  'definitions/image.masked_edit.json',
);
const maskedEditParameters = await readJson(
  'definitions/image.masked_edit.parameters.json',
);
const outpaintCapability = await readJson(
  'definitions/image.outpaint.json',
);
const outpaintParameters = await readJson(
  'definitions/image.outpaint.parameters.json',
);
const ipCharacterSkill = await readJson(
  'skills/ip-character-strategy/retake.skill.json',
);
const ipApplicationBoardSkill = await readJson(
  'skills/ip-application-board/retake.skill.json',
);
const ipCharacterSheetSkill = await readJson(
  'skills/ip-character-sheet/retake.skill.json',
);
const ipConceptDirectionsSkill = await readJson(
  'skills/ip-concept-directions/retake.skill.json',
);
const ipCharacterWorkflow = await readJson(
  'workflows/ip-character-design/retake.workflow.json',
);

assert.equal(packageManifest.packageId, 'design.retake.image-studio');
assert.equal(packageManifest.version, '0.12.3');
assert.equal(packageManifest.retakeHostCompatibility, '>=0.1.4 <0.2.0');
assert.equal(packageManifest.license, 'Apache-2.0');
assert.equal(packageManifest.files.includes('NOTICE'), true);
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
    'definitions/design.ip_character.define.json',
    'definitions/design.ip_character.define.parameters.json',
    'definitions/image.annotation_edit.json',
    'definitions/image.annotation_edit.parameters.json',
    'definitions/image.local_adjust.json',
    'definitions/image.local_adjust.parameters.json',
    'definitions/image.local_crop.json',
    'definitions/image.local_crop.parameters.json',
    'definitions/image.local_resize.json',
    'definitions/image.local_resize.parameters.json',
    'definitions/image.masked_edit.json',
    'definitions/image.masked_edit.parameters.json',
    'definitions/image.outpaint.json',
    'definitions/image.outpaint.parameters.json',
  ],
);

const ipCharacterCapabilityDescriptor = pluginManifest.contributions.find(
  (entry) => entry.definitionPath === 'definitions/design.ip_character.define.json',
);
assert.ok(ipCharacterCapabilityDescriptor);
assert.equal(
  ipCharacterCapabilityDescriptor.definitionHash,
  ipCharacterCapability.definitionHash,
);
assert.equal(ipCharacterCapability.capabilityId, 'design.ip_character.define');
assert.equal(ipCharacterCapability.outputSlots[0]?.artifactType, 'character_bible');
assert.equal(ipCharacterCapability.supportedAdapterClasses.includes('agent_runtime.text'), true);
assert.deepEqual(ipCharacterParameters.required ?? [], []);
assert.equal(ipCharacterParameters.additionalProperties, false);
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
for (const contribution of pluginManifest.contributions) {
  assert.deepEqual(
    Object.keys(contribution).sort(compareText),
    (
      contribution.kind === 'capability'
        ? [
            'contributionId',
            'definitionHash',
            'definitionPath',
            'exportName',
            'kind',
          ]
        : ['contributionId', 'exportName', 'kind']
    ),
    `Plugin contribution must use the exact ${contribution.kind} shape: ${
      contribution.contributionId
    }`,
  );
}

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

const maskedEditCapabilityDescriptor = pluginManifest.contributions.find(
  (entry) => entry.definitionPath === 'definitions/image.masked_edit.json',
);
assert.ok(maskedEditCapabilityDescriptor);
assert.equal(
  maskedEditCapabilityDescriptor.definitionHash,
  maskedEditCapability.definitionHash,
);
assert.equal(maskedEditCapability.capabilityId, 'image.masked_edit');
assert.equal(
  maskedEditCapability.parametersSchemaRef,
  'definitions/image.masked_edit.parameters.json',
);
assert.deepEqual(maskedEditParameters.required, ['maskEncoding']);
assert.equal(maskedEditParameters.additionalProperties, false);

const outpaintCapabilityDescriptor = pluginManifest.contributions.find(
  (entry) => entry.definitionPath === 'definitions/image.outpaint.json',
);
assert.ok(outpaintCapabilityDescriptor);
assert.equal(
  outpaintCapabilityDescriptor.definitionHash,
  outpaintCapability.definitionHash,
);
assert.equal(outpaintCapability.capabilityId, 'image.outpaint');
assert.equal(
  outpaintCapability.parametersSchemaRef,
  'definitions/image.outpaint.parameters.json',
);
assert.deepEqual(outpaintParameters.required, [
  'aspectPreset',
  'contractVersion',
  'guideHeight',
  'guideWidth',
  'maskEncoding',
  'sourceHeight',
  'sourceWidth',
  'sourceX',
  'sourceY',
  'targetHeight',
  'targetWidth',
]);
assert.equal(outpaintParameters.additionalProperties, false);
assert.equal(outpaintCapability.outputSlots[0]?.cardinality, 'many');
assert.equal(outpaintCapability.outputSlots[0]?.slotId, 'expanded_images');

const annotationCapabilityDescriptor = pluginManifest.contributions.find(
  (entry) => entry.definitionPath === 'definitions/image.annotation_edit.json',
);
assert.ok(annotationCapabilityDescriptor);
assert.equal(
  annotationCapabilityDescriptor.definitionHash,
  annotationCapability.definitionHash,
);
assert.equal(annotationCapability.capabilityId, 'image.annotation_edit');
assert.equal(
  annotationCapability.parametersSchemaRef,
  'definitions/image.annotation_edit.parameters.json',
);
assert.deepEqual(annotationParameters.required, ['manifest']);
assert.equal(annotationParameters.additionalProperties, false);
assert.equal(annotationCapability.outputSlots[0]?.cardinality, 'many');
assert.equal(annotationCapability.outputSlots[0]?.slotId, 'edited_images');

assert.deepEqual(packageManifest.dependencies, []);
assert.deepEqual(
  packageManifest.components.agentPresets.map((entry) => entry.agentPresetId),
  [],
);
assert.deepEqual(
  packageManifest.components.skills.map((entry) => entry.skillId),
  [
    'retake.image.ip-application-board',
    'retake.image.ip-character-sheet',
    'retake.image.ip-character-strategy',
    'retake.image.ip-concept-directions',
  ],
);
assert.deepEqual(
  packageManifest.components.workflows.map(
    (entry) => entry.workflowDefinitionId,
  ),
  ['retake.workflow.ip-character-design'],
);
assert.equal(
  ipCharacterSkill.capabilityBindings[0]?.capabilityId,
  ipCharacterCapability.capabilityId,
);
assert.deepEqual(
  ipCharacterSkill.capabilityBindings[0]?.inputSlots,
  ['creative_brief', 'brand_constraints'],
);
assert.deepEqual(
  ipCharacterSkill.capabilityBindings[0]?.outputSlots,
  ['character_bible'],
);
assert.deepEqual(
  [
    ipConceptDirectionsSkill,
    ipCharacterSheetSkill,
    ipApplicationBoardSkill,
  ].map((skill) => skill.capabilityBindings[0]?.capabilityId),
  ['image.generate', 'image.generate', 'image.generate'],
);
assert.deepEqual(
  ipCharacterWorkflow.steps.map((step) => step.stepId),
  [
    'define_character',
    'generate_concept_directions',
    'generate_character_sheet',
    'generate_application_board',
  ],
);
assert.deepEqual(
  ipCharacterWorkflow.outputSlots.map((slot) => slot.artifactType),
  [
    'character_bible',
    'character_reference',
    'character_sheet',
    'ip_application_board',
  ],
);
assert.equal(
  ipCharacterWorkflow.steps[1]?.capabilityLock.definitionHash,
  'sha256:retake-image-generate-document-prompt-v2',
);
assert.deepEqual(
  ipCharacterWorkflow.steps[1]?.defaultParameters,
  { variationCount: 2 },
  'Concept generation must expose two independent candidates by default.',
);
assert.match(
  ipConceptDirectionsSkill.outputRequirements.join(' '),
  /one visual direction per output image/i,
);
assert.match(
  ipConceptDirectionsSkill.outputRequirements.join(' '),
  /Never place multiple alternatives in one image/i,
);
assert.equal(
  ipCharacterWorkflow.gates[0]?.subject.workflowOutputSlotId,
  'application_board',
);
assert.deepEqual(
  packageManifest.entrypoints.map((entry) => entry.entrypointId),
  [
    'skill:retake.image.ip-character-strategy',
    'workflow:retake.workflow.ip-character-design',
  ],
);
const publicIpStrategy = packageManifest.entrypoints[0];
assert.equal(publicIpStrategy.kind, 'skill');
assert.equal(publicIpStrategy.recommended, true);
assert.deepEqual(publicIpStrategy.requiredInputSlotIds, ['creative_brief']);
assert.equal(
  JSON.stringify(packageManifest).includes('guided-image'),
  false,
  'Retired Guided Image definitions must not enter the active Package manifest.',
);

for (const filePath of packageManifest.files) {
  await readFile(new URL(filePath, packageRoot));
}

console.log(JSON.stringify({
  capabilityId: capability.capabilityId,
  capabilityIds: [
    ipCharacterCapability.capabilityId,
    annotationCapability.capabilityId,
    capability.capabilityId,
    cropCapability.capabilityId,
    resizeCapability.capabilityId,
    maskedEditCapability.capabilityId,
    outpaintCapability.capabilityId,
  ],
  packageId: packageManifest.packageId,
  pluginModuleId: pluginManifest.pluginModuleId,
  sourceFiles: packageManifest.files.length,
  agentPresetIds: [],
  skillIds: [
    ipApplicationBoardSkill.skillId,
    ipCharacterSheetSkill.skillId,
    ipConceptDirectionsSkill.skillId,
    ipCharacterSkill.skillId,
  ],
  workflowIds: [ipCharacterWorkflow.workflowId],
}));

async function readJson(filePath) {
  return JSON.parse(await readFile(new URL(filePath, packageRoot), 'utf8'));
}

function compareText(left, right) {
  return left < right ? -1 : left > right ? 1 : 0;
}
