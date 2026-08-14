import {
  defineCapability,
  defineCommand,
  definePanel,
  definePlugin,
  defineMessages,
  type PluginActivationContext as PluginActivationContextV2,
  type PluginCommandIcon,
  type PluginComponent,
  type PluginImageBlock as ImageToolbarBlockV2,
  type PluginOperationCommandContext,
  type PluginPanelProps,
  type RetakeCapabilityContributionV2,
} from '@retake/plugin-api';
import { imageStudioSettings } from './settings';
import { ImageStudioAdjustPanel } from './adjust-panel';
import { ImageStudioAnnotationPanel } from './annotation-panel';
import { ImageStudioCropPanel } from './crop-panel';
import { ImageStudioOutpaintPanel } from './outpaint-panel';
import {
  adjustPanelStore,
  annotationPanelStore,
  cropPanelStore,
  outpaintPanelStore,
  resizePanelStore,
} from './panel-store';
import { ImageStudioResizePanel } from './resize-panel';

const resultSlotId = 'result_image';

export const imageStudioMessages = defineMessages({
  pluginDescription: localized(
    'First-party image authoring tools for Retake.',
    'Retake 官方图片创作工具。',
  ),
  pluginName: localized('Image Studio', '图片工作室'),
});

export const ipCharacterDefinitionCapability = defineCapability({
  apiVersion: 2,
  definition: {
    capabilityId: 'design.ip_character.define',
    category: 'production_design',
    definitionHash: 'sha256:retake-design-ip-character-define-v1',
    displayName: localized('Define IP character', '定义 IP 角色'),
    inputSlots: [
      {
        artifactTypes: ['creative_brief'],
        bindingKinds: ['inline', 'block', 'asset', 'artifact_revision'],
        cardinality: 'one',
        dataTypes: ['text', 'document'],
        required: true,
        semanticRole: 'creative_brief',
        slotId: 'creative_brief',
      },
      {
        artifactTypes: ['brand_constraints'],
        bindingKinds: ['inline', 'block', 'asset', 'artifact_revision'],
        cardinality: 'optional',
        dataTypes: ['text', 'document'],
        required: false,
        semanticRole: 'brand_constraints',
        slotId: 'brand_constraints',
      },
    ],
    outputSlots: [{
      artifactType: 'character_bible',
      cardinality: 'one',
      dataType: 'document',
      projectionBlockTypes: ['document'],
      schemaRef: 'retake.ip-character-bible-markdown/v1',
      semanticRole: 'character_bible',
      slotId: 'character_bible',
    }],
    parametersSchemaRef:
      'definitions/design.ip_character.define.parameters.json',
    runtimeRequirements: ['text_generation', 'durable_asset_output'],
    schemaVersion: 2,
    supportedAdapterClasses: ['text.document', 'agent_runtime.text'],
    version: '0.1.0',
  },
  kind: 'capability',
});

export const localAdjustCapability = capabilityContribution({
  capabilityId: 'image.local_adjust',
  definitionHash: 'sha256:image-local-adjust-v2',
  displayName: localized(
    'Local image adjustment',
    '本地图片调整',
  ),
  outputRole: 'adjusted_image',
  parametersSchemaRef: 'definitions/image.local_adjust.parameters.json',
  runtimeRequirements: ['browser.canvas_2d'],
  supportedAdapterClasses: ['local_canvas'],
  version: '0.2.0',
});

export const localCropCapability = capabilityContribution({
  capabilityId: 'image.local_crop',
  definitionHash: 'sha256:image-local-crop-v2',
  displayName: localized('Local image crop', '本地图片裁剪'),
  outputRole: 'cropped_image',
  parametersSchemaRef: 'definitions/image.local_crop.parameters.json',
  runtimeRequirements: ['browser.canvas_2d'],
  supportedAdapterClasses: ['local_canvas'],
  version: '0.2.0',
});

export const localResizeCapability = capabilityContribution({
  capabilityId: 'image.local_resize',
  definitionHash: 'sha256:image-local-resize-v2',
  displayName: localized('Local image resize', '本地图片缩放'),
  outputRole: 'resized_image',
  parametersSchemaRef: 'definitions/image.local_resize.parameters.json',
  runtimeRequirements: ['browser.canvas_2d'],
  supportedAdapterClasses: ['local_canvas'],
  version: '0.2.0',
});

export const maskedEditCapability = defineCapability({
  apiVersion: 2,
  definition: {
    capabilityId: 'image.masked_edit',
    category: 'image_editing',
    definitionHash: 'sha256:image-masked-edit-v2',
    displayName: localized('Masked AI image edit', '局部 AI 图片编辑'),
    inputSlots: [
      imageSourceInput(),
      imageInput('inpaint_mask', 'inpaint_mask'),
      textInput(),
    ],
    outputSlots: [{
      cardinality: 'one',
      dataType: 'image',
      projectionBlockTypes: ['image'],
      semanticRole: 'edited_image',
      slotId: 'edited_image',
    }],
    parametersSchemaRef: 'definitions/image.masked_edit.parameters.json',
    runtimeRequirements: ['durable_asset_output', 'image_generation'],
    schemaVersion: 2,
    supportedAdapterClasses: ['agent_runtime.media'],
    version: '0.2.0',
  },
  kind: 'capability',
});

export const annotationEditCapability = defineCapability({
  apiVersion: 2,
  definition: {
    capabilityId: 'image.annotation_edit',
    category: 'image_editing',
    definitionHash: 'sha256:image-annotation-edit-v3',
    displayName: localized('Annotation image edit', '图片标注编辑'),
    inputSlots: [
      imageSourceInput(),
      assetImageInput('annotated_composite', 'annotated_composite'),
      textInput(),
    ],
    outputSlots: [{
      cardinality: 'many',
      dataType: 'image',
      projectionBlockTypes: ['image'],
      semanticRole: 'edited_images',
      slotId: 'edited_images',
    }],
    parametersSchemaRef:
      'definitions/image.annotation_edit.parameters.json',
    runtimeRequirements: ['durable_asset_output', 'image_generation'],
    schemaVersion: 2,
    supportedAdapterClasses: ['agent_runtime.media'],
    version: '0.3.0',
  },
  kind: 'capability',
});

export const outpaintCapability = defineCapability({
  apiVersion: 2,
  definition: {
    capabilityId: 'image.outpaint',
    category: 'image_editing',
    definitionHash: 'sha256:image-outpaint-v1',
    displayName: localized('AI image expand', 'AI 扩图'),
    inputSlots: [
      imageSourceInput(),
      assetImageInput('outpaint_guide', 'control_image'),
      assetImageInput('inpaint_mask', 'inpaint_mask'),
      textInput(),
    ],
    outputSlots: [{
      cardinality: 'many',
      dataType: 'image',
      projectionBlockTypes: ['image'],
      semanticRole: 'expanded_images',
      slotId: 'expanded_images',
    }],
    parametersSchemaRef: 'definitions/image.outpaint.parameters.json',
    runtimeRequirements: ['durable_asset_output', 'image_generation'],
    schemaVersion: 2,
    supportedAdapterClasses: ['agent_runtime.media'],
    version: '0.1.0',
  },
  kind: 'capability',
});

export const adjustImageCommand = imageToolbarCommand(
  'design.retake.image-studio.command.adjust',
  localized('Adjust image', '调整图片'),
  adjustPanelStore,
  'adjustments',
  10,
);
export const annotationImageCommand = imageToolbarCommand(
  'design.retake.image-studio.command.annotation',
  localized('Annotate image', '标注图片'),
  annotationPanelStore,
  'annotation',
  30,
  ['Mod+Shift+A'],
);
export const cropImageCommand = imageToolbarCommand(
  'design.retake.image-studio.command.crop',
  localized('Crop image', '裁剪图片'),
  cropPanelStore,
  'crop',
  20,
);
export const resizeImageCommand = imageToolbarCommand(
  'design.retake.image-studio.command.resize',
  localized('Resize image', '缩放图片'),
  resizePanelStore,
  'resize',
  40,
);
export const outpaintImageCommand = imageToolbarCommand(
  'design.retake.image-studio.command.outpaint',
  localized('Expand image', 'AI 扩图'),
  outpaintPanelStore,
  'outpaint',
  50,
);

export const reopenAnnotationOperationCommand = defineCommand({
  apiVersion: 1,
  commandId: 'design.retake.image-studio.command.annotation-history',
  contextKind: 'operation',
  defaultBindings: [{
    order: 10,
    surfaceId: 'operation.inspector',
  }],
  icon: 'annotation',
  kind: 'command',
  label: localized('Reopen annotation edit', '重新打开标注编辑'),
  ownedCapabilityId: 'image.annotation_edit',
  run({ operation }: PluginOperationCommandContext) {
    if (!operation.source) return;
    closePanels();
    annotationPanelStore.openOperation(operation);
  },
});

export const adjustImagePanel = panelContribution(ImageStudioAdjustPanel);
export const annotationImagePanel = panelContribution(
  ImageStudioAnnotationPanel,
);
export const cropImagePanel = panelContribution(ImageStudioCropPanel);
export const outpaintPanel = panelContribution(ImageStudioOutpaintPanel);
export const resizeImagePanel = panelContribution(ImageStudioResizePanel);

export const imageStudioPlugin = definePlugin({
  contributions: {
    adjustImageCommand,
    adjustImagePanel,
    annotationEditCapability,
    annotationImageCommand,
    annotationImagePanel,
    cropImageCommand,
    cropImagePanel,
    ipCharacterDefinitionCapability,
    localAdjustCapability,
    localCropCapability,
    localResizeCapability,
    maskedEditCapability,
    outpaintCapability,
    outpaintImageCommand,
    outpaintPanel,
    reopenAnnotationOperationCommand,
    resizeImageCommand,
    resizeImagePanel,
  },
  messages: imageStudioMessages,
  settings: imageStudioSettings,
  setup: activate,
});

export function activate(context: PluginActivationContextV2): {
  dispose(): void;
} {
  context.signal.addEventListener('abort', closePanels, { once: true });
  return {
    dispose() {
      context.signal.removeEventListener('abort', closePanels);
      closePanels();
    },
  };
}

function capabilityContribution(input: {
  capabilityId: string;
  definitionHash: string;
  displayName: LocalizedText;
  outputRole: string;
  parametersSchemaRef: string;
  runtimeRequirements:
    RetakeCapabilityContributionV2['definition']['runtimeRequirements'];
  supportedAdapterClasses:
    RetakeCapabilityContributionV2['definition']['supportedAdapterClasses'];
  version: string;
}) {
  return defineCapability({
    apiVersion: 2,
    definition: {
      capabilityId: input.capabilityId,
      category: 'image_editing',
      definitionHash: input.definitionHash,
      displayName: input.displayName,
      inputSlots: [imageSourceInput()],
      outputSlots: [{
        cardinality: 'one',
        dataType: 'image',
        projectionBlockTypes: ['image'],
        semanticRole: input.outputRole,
        slotId: resultSlotId,
      }],
      parametersSchemaRef: input.parametersSchemaRef,
      runtimeRequirements: input.runtimeRequirements,
      schemaVersion: 2,
      supportedAdapterClasses: input.supportedAdapterClasses,
      version: input.version,
    },
    kind: 'capability',
  });
}

function imageSourceInput() {
  return imageInput('source_image', 'source');
}

type CapabilityInputSlot =
  RetakeCapabilityContributionV2['definition']['inputSlots'][number];

function imageInput(
  slotId: string,
  semanticRole: string,
): CapabilityInputSlot {
  return {
    artifactTypes: [],
    bindingKinds: ['asset', 'block'],
    cardinality: 'one',
    dataTypes: ['image'],
    required: true,
    semanticRole,
    slotId,
  };
}

function assetImageInput(
  slotId: string,
  semanticRole: string,
): CapabilityInputSlot {
  return {
    ...imageInput(slotId, semanticRole),
    bindingKinds: ['asset'],
  };
}

function textInput(): CapabilityInputSlot {
  return {
    artifactTypes: [],
    bindingKinds: ['inline'],
    cardinality: 'one',
    dataTypes: ['text'],
    required: true,
    semanticRole: 'prompt',
    slotId: 'prompt',
  };
}

type LocalizedText = string | {
  default: string;
  locales: Readonly<Record<string, string>>;
};

function localized(english: string, chinese: string): LocalizedText {
  return {
    default: english,
    locales: { 'zh-CN': chinese },
  };
}

function imageToolbarCommand(
  commandId: string,
  label: LocalizedText,
  panelStore: {
    open(block: ImageToolbarBlockV2): void;
  },
  icon: PluginCommandIcon,
  order: number,
  recommendedShortcuts: readonly string[] = [],
) {
  return defineCommand({
    apiVersion: 1,
    commandId,
    contextKind: 'image',
    defaultBindings: [{
      order,
      surfaceId: 'image.context-toolbar',
    }],
    icon,
    kind: 'command',
    label,
    recommendedShortcuts,
    run({ block }: { block: ImageToolbarBlockV2 }) {
      closePanels();
      panelStore.open(block);
    },
  });
}

function panelContribution(
  component: PluginComponent<PluginPanelProps>,
) {
  return definePanel({
    apiVersion: 1,
    component,
    kind: 'panel',
    placement: 'workspace.overlay',
  });
}

function closePanels(): void {
  adjustPanelStore.close();
  annotationPanelStore.close();
  cropPanelStore.close();
  outpaintPanelStore.close();
  resizePanelStore.close();
}
