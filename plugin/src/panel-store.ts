import type { ImageToolbarBlockV1 } from './contracts';

export interface AdjustPanelSnapshot {
  readonly block: ImageToolbarBlockV1 | null;
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
  open(block: ImageToolbarBlockV1): void {
    update(Object.freeze({ ...block }));
  },
  subscribe(listener: Listener): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
});

export const cropPanelStore = createPanelStore();
export const resizePanelStore = createPanelStore();

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
    open(block: ImageToolbarBlockV1): void {
      set(Object.freeze({ ...block }));
    },
    subscribe(listener: Listener): () => void {
      storeListeners.add(listener);
      return () => storeListeners.delete(listener);
    },
  });

  function set(block: ImageToolbarBlockV1 | null): void {
    snapshot = Object.freeze({
      block,
      revision: snapshot.revision + 1,
    });
    for (const listener of storeListeners) listener();
  }
}

function update(block: ImageToolbarBlockV1 | null): void {
  current = Object.freeze({
    block,
    revision: current.revision + 1,
  });
  for (const listener of listeners) listener();
}
