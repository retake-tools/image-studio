import { definePluginContribution } from '@retake/plugin-api';
import { ImageStudioAdjustPanel } from './adjust-panel';
import type {
  ImageSelectionToolbarContextV1,
  ImageToolbarBlockV1,
  PluginActivationContextV1,
} from './contracts';
import { ImageStudioCropPanel } from './crop-panel';
import { ImageStudioMaskedEditPanel } from './masked-edit-panel';
import {
  adjustPanelStore,
  cropPanelStore,
  maskedEditPanelStore,
  resizePanelStore,
  selectionMaskPanelStore,
} from './panel-store';
import { ImageStudioResizePanel } from './resize-panel';
import { ImageStudioSelectionMaskPanel } from './selection-mask-panel';

const resultSlotId = 'result_image';

export const localAdjustCapability = definePluginContribution({
  apiVersion: 1,
  definition: {
    capabilityId: 'image.local_adjust',
    category: 'image_editing',
    definitionHash: 'sha256:image-local-adjust-v1',
    displayName: 'Local image adjustment',
    inputSlots: [imageSourceInput()],
    outputSlots: [{
      cardinality: 'one',
      dataType: 'image',
      projectionBlockTypes: ['image'],
      semanticRole: 'adjusted_image',
      slotId: resultSlotId,
    }],
    parametersSchemaRef: 'definitions/image.local_adjust.parameters.json',
    runtimeRequirements: ['browser.canvas_2d'],
    schemaVersion: 1,
    supportedAdapterClasses: ['local_canvas'],
    version: '0.1.0',
  },
  kind: 'capability',
});

export const localCropCapability = definePluginContribution({
  apiVersion: 1,
  definition: {
    capabilityId: 'image.local_crop',
    category: 'image_editing',
    definitionHash: 'sha256:image-local-crop-v1',
    displayName: 'Local image crop',
    inputSlots: [imageSourceInput()],
    outputSlots: [{
      cardinality: 'one',
      dataType: 'image',
      projectionBlockTypes: ['image'],
      semanticRole: 'cropped_image',
      slotId: resultSlotId,
    }],
    parametersSchemaRef: 'definitions/image.local_crop.parameters.json',
    runtimeRequirements: ['browser.canvas_2d'],
    schemaVersion: 1,
    supportedAdapterClasses: ['local_canvas'],
    version: '0.1.0',
  },
  kind: 'capability',
});

export const localResizeCapability = definePluginContribution({
  apiVersion: 1,
  definition: {
    capabilityId: 'image.local_resize',
    category: 'image_editing',
    definitionHash: 'sha256:image-local-resize-v1',
    displayName: 'Local image resize',
    inputSlots: [imageSourceInput()],
    outputSlots: [{
      cardinality: 'one',
      dataType: 'image',
      projectionBlockTypes: ['image'],
      semanticRole: 'resized_image',
      slotId: resultSlotId,
    }],
    parametersSchemaRef: 'definitions/image.local_resize.parameters.json',
    runtimeRequirements: ['browser.canvas_2d'],
    schemaVersion: 1,
    supportedAdapterClasses: ['local_canvas'],
    version: '0.1.0',
  },
  kind: 'capability',
});

export const localSelectionMaskCapability = definePluginContribution({
  apiVersion: 1,
  definition: {
    capabilityId: 'image.local_selection_mask',
    category: 'image_editing',
    definitionHash: 'sha256:image-local-selection-mask-v1',
    displayName: 'Local selection mask authoring',
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
    schemaVersion: 1,
    supportedAdapterClasses: ['local_canvas'],
    version: '0.1.0',
  },
  kind: 'capability',
});

export const maskedEditCapability = definePluginContribution({
  apiVersion: 1,
  definition: {
    capabilityId: 'image.masked_edit',
    category: 'image_editing',
    definitionHash: 'sha256:image-masked-edit-v1',
    displayName: 'Masked AI image edit',
    inputSlots: [
      imageSourceInput(),
      {
        artifactTypes: [],
        bindingKinds: ['asset', 'block'],
        cardinality: 'one',
        dataTypes: ['image'],
        required: true,
        semanticRole: 'inpaint_mask',
        slotId: 'inpaint_mask',
      },
      {
        artifactTypes: [],
        bindingKinds: ['inline'],
        cardinality: 'one',
        dataTypes: ['text'],
        required: true,
        semanticRole: 'prompt',
        slotId: 'prompt',
      },
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
    schemaVersion: 1,
    supportedAdapterClasses: ['agent_runtime.media'],
    version: '0.1.0',
  },
  kind: 'capability',
});

export const adjustImageAction = imageToolbarAction(
  'Adjust image',
  adjustPanelStore,
);
export const cropImageAction = imageToolbarAction(
  'Crop image',
  cropPanelStore,
);
export const resizeImageAction = imageToolbarAction(
  'Resize image',
  resizePanelStore,
);
export const selectionMaskImageAction = imageToolbarAction(
  'Create selection mask',
  selectionMaskPanelStore,
);

export const maskedEditSelectionAction = definePluginContribution({
  apiVersion: 1,
  kind: 'action',
  label: 'Masked AI edit',
  placement: 'selection.toolbar',
  selectionCount: {
    max: 2,
    min: 2,
  },
  run({ blocks }: ImageSelectionToolbarContextV1) {
    closePanels();
    maskedEditPanelStore.open(blocks);
  },
});

export const adjustImagePanel = panelContribution(ImageStudioAdjustPanel);
export const cropImagePanel = panelContribution(ImageStudioCropPanel);
export const maskedEditPanel = panelContribution(ImageStudioMaskedEditPanel);
export const resizeImagePanel = panelContribution(ImageStudioResizePanel);
export const selectionMaskImagePanel = panelContribution(
  ImageStudioSelectionMaskPanel,
);

export function activate(context: PluginActivationContextV1): {
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

function imageSourceInput() {
  return {
    artifactTypes: [],
    bindingKinds: ['asset', 'block'],
    cardinality: 'one',
    dataTypes: ['image'],
    required: true,
    semanticRole: 'source',
    slotId: 'source_image',
  };
}

function imageToolbarAction(
  label: string,
  panelStore: {
    open(block: ImageToolbarBlockV1): void;
  },
) {
  return definePluginContribution({
    apiVersion: 1,
    kind: 'action',
    label,
    placement: 'image.toolbar',
    run({ block }: { block: ImageToolbarBlockV1 }) {
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
  cropPanelStore.close();
  maskedEditPanelStore.close();
  resizePanelStore.close();
  selectionMaskPanelStore.close();
}
