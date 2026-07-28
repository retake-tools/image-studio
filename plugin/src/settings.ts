import { useSyncExternalStore } from 'react';
import {
  defineSettings,
  type PluginHostApiV2,
} from '@retake/plugin-api';
import type { ResizeOutputFormat } from './image-resize';

export const imageStudioSettings = defineSettings({
  apiVersion: 1,
  fields: {
    defaultOutputFormat: {
      default: 'png',
      description: {
        default: 'The initial file format used by Resize.',
        locales: {
          'zh-CN': '调整尺寸时默认使用的文件格式。',
        },
      },
      enum: ['png', 'jpeg', 'webp'],
      label: {
        default: 'Default resize format',
        locales: {
          'zh-CN': '默认缩放格式',
        },
      },
      scope: 'workspace',
      type: 'string',
    },
  },
  kind: 'settings',
  schemaVersion: 1,
  settingsId: 'design.retake.image-studio.settings',
});

export function useDefaultOutputFormat(
  host: PluginHostApiV2,
): ResizeOutputFormat {
  const snapshot = useSyncExternalStore(
    host.settings.subscribe,
    () => host.settings.getSnapshot(imageStudioSettings.settingsId),
    () => host.settings.getSnapshot(imageStudioSettings.settingsId),
  );
  const value = snapshot?.values.defaultOutputFormat;
  return value === 'jpeg' || value === 'webp' || value === 'png'
    ? value
    : imageStudioSettings.fields.defaultOutputFormat.default;
}
