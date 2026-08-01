import { imageStudioTheme as theme } from './theme';

export const imageStudioStyles = `
.retake-image-studio-panel {
  --retake-accent: ${theme.accent};
  --retake-border: ${theme.border};
  --retake-surface: ${theme.surface};
  --retake-surface-muted: ${theme.background};
  --retake-text: ${theme.foreground};
  --retake-text-muted: ${theme.muted};
  background: color-mix(in srgb, ${theme.surface} 96%, transparent);
  border: 1px solid color-mix(in srgb, ${theme.border} 88%, transparent);
  border-radius: ${theme.radiusMedium};
  box-shadow: 0 20px 44px rgb(15 23 42 / 18%);
  color: ${theme.foreground};
  display: flex;
  flex-direction: column;
  gap: ${theme.spaceMedium};
  padding: ${theme.spaceMedium};
  width: min(340px, calc(100vw - 32px));
}

.retake-image-studio-panel.is-editor {
  max-height: min(720px, calc(100vh - 32px));
  width: min(880px, calc(100vw - 32px));
}

.retake-image-studio-editor-body {
  display: grid;
  gap: ${theme.spaceMedium};
  grid-template-columns: minmax(0, 1fr) 260px;
  min-height: 0;
}

.retake-image-studio-editor-preview {
  min-height: 0;
  min-width: 0;
}

.retake-image-studio-editor-controls {
  display: flex;
  flex-direction: column;
  gap: ${theme.spaceMedium};
  min-width: 0;
  overflow: auto;
}

.retake-image-studio-editor-controls .retake-image-studio-panel__run {
  margin-top: auto;
}

@media (max-width: 720px) {
  .retake-image-studio-panel.is-editor {
    overflow: auto;
  }

  .retake-image-studio-editor-body {
    grid-template-columns: minmax(0, 1fr);
  }
}

.retake-image-studio-panel__header {
  align-items: flex-start;
  display: flex;
  justify-content: space-between;
}

.retake-image-studio-panel__header span {
  color: ${theme.accent};
  display: block;
  font-size: 11px;
  font-weight: 750;
  letter-spacing: 0.08em;
  margin-bottom: 3px;
  text-transform: uppercase;
}

.retake-image-studio-panel__header h2 {
  font-size: 15px;
  line-height: 1.2;
  margin: 0;
}

.retake-image-studio-panel__close {
  align-items: center;
  background: transparent;
  border: 0;
  border-radius: 7px;
  color: ${theme.muted};
  cursor: pointer;
  display: inline-flex;
  font-size: 22px;
  height: 28px;
  justify-content: center;
  line-height: 1;
  padding: 0;
  width: 28px;
}

.retake-image-studio-panel__close:hover {
  background: ${theme.background};
  color: ${theme.foreground};
}

.retake-image-studio-preview {
  background:
    linear-gradient(45deg, #eef2f7 25%, transparent 25%),
    linear-gradient(-45deg, #eef2f7 25%, transparent 25%),
    linear-gradient(45deg, transparent 75%, #eef2f7 75%),
    linear-gradient(-45deg, transparent 75%, #eef2f7 75%);
  background-position: 0 0, 0 8px, 8px -8px, -8px 0;
  background-size: 16px 16px;
  border: 1px solid ${theme.border};
  border-radius: ${theme.radiusMedium};
  display: grid;
  height: 176px;
  overflow: hidden;
  place-items: center;
}

.retake-image-studio-panel.is-adjust .retake-image-studio-preview {
  height: min(540px, calc(100vh - 132px));
  min-height: 360px;
}

.retake-image-studio-preview img {
  display: block;
  height: 100%;
  object-fit: contain;
  width: 100%;
}

.retake-image-studio-range {
  align-items: center;
  color: ${theme.muted};
  display: grid;
  font-size: 12px;
  gap: 6px;
  grid-template-columns: 68px 24px minmax(0, 1fr) 24px 34px;
}

.retake-image-studio-range input {
  accent-color: ${theme.accent};
  width: 100%;
}

.retake-image-studio-range button {
  align-items: center;
  background: ${theme.background};
  border: 0;
  border-radius: 6px;
  color: ${theme.foreground};
  cursor: pointer;
  display: inline-flex;
  font: inherit;
  font-size: 15px;
  height: 24px;
  justify-content: center;
  line-height: 1;
  padding: 0;
  width: 24px;
}

.retake-image-studio-range button:hover {
  background: #e2e8f0;
}

.retake-image-studio-range button:disabled {
  cursor: default;
  opacity: 0.45;
}

.retake-image-studio-range output {
  color: ${theme.muted};
  font-variant-numeric: tabular-nums;
  text-align: right;
}

.retake-image-studio-range.is-resize-scale {
  grid-template-columns: 82px 24px minmax(0, 1fr) 24px 42px;
}

.retake-image-studio-field {
  align-items: center;
  color: ${theme.muted};
  display: grid;
  font-size: 12px;
  gap: 10px;
  grid-template-columns: 82px minmax(0, 1fr);
}

.retake-image-studio-field select,
.retake-image-studio-field input {
  background: ${theme.surface};
  border: 1px solid ${theme.border};
  border-radius: 7px;
  color: ${theme.foreground};
  font: inherit;
  min-height: 32px;
  padding: 0 9px;
}

.retake-image-studio-field input[type="color"] {
  cursor: pointer;
  padding: 3px;
  width: 100%;
}

.retake-image-studio-check {
  align-items: center;
  color: ${theme.muted};
  display: flex;
  font-size: 12px;
  gap: 8px;
}

.retake-image-studio-check input {
  accent-color: ${theme.accent};
}

.retake-image-studio-resize-source {
  align-items: center;
  color: ${theme.muted};
  display: flex;
  font-size: 12px;
  justify-content: space-between;
}

.retake-image-studio-resize-source strong {
  color: ${theme.foreground};
  font-variant-numeric: tabular-nums;
}

.retake-image-studio-crop-stage {
  align-items: center;
  background:
    linear-gradient(45deg, #eef2f7 25%, transparent 25%),
    linear-gradient(-45deg, #eef2f7 25%, transparent 25%),
    linear-gradient(45deg, transparent 75%, #eef2f7 75%),
    linear-gradient(-45deg, transparent 75%, #eef2f7 75%);
  background-position: 0 0, 0 8px, 8px -8px, -8px 0;
  background-size: 16px 16px;
  border: 1px solid ${theme.border};
  border-radius: 9px;
  display: flex;
  justify-content: center;
  height: min(540px, calc(100vh - 132px));
  min-height: 360px;
  overflow: hidden;
  padding: 8px;
}

.retake-image-studio-crop-media {
  display: inline-block;
  line-height: 0;
  max-height: 100%;
  max-width: 100%;
  overflow: hidden;
  position: relative;
}

.retake-image-studio-crop-media img {
  display: block;
  height: auto;
  max-height: min(520px, calc(100vh - 152px));
  max-width: 100%;
  user-select: none;
  width: auto;
}

.retake-image-studio-crop-frame {
  border: 2px solid #fff;
  box-shadow:
    0 0 0 1px rgb(15 118 110 / 90%),
    0 0 0 9999px rgb(15 23 42 / 55%),
    0 8px 20px rgb(15 23 42 / 22%);
  cursor: move;
  outline: 0;
  position: absolute;
  touch-action: none;
}

.retake-image-studio-crop-frame::before,
.retake-image-studio-crop-frame::after {
  content: "";
  pointer-events: none;
  position: absolute;
}

.retake-image-studio-crop-frame::before {
  border-left: 1px solid rgb(255 255 255 / 55%);
  border-right: 1px solid rgb(255 255 255 / 55%);
  inset: 0 33.333%;
}

.retake-image-studio-crop-frame::after {
  border-bottom: 1px solid rgb(255 255 255 / 55%);
  border-top: 1px solid rgb(255 255 255 / 55%);
  inset: 33.333% 0;
}

.retake-image-studio-crop-frame:focus-visible {
  box-shadow:
    0 0 0 3px rgb(15 118 110 / 35%),
    0 0 0 9999px rgb(15 23 42 / 55%),
    0 0 0 1px #0f766e;
}

.retake-image-studio-crop-frame i {
  background: #fff;
  border: 1px solid #0f766e;
  border-radius: 2px;
  height: 12px;
  pointer-events: auto;
  position: absolute;
  width: 12px;
}

.retake-image-studio-crop-frame i.is-nw {
  cursor: nwse-resize;
  left: -7px;
  top: -7px;
}

.retake-image-studio-crop-frame i.is-ne {
  cursor: nesw-resize;
  right: -7px;
  top: -7px;
}

.retake-image-studio-crop-frame i.is-sw {
  bottom: -7px;
  cursor: nesw-resize;
  left: -7px;
}

.retake-image-studio-crop-frame i.is-se {
  bottom: -7px;
  cursor: nwse-resize;
  right: -7px;
}

.retake-image-studio-crop-hint {
  color: #64748b;
  font-size: 11px;
  line-height: 1.45;
  margin: -4px 0 0;
}

.retake-image-studio-crop-output {
  align-items: center;
  background: #f0fdfa;
  border: 1px solid #99f6e4;
  border-radius: 8px;
  color: #115e59;
  display: flex;
  font-size: 12px;
  justify-content: space-between;
  padding: 8px 10px;
}

.retake-image-studio-crop-output strong {
  font-variant-numeric: tabular-nums;
}

.retake-image-studio-panel__error {
  background: #fff1f2;
  border: 1px solid #fecdd3;
  border-radius: 8px;
  color: #9f1239;
  font-size: 12px;
  margin: 0;
  padding: 8px 10px;
}

.retake-image-studio-panel__run {
  background: ${theme.accent};
  border: 0;
  border-radius: 8px;
  color: #fff;
  cursor: pointer;
  font: inherit;
  font-size: 13px;
  font-weight: 700;
  min-height: 36px;
  padding: 0 14px;
}

.retake-image-studio-panel__run:disabled,
.retake-image-studio-panel__close:disabled {
  cursor: default;
  opacity: 0.45;
}

`;
