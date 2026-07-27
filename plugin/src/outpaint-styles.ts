export const outpaintStyles = `
.retake-image-studio-panel.is-outpaint {
  width: min(420px, calc(100vw - 32px));
}

.retake-outpaint-stage-shell {
  align-items: center;
  background: #e2e8f0;
  border: 1px solid #cbd5e1;
  border-radius: 10px;
  display: flex;
  justify-content: center;
  min-height: 210px;
  overflow: hidden;
  padding: 10px;
}

.retake-outpaint-stage {
  background:
    linear-gradient(45deg, #f8fafc 25%, transparent 25%),
    linear-gradient(-45deg, #f8fafc 25%, transparent 25%),
    linear-gradient(45deg, transparent 75%, #f8fafc 75%),
    linear-gradient(-45deg, transparent 75%, #f8fafc 75%);
  background-color: #dbe3ec;
  background-position: 0 0, 0 8px, 8px -8px, -8px 0;
  background-size: 16px 16px;
  box-shadow: 0 8px 24px rgb(15 23 42 / 16%);
  max-height: 300px;
  max-width: 100%;
  overflow: hidden;
  position: relative;
  width: 100%;
}

.retake-outpaint-source {
  border: 1px solid rgb(15 118 110 / 90%);
  box-shadow: 0 0 0 1px rgb(255 255 255 / 85%);
  cursor: move;
  line-height: 0;
  outline: 0;
  overflow: hidden;
  position: absolute;
  touch-action: none;
}

.retake-outpaint-source:focus-visible {
  box-shadow:
    0 0 0 3px rgb(15 118 110 / 30%),
    0 0 0 1px #0f766e;
}

.retake-outpaint-source img {
  display: block;
  height: 100%;
  pointer-events: none;
  user-select: none;
  width: 100%;
}

.retake-image-studio-range.is-outpaint {
  grid-template-columns: 82px 24px minmax(0, 1fr) 24px 42px;
}

.retake-outpaint-anchors {
  display: grid;
  gap: 4px;
  grid-template-columns: repeat(3, 20px);
  justify-content: center;
}

.retake-outpaint-anchors button {
  background: #e2e8f0;
  border: 0;
  border-radius: 4px;
  cursor: pointer;
  height: 20px;
  padding: 0;
  width: 20px;
}

.retake-outpaint-anchors button.is-active {
  background: #0f766e;
  box-shadow: inset 0 0 0 5px #ccfbf1;
}

.retake-outpaint-anchors button:disabled {
  cursor: default;
  opacity: 0.45;
}

.retake-outpaint-prompt {
  color: #475569;
  display: grid;
  font-size: 12px;
  gap: 6px;
}

.retake-outpaint-prompt textarea {
  background: #fff;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  color: #172033;
  font: inherit;
  line-height: 1.45;
  min-height: 76px;
  padding: 8px 9px;
  resize: vertical;
}

.retake-outpaint-run-options {
  display: grid;
  gap: 8px;
  grid-template-columns: minmax(0, 1fr) 92px;
}

.retake-outpaint-run-options label {
  color: #475569;
  display: grid;
  font-size: 12px;
  gap: 5px;
}

.retake-outpaint-run-options select {
  background: #fff;
  border: 1px solid #cbd5e1;
  border-radius: 7px;
  color: #172033;
  font: inherit;
  min-height: 32px;
  min-width: 0;
  padding: 0 8px;
  width: 100%;
}
`;
