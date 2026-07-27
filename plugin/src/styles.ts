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
  gap: 10px;
  grid-template-columns: 68px minmax(0, 1fr) 34px;
}

.retake-image-studio-range input {
  accent-color: #0f766e;
  width: 100%;
}

.retake-image-studio-range output {
  color: #64748b;
  font-variant-numeric: tabular-nums;
  text-align: right;
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
