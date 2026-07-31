import { imageStudioTheme as theme } from './theme';

export const outpaintStyles = `
.retake-image-studio-panel.is-outpaint {
  width: min(420px, calc(100vw - 32px));
}

.retake-outpaint-stage-shell {
  align-items: center;
  background: ${theme.background};
  border: 1px solid ${theme.border};
  border-radius: 10px;
  display: grid;
  gap: 8px;
  justify-content: center;
  min-height: 210px;
  overflow: hidden;
  padding: 10px;
}

.retake-outpaint-source-measure {
  display: block;
  max-height: 360px;
  max-width: 100%;
  object-fit: contain;
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
  overflow: hidden;
  position: relative;
}

.retake-outpaint-expansion {
  background:
    repeating-linear-gradient(
      135deg,
      rgb(13 148 136 / 22%) 0,
      rgb(13 148 136 / 22%) 7px,
      rgb(204 251 241 / 38%) 7px,
      rgb(204 251 241 / 38%) 14px
    );
  box-shadow: inset 0 0 0 1px rgb(13 148 136 / 22%);
  pointer-events: none;
  position: absolute;
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

.retake-outpaint-source-label {
  background: rgb(15 23 42 / 76%);
  border-radius: 5px;
  color: #fff;
  font-size: 10px;
  left: 6px;
  line-height: 1;
  padding: 4px 5px;
  pointer-events: none;
  position: absolute;
  top: 6px;
  z-index: 1;
}

.retake-outpaint-source:focus-visible {
  box-shadow:
    0 0 0 3px rgb(15 118 110 / 30%),
    0 0 0 1px ${theme.accent};
}

.retake-outpaint-source img {
  display: block;
  height: 100%;
  pointer-events: none;
  user-select: none;
  width: 100%;
}

.retake-outpaint-stage-legend {
  align-items: center;
  color: ${theme.muted};
  display: flex;
  font-size: 11px;
  gap: 6px;
  justify-content: center;
  margin: 0;
}

.retake-outpaint-stage-legend > span {
  background: repeating-linear-gradient(
    135deg,
    rgb(13 148 136 / 30%) 0,
    rgb(13 148 136 / 30%) 4px,
    rgb(204 251 241 / 55%) 4px,
    rgb(204 251 241 / 55%) 8px
  );
  border: 1px solid rgb(13 148 136 / 34%);
  border-radius: 3px;
  height: 10px;
  width: 18px;
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
  background: ${theme.background};
  border: 0;
  border-radius: 4px;
  cursor: pointer;
  height: 20px;
  padding: 0;
  width: 20px;
}

.retake-outpaint-anchors button.is-active {
  background: ${theme.accent};
  box-shadow: inset 0 0 0 5px #ccfbf1;
}

.retake-outpaint-anchors button:disabled {
  cursor: default;
  opacity: 0.45;
}

.retake-outpaint-prompt {
  color: ${theme.muted};
  display: grid;
  font-size: 12px;
  gap: 6px;
}

.retake-outpaint-prompt textarea {
  background: ${theme.surface};
  border: 1px solid ${theme.border};
  border-radius: 8px;
  color: ${theme.foreground};
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
  color: ${theme.muted};
  display: grid;
  font-size: 12px;
  gap: 5px;
}

.retake-outpaint-run-options select {
  background: ${theme.surface};
  border: 1px solid ${theme.border};
  border-radius: 7px;
  color: ${theme.foreground};
  font: inherit;
  min-height: 32px;
  min-width: 0;
  padding: 0 8px;
  width: 100%;
}
`;
