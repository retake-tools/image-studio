export const imageStudioStyles = `
.retake-image-studio-panel {
  background: color-mix(in srgb, var(--retake-surface, #fff) 96%, transparent);
  border: 1px solid color-mix(in srgb, var(--retake-border, #d8dee8) 88%, transparent);
  border-radius: 14px;
  box-shadow: 0 20px 44px rgb(15 23 42 / 18%);
  color: var(--retake-text, #172033);
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 14px;
  width: min(340px, calc(100vw - 32px));
}

.retake-image-studio-panel__header {
  align-items: flex-start;
  display: flex;
  justify-content: space-between;
}

.retake-image-studio-panel__header span {
  color: #0f766e;
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
  color: #64748b;
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
  background: #f1f5f9;
  color: #0f172a;
}

.retake-image-studio-preview {
  background:
    linear-gradient(45deg, #eef2f7 25%, transparent 25%),
    linear-gradient(-45deg, #eef2f7 25%, transparent 25%),
    linear-gradient(45deg, transparent 75%, #eef2f7 75%),
    linear-gradient(-45deg, transparent 75%, #eef2f7 75%);
  background-position: 0 0, 0 8px, 8px -8px, -8px 0;
  background-size: 16px 16px;
  border: 1px solid #d8dee8;
  border-radius: 9px;
  display: grid;
  height: 176px;
  overflow: hidden;
  place-items: center;
}

.retake-image-studio-preview img {
  display: block;
  height: 100%;
  object-fit: contain;
  width: 100%;
}

.retake-image-studio-range {
  align-items: center;
  color: #475569;
  display: grid;
  font-size: 12px;
  gap: 6px;
  grid-template-columns: 68px 24px minmax(0, 1fr) 24px 34px;
}

.retake-image-studio-range input {
  accent-color: #0f766e;
  width: 100%;
}

.retake-image-studio-range button {
  align-items: center;
  background: #f1f5f9;
  border: 0;
  border-radius: 6px;
  color: #334155;
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
  color: #64748b;
  font-variant-numeric: tabular-nums;
  text-align: right;
}

.retake-image-studio-field {
  align-items: center;
  color: #475569;
  display: grid;
  font-size: 12px;
  gap: 10px;
  grid-template-columns: 82px minmax(0, 1fr);
}

.retake-image-studio-field select,
.retake-image-studio-field input {
  background: #fff;
  border: 1px solid #cbd5e1;
  border-radius: 7px;
  color: #172033;
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
  color: #475569;
  display: flex;
  font-size: 12px;
  gap: 8px;
}

.retake-image-studio-check input {
  accent-color: #0f766e;
}

.retake-image-studio-resize-source {
  align-items: center;
  color: #64748b;
  display: flex;
  font-size: 12px;
  justify-content: space-between;
}

.retake-image-studio-resize-source strong {
  color: #334155;
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
  border: 1px solid #d8dee8;
  border-radius: 9px;
  display: flex;
  justify-content: center;
  min-height: 176px;
  overflow: hidden;
  padding: 8px;
}

.retake-image-studio-crop-media {
  display: inline-block;
  line-height: 0;
  max-height: 240px;
  max-width: 100%;
  overflow: hidden;
  position: relative;
}

.retake-image-studio-crop-media img {
  display: block;
  height: auto;
  max-height: 240px;
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
  height: 8px;
  pointer-events: none;
  position: absolute;
  width: 8px;
}

.retake-image-studio-crop-frame i:nth-child(1) {
  left: -5px;
  top: -5px;
}

.retake-image-studio-crop-frame i:nth-child(2) {
  right: -5px;
  top: -5px;
}

.retake-image-studio-crop-frame i:nth-child(3) {
  bottom: -5px;
  left: -5px;
}

.retake-image-studio-crop-frame i:nth-child(4) {
  bottom: -5px;
  right: -5px;
}

.retake-image-studio-range.is-crop {
  grid-template-columns: 82px 24px minmax(0, 1fr) 24px 40px;
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
  background: #0f766e;
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
