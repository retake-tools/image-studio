import { useSyncExternalStore } from 'react';
import type {
  PluginHostApiV2,
  PluginHostEnvironmentSnapshotV2,
} from '@retake/plugin-api';

export function usePluginEnvironment(
  host: PluginHostApiV2,
): PluginHostEnvironmentSnapshotV2 {
  return useSyncExternalStore(
    host.environment.subscribe,
    host.environment.getSnapshot,
    host.environment.getSnapshot,
  );
}

export function isChineseLocale(locale: string): boolean {
  return locale.toLowerCase().startsWith('zh');
}
