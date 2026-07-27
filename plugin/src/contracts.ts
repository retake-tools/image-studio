export type PluginJsonValueV2 =
  | boolean
  | null
  | number
  | string
  | readonly PluginJsonValueV2[]
  | { readonly [key: string]: PluginJsonValueV2 };

export interface ImageToolbarBlockV2 {
  readonly assetId: string;
  readonly blockId: string;
  readonly previewUrl?: string;
  readonly title: string;
  readonly type: 'image';
}

export interface PluginAssetV2 {
  readonly assetId: string;
  readonly createdAt: string;
  readonly duration?: number;
  readonly height?: number;
  readonly kind: 'audio' | 'document' | 'image' | 'other' | 'video';
  readonly mimeType: string;
  readonly previewUrl: string;
  readonly width?: number;
}

export interface PluginHostReadSnapshotV2 {
  readonly boardId: string | null;
  readonly boundAssetIds: readonly string[];
  readonly boundBlockIds: readonly string[];
  readonly boundGroupIds: readonly string[];
  readonly projectId: string | null;
  readonly revision: string;
  readonly selectedBlockIds: readonly string[];
}

export interface PluginHostEnvironmentSnapshotV2 {
  readonly colorScheme: 'dark' | 'light';
  readonly direction: 'ltr' | 'rtl';
  readonly locale: string;
  readonly reducedMotion: boolean;
  readonly revision: string;
}

export interface PluginDraftViewV2 {
  readonly blockId: string;
  readonly capabilityId: string;
  readonly revision: string;
  readonly updatedAt: string;
  readonly value: PluginJsonValueV2;
}

export interface PluginExecutionConnectionViewV2 {
  readonly connectionId: string;
  readonly displayName: string;
  readonly modelLabel?: string;
  readonly providerLabel: string;
  readonly selectedByDefault: boolean;
}

export type PluginConnectedExecutionInputBindingV2 =
  | {
      readonly assetId: string;
      readonly blockId?: never;
      readonly slotId: string;
    }
  | {
      readonly assetId?: never;
      readonly blockId: string;
      readonly slotId: string;
    };

export interface PluginHostApiV2 {
  readonly assets: {
    getBound(assetId: string): PluginAssetV2 | null;
    importImage(input: {
      readonly dataUrl: string;
      readonly fileName?: string;
      readonly height?: number;
      readonly width?: number;
    }): Promise<PluginAssetV2>;
  };
  readonly drafts: {
    getBound(input: {
      readonly blockId: string;
      readonly capabilityId: string;
    }): PluginDraftViewV2 | null;
    saveBound(input: {
      readonly blockId: string;
      readonly capabilityId: string;
      readonly value: PluginJsonValueV2 | null;
    }): Promise<PluginDraftViewV2 | null>;
  };
  readonly environment: {
    getSnapshot(): PluginHostEnvironmentSnapshotV2;
    subscribe(listener: () => void): () => void;
  };
  readonly execution: {
    listConnections(input: {
      readonly capabilityId: string;
    }): readonly PluginExecutionConnectionViewV2[];
    run(input: {
      capabilityId: string;
      execute(context: {
        assets: readonly PluginAssetV2[];
        signal: AbortSignal;
      }): Promise<{
        images: readonly {
          dataUrl: string;
          fileName?: string;
          height?: number;
          slotId?: string;
          width?: number;
        }[];
      }>;
      inputBlockIds: readonly string[];
      parameters: Readonly<Record<string, PluginJsonValueV2>>;
    }): Promise<{
      executionId: string;
      outputAssetIds: readonly string[];
      outputBlockIds: readonly string[];
      status: 'succeeded';
    }>;
    runConnected(input: {
      capabilityId: string;
      connectionId?: string;
      inputs: readonly PluginConnectedExecutionInputBindingV2[];
      outputCount?: 1 | 2 | 3 | 4;
      parameters: Readonly<Record<string, PluginJsonValueV2>>;
      prompt: string;
    }): Promise<{
      capabilityId: string;
      connectionId: string;
      executionId: string;
      outputBlockIds: readonly string[];
      status: 'queued' | 'running';
    }>;
  };
  getReadSnapshot(): PluginHostReadSnapshotV2;
  subscribeReadSnapshot(listener: () => void): () => void;
  readonly version: 2;
}

export interface PluginPanelPropsV2 {
  host: PluginHostApiV2;
}

export interface PluginActivationContextV2 {
  readonly host: PluginHostApiV2;
  readonly packageDigest: string;
  readonly pluginModuleId: string;
  readonly signal: AbortSignal;
}

export interface ImageToolbarContextV2 {
  readonly block: ImageToolbarBlockV2;
  readonly host: PluginHostApiV2;
}

export interface ImageSelectionToolbarContextV2 {
  readonly blocks: readonly ImageToolbarBlockV2[];
  readonly host: PluginHostApiV2;
}

export interface PluginOperationInspectorViewV2 {
  readonly capabilityId: string;
  readonly executionId: string;
  readonly inputAssets: readonly PluginAssetV2[];
  readonly operationBlockId: string;
  readonly parameters: Readonly<Record<string, PluginJsonValueV2>>;
  readonly source: {
    readonly assetId: string;
    readonly blockId: string;
    readonly title: string;
    readonly type: 'image';
  } | null;
  readonly status:
    | 'canceled'
    | 'failed'
    | 'queued'
    | 'running'
    | 'succeeded';
}

export interface PluginOperationActionContextV2 {
  readonly host: PluginHostApiV2;
  readonly operation: PluginOperationInspectorViewV2;
}
