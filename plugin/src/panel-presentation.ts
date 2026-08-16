import type { PluginPanelProps } from '@retake/plugin-api';
import { useEffect, useRef } from 'react';

export type ImageStudioPanelPresentation = 'focus-editor' | 'overlay';

export type ImageStudioPanelProps = PluginPanelProps & {
  readonly presentation?: ImageStudioPanelPresentation;
};

export function imageStudioPanelClassName(
  baseClassName: string,
  presentation: ImageStudioPanelPresentation = 'overlay',
): string {
  return `${baseClassName}${presentation === 'focus-editor' ? ' is-focus-editor' : ''}`;
}

export function useImageStudioPanelEscape(input: {
  active: boolean;
  disabled: boolean;
  onClose: () => void;
}): void {
  const onCloseRef = useRef(input.onClose);
  onCloseRef.current = input.onClose;
  useEffect(() => {
    if (!input.active || input.disabled) return;
    function onKeyDown(event: globalThis.KeyboardEvent): void {
      if (event.isComposing || event.key !== 'Escape') return;
      event.preventDefault();
      event.stopImmediatePropagation();
      onCloseRef.current();
    }
    window.addEventListener('keydown', onKeyDown, { capture: true });
    return () => window.removeEventListener('keydown', onKeyDown, { capture: true });
  }, [input.active, input.disabled]);
}
