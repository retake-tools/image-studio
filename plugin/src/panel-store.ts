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

function update(block: ImageToolbarBlockV1 | null): void {
  current = Object.freeze({
    block,
    revision: current.revision + 1,
  });
  for (const listener of listeners) listener();
}
