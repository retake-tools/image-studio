import { useSyncExternalStore } from 'react';
import {
  createPluginTranslator,
  type PluginMessages,
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

export function usePluginTranslator<const Messages extends PluginMessages>(
  host: PluginHostApiV2,
  messages: Messages,
) {
  const environment = usePluginEnvironment(host);
  return createPluginTranslator(messages, environment.locale);
}
