import { pluginThemeVariable } from '@retake/plugin-api';

export const imageStudioTheme = {
  accent: pluginThemeVariable('color.accent'),
  background: pluginThemeVariable('color.background'),
  border: pluginThemeVariable('color.border'),
  foreground: pluginThemeVariable('color.foreground'),
  muted: pluginThemeVariable('color.muted'),
  radiusMedium: pluginThemeVariable('radius.medium'),
  radiusSmall: pluginThemeVariable('radius.small'),
  spaceMedium: pluginThemeVariable('space.medium'),
  spaceSmall: pluginThemeVariable('space.small'),
  surface: pluginThemeVariable('color.surface'),
} as const;
