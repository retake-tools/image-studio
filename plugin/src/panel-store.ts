import type {
  PluginImageBlock as ImageToolbarBlockV2,
  PluginOperationInspectorViewV2,
} from '@retake/plugin-api';

export interface AdjustPanelSnapshot {
  readonly block: ImageToolbarBlockV2 | null;
  readonly revision: number;
}

export interface SelectionPanelSnapshot {
  readonly blocks: readonly ImageToolbarBlockV2[];
  readonly revision: number;
}

export interface AnnotationPanelSnapshot {
  readonly block: ImageToolbarBlockV2 | null;
  readonly operation: PluginOperationInspectorViewV2 | null;
  readonly revision: number;
}

type Listener = () => void;

let current: AdjustPanelSnapshot = Object.freeze({
  block: null,
  revision: 0,
});
const listeners = new Set<Listener>();

export const adjustPanelStore = Object.freeze({
  close(): void {
    if (!current.block) return;
    update(null);
  },
  getSnapshot(): AdjustPanelSnapshot {
    return current;
  },
  open(block: ImageToolbarBlockV2): void {
    update(Object.freeze({ ...block }));
  },
  subscribe(listener: Listener): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
});

export const cropPanelStore = createPanelStore();
export const guidedEditPanelStore = createPanelStore();
export const resizePanelStore = createPanelStore();
export const selectionMaskPanelStore = createPanelStore();
export const maskedEditPanelStore = createSelectionPanelStore();
export const annotationPanelStore = createAnnotationPanelStore();
export const outpaintPanelStore = createPanelStore();

function createPanelStore(): typeof adjustPanelStore {
  let snapshot: AdjustPanelSnapshot = Object.freeze({
    block: null,
    revision: 0,
  });
  const storeListeners = new Set<Listener>();
  return Object.freeze({
    close(): void {
      if (!snapshot.block) return;
      set(null);
    },
    getSnapshot(): AdjustPanelSnapshot {
      return snapshot;
    },
    open(block: ImageToolbarBlockV2): void {
      set(Object.freeze({ ...block }));
    },
    subscribe(listener: Listener): () => void {
      storeListeners.add(listener);
      return () => storeListeners.delete(listener);
    },
  });

  function set(block: ImageToolbarBlockV2 | null): void {
    snapshot = Object.freeze({
      block,
      revision: snapshot.revision + 1,
    });
    for (const listener of storeListeners) listener();
  }
}

function update(block: ImageToolbarBlockV2 | null): void {
  current = Object.freeze({
    block,
    revision: current.revision + 1,
  });
  for (const listener of listeners) listener();
}

function createSelectionPanelStore() {
  let snapshot: SelectionPanelSnapshot = Object.freeze({
    blocks: Object.freeze([]) as readonly ImageToolbarBlockV2[],
    revision: 0,
  });
  const storeListeners = new Set<Listener>();
  return Object.freeze({
    close(): void {
      if (snapshot.blocks.length === 0) return;
      set([]);
    },
    getSnapshot() {
      return snapshot;
    },
    open(blocks: readonly ImageToolbarBlockV2[]): void {
      set(blocks.map((block) => Object.freeze({ ...block })));
    },
    subscribe(listener: Listener): () => void {
      storeListeners.add(listener);
      return () => storeListeners.delete(listener);
    },
  });

  function set(blocks: readonly ImageToolbarBlockV2[]): void {
    snapshot = Object.freeze({
      blocks: Object.freeze([...blocks]),
      revision: snapshot.revision + 1,
    });
    for (const listener of storeListeners) listener();
  }
}

function createAnnotationPanelStore() {
  let snapshot: AnnotationPanelSnapshot = Object.freeze({
    block: null,
    operation: null,
    revision: 0,
  });
  const storeListeners = new Set<Listener>();
  return Object.freeze({
    close(): void {
      if (!snapshot.block && !snapshot.operation) return;
      set(null, null);
    },
    getSnapshot(): AnnotationPanelSnapshot {
      return snapshot;
    },
    open(block: ImageToolbarBlockV2): void {
      set(Object.freeze({ ...block }), null);
    },
    openOperation(operation: PluginOperationInspectorViewV2): void {
      set(null, structuredClone(operation));
    },
    subscribe(listener: Listener): () => void {
      storeListeners.add(listener);
      return () => storeListeners.delete(listener);
    },
  });

  function set(
    block: ImageToolbarBlockV2 | null,
    operation: PluginOperationInspectorViewV2 | null,
  ): void {
    snapshot = Object.freeze({
      block,
      operation,
      revision: snapshot.revision + 1,
    });
    for (const listener of storeListeners) listener();
  }
}
