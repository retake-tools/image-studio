export interface ImageToolbarBlockV1 {
  readonly assetId: string;
  readonly blockId: string;
  readonly previewUrl?: string;
  readonly title: string;
  readonly type: 'image';
}

export interface PluginAssetV1 {
  readonly assetId: string;
  readonly createdAt: string;
  readonly height?: number;
  readonly kind: 'image' | string;
  readonly mimeType: string;
  readonly previewUrl: string;
  readonly width?: number;
}

export interface PluginHostReadSnapshotV1 {
  readonly boardId: string | null;
  readonly boundAssetIds: readonly string[];
  readonly boundBlockIds: readonly string[];
  readonly projectId: string | null;
  readonly revision: string;
  readonly selectedBlockIds: readonly string[];
}

export interface PluginHostApiV1 {
  readonly assets: {
    getBound(assetId: string): PluginAssetV1 | null;
  };
  readonly execution: {
    run(input: {
      capabilityId: string;
      execute(context: {
        assets: readonly PluginAssetV1[];
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
      parameters: Readonly<Record<string, boolean | null | number | string>>;
    }): Promise<{
      executionId: string;
      outputAssetIds: readonly string[];
      outputBlockIds: readonly string[];
      status: 'succeeded';
    }>;
  };
  getReadSnapshot(): PluginHostReadSnapshotV1;
  subscribeReadSnapshot(
    listener: () => void,
  ): () => void;
  readonly version: 1;
}

export interface PluginPanelPropsV1 {
  host: PluginHostApiV1;
}

export interface PluginActivationContextV1 {
  readonly host: PluginHostApiV1;
  readonly packageDigest: string;
  readonly pluginModuleId: string;
  readonly signal: AbortSignal;
}
