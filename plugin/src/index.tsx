import { definePluginContribution } from '@retake/plugin-api';
import { ImageStudioAdjustPanel } from './adjust-panel';
import { ImageStudioAnnotationPanel } from './annotation-panel';
import type {
  ImageSelectionToolbarContextV2,
  ImageToolbarBlockV2,
  PluginActivationContextV2,
  PluginOperationActionContextV2,
} from './contracts';
import { ImageStudioCropPanel } from './crop-panel';
import { ImageStudioMaskedEditPanel } from './masked-edit-panel';
import {
  adjustPanelStore,
  annotationPanelStore,
  cropPanelStore,
  maskedEditPanelStore,
  resizePanelStore,
  selectionMaskPanelStore,
} from './panel-store';
import { ImageStudioResizePanel } from './resize-panel';
import { ImageStudioSelectionMaskPanel } from './selection-mask-panel';

const resultSlotId = 'result_image';

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

export const localSelectionMaskCapability = definePluginContribution({
  apiVersion: 2,
  definition: {
    capabilityId: 'image.local_selection_mask',
    category: 'image_editing',
    definitionHash: 'sha256:image-local-selection-mask-v2',
    displayName: localized(
      'Local selection mask authoring',
      '本地选区蒙版',
    ),
    inputSlots: [imageSourceInput()],
    outputSlots: [{
      cardinality: 'one',
      dataType: 'image',
      projectionBlockTypes: ['image'],
      semanticRole: 'selection_mask',
      slotId: 'selection_mask',
    }],
    parametersSchemaRef:
      'definitions/image.local_selection_mask.parameters.json',
    runtimeRequirements: ['browser.canvas_2d'],
    schemaVersion: 2,
    supportedAdapterClasses: ['local_canvas'],
    version: '0.2.0',
  },
  kind: 'capability',
});

export const maskedEditCapability = definePluginContribution({
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

export const annotationEditCapability = definePluginContribution({
  apiVersion: 2,
  definition: {
    capabilityId: 'image.annotation_edit',
    category: 'image_editing',
    definitionHash: 'sha256:image-annotation-edit-v2',
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
    version: '0.2.0',
  },
  kind: 'capability',
});

export const adjustImageAction = imageToolbarAction(
  localized('Adjust image', '调整图片'),
  adjustPanelStore,
);
export const annotationImageAction = imageToolbarAction(
  localized('Annotate image', '标注图片'),
  annotationPanelStore,
);
export const cropImageAction = imageToolbarAction(
  localized('Crop image', '裁剪图片'),
  cropPanelStore,
);
export const resizeImageAction = imageToolbarAction(
  localized('Resize image', '缩放图片'),
  resizePanelStore,
);
export const selectionMaskImageAction = imageToolbarAction(
  localized('Create selection mask', '创建选区蒙版'),
  selectionMaskPanelStore,
);

export const maskedEditSelectionAction = definePluginContribution({
  apiVersion: 2,
  kind: 'action',
  label: localized('Masked AI edit', '局部 AI 编辑'),
  placement: 'selection.toolbar',
  selectionCount: {
    max: 2,
    min: 2,
  },
  run({ blocks }: ImageSelectionToolbarContextV2) {
    closePanels();
    maskedEditPanelStore.open(blocks);
  },
});

export const reopenAnnotationOperationAction = definePluginContribution({
  apiVersion: 2,
  kind: 'action',
  label: localized('Reopen annotation edit', '重新打开标注编辑'),
  placement: 'operation.inspector',
  run({ operation }: PluginOperationActionContextV2) {
    if (!operation.source) return;
    closePanels();
    annotationPanelStore.openOperation(operation);
  },
  supportedCapabilityIds: ['image.annotation_edit'],
});

export const adjustImagePanel = panelContribution(ImageStudioAdjustPanel);
export const annotationImagePanel = panelContribution(
  ImageStudioAnnotationPanel,
);
export const cropImagePanel = panelContribution(ImageStudioCropPanel);
export const maskedEditPanel = panelContribution(ImageStudioMaskedEditPanel);
export const resizeImagePanel = panelContribution(ImageStudioResizePanel);
export const selectionMaskImagePanel = panelContribution(
  ImageStudioSelectionMaskPanel,
);

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
  runtimeRequirements: string[];
  supportedAdapterClasses: string[];
  version: string;
}) {
  return definePluginContribution({
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

function imageInput(slotId: string, semanticRole: string) {
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

function assetImageInput(slotId: string, semanticRole: string) {
  return {
    ...imageInput(slotId, semanticRole),
    bindingKinds: ['asset'],
  };
}

function textInput() {
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

function imageToolbarAction(
  label: LocalizedText,
  panelStore: {
    open(block: ImageToolbarBlockV2): void;
  },
) {
  return definePluginContribution({
    apiVersion: 2,
    kind: 'action',
    label,
    placement: 'image.toolbar',
    run({ block }: { block: ImageToolbarBlockV2 }) {
      closePanels();
      panelStore.open(block);
    },
  });
}

function panelContribution(component: unknown) {
  return definePluginContribution({
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
  maskedEditPanelStore.close();
  resizePanelStore.close();
  selectionMaskPanelStore.close();
}
