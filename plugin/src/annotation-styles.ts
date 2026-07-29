export const annotationStyles = `
  .retake-annotation-modal-layer {
    position: fixed;
    inset: 0;
    z-index: 44;
    background: rgb(15 23 42 / 7%);
    backdrop-filter: blur(1px);
  }

  .retake-image-studio-panel.is-annotation {
    position: fixed;
    top: 50%;
    left: 50%;
    z-index: 45;
    display: flex;
    width: min(1220px, calc(100vw - 36px));
    height: min(760px, calc(100vh - 96px));
    max-height: calc(100vh - 96px);
    box-sizing: border-box;
    overflow: hidden;
    transform: translate(-50%, -50%);
  }

  .retake-image-studio-panel.is-annotation > .retake-image-studio-panel__header,
  .retake-image-studio-panel.is-annotation > .retake-annotation-notice {
    flex: none;
  }

  .retake-annotation-notice {
    margin: 0;
    border: 1px solid #f2c66d;
    border-radius: 8px;
    background: #fff8e6;
    padding: 8px 10px;
    color: #6b4708;
    font-size: 12px;
  }

  .retake-annotation-editor {
    display: flex;
    flex: 1;
    min-width: 0;
    min-height: 0;
    flex-direction: column;
    gap: 10px;
  }

  .retake-annotation-editor-shell {
    display: grid;
    flex: 1;
    grid-template-columns: auto minmax(0, 1fr) minmax(260px, 310px);
    gap: 8px;
    min-width: 0;
    min-height: 0;
  }

  .retake-annotation-tools {
    display: flex;
    min-width: 34px;
    flex-direction: column;
    gap: 6px;
    padding: 6px;
    border: 1px solid var(--retake-border, #d8dee8);
    border-radius: 8px;
    background: var(--retake-surface-muted, #f8fafc);
  }

  .retake-annotation-tools button,
  .retake-annotation-zoom button,
  .retake-annotation-strokes button {
    display: inline-grid;
    width: 30px;
    height: 30px;
    place-items: center;
    border: 1px solid var(--retake-border, #d8dee8);
    border-radius: 7px;
    background: var(--retake-surface, #fff);
    padding: 0;
    color: var(--retake-text, #282832);
    cursor: pointer;
    font: inherit;
    font-size: 11px;
  }

  .retake-annotation-tools button.is-active,
  .retake-annotation-strokes button.is-active {
    border-color: var(--retake-accent, #7068b1);
    background: color-mix(in srgb, var(--retake-accent, #7068b1) 12%, white);
    color: var(--retake-accent, #625aa8);
  }

  .retake-annotation-tools button:disabled,
  .retake-annotation-zoom button:disabled {
    cursor: default;
    opacity: 0.42;
  }

  .retake-annotation-tool-separator {
    height: 1px;
    margin: 1px 2px;
    background: var(--retake-border, #d8dee8);
  }

  .retake-annotation-workspace {
    display: flex;
    min-width: 0;
    min-height: 0;
    flex-direction: column;
    gap: 6px;
  }

  .retake-annotation-stage-shell {
    position: relative;
    display: grid;
    flex: 1;
    min-width: 0;
    min-height: 0;
    place-items: center;
    overflow: hidden;
    border: 1px solid var(--retake-border, #d8dee8);
    border-radius: 8px;
    background:
      linear-gradient(45deg, rgba(40, 40, 48, 0.035) 25%, transparent 25%),
      linear-gradient(-45deg, rgba(40, 40, 48, 0.035) 25%, transparent 25%),
      linear-gradient(45deg, transparent 75%, rgba(40, 40, 48, 0.035) 75%),
      linear-gradient(-45deg, transparent 75%, rgba(40, 40, 48, 0.035) 75%);
    background-position: 0 0, 0 8px, 8px -8px, -8px 0;
    background-size: 16px 16px;
    overscroll-behavior: contain;
  }

  .retake-annotation-stage {
    position: relative;
    flex: none;
    max-width: 100%;
    max-height: 100%;
    transform-origin: center;
    touch-action: none;
    user-select: none;
  }

  .retake-annotation-stage.is-select-tool {
    cursor: default;
  }

  .retake-annotation-stage.is-marker-tool,
  .retake-annotation-stage.is-arrow-tool,
  .retake-annotation-stage.is-pen-tool,
  .retake-annotation-stage.is-brush-tool,
  .retake-annotation-stage.is-rect-tool,
  .retake-annotation-stage.is-ellipse-tool {
    cursor: crosshair;
  }

  .retake-annotation-stage.is-eraser-tool {
    cursor: not-allowed;
  }

  .retake-annotation-stage img {
    display: block;
    width: 100%;
    height: 100%;
    border-radius: 4px;
    object-fit: fill;
    user-select: none;
    -webkit-user-drag: none;
  }

  .retake-annotation-pointer-layer {
    position: absolute;
    inset: 0;
    outline: none;
    touch-action: none;
  }

  .retake-annotation-pointer-layer:focus-visible {
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--retake-accent, #7068b1) 35%, transparent);
  }

  .retake-annotation-pointer-layer svg {
    display: block;
    width: 100%;
    height: 100%;
    overflow: visible;
    pointer-events: none;
  }

  .retake-annotation-selection {
    fill: none;
    opacity: 0.72;
    stroke: #2563eb;
    stroke-linecap: round;
    stroke-linejoin: round;
    pointer-events: none;
  }

  .retake-annotation-marker-selection {
    fill: none;
    stroke: #2563eb;
    stroke-linejoin: round;
    stroke-width: 0.01;
  }

  .retake-annotation-endpoint {
    fill: #fff;
    stroke: var(--retake-accent, #7068b1);
    stroke-width: 0.004;
  }

  .retake-annotation-hover-prompt {
    position: absolute;
    z-index: 4;
    display: flex;
    gap: 6px;
    align-items: flex-start;
    width: max-content;
    max-width: min(280px, calc(100% - 24px));
    max-height: 120px;
    padding: 7px 9px;
    overflow: hidden;
    border: 1px solid rgb(255 255 255 / 72%);
    border-radius: 8px;
    background: rgb(15 23 42 / 76%);
    box-shadow: 0 8px 22px rgb(15 23 42 / 20%);
    color: #fff;
    font-size: 11px;
    line-height: 1.42;
    pointer-events: none;
    transform: translate(12px, -50%);
    backdrop-filter: blur(6px);
  }

  .retake-annotation-hover-prompt strong {
    color: #bfdbfe;
  }

  .retake-annotation-quick-delete {
    position: absolute;
    z-index: 5;
    display: inline-grid;
    width: 26px;
    height: 26px;
    place-items: center;
    border: 1px solid #cbd5e1;
    border-radius: 999px;
    background: #fff;
    box-shadow: 0 5px 14px rgb(15 23 42 / 18%);
    color: #475569;
    cursor: pointer;
    transform: translate(-50%, -50%);
  }

  .retake-annotation-zoom {
    position: absolute;
    right: 8px;
    bottom: 8px;
    z-index: 6;
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 4px;
    border: 1px solid var(--retake-border, #d8dee8);
    border-radius: 8px;
    background: rgb(255 255 255 / 92%);
    box-shadow: 0 8px 22px rgb(16 24 40 / 14%);
    backdrop-filter: blur(10px);
  }

  .retake-annotation-zoom span {
    min-width: 42px;
    color: var(--retake-text-muted, #626270);
    font-size: 11px;
    font-variant-numeric: tabular-nums;
    font-weight: 700;
    text-align: center;
  }

  .retake-annotation-pan-hint {
    flex: none;
    color: var(--retake-text-muted, #777782);
    font-size: 11px;
    text-align: center;
  }

  .retake-annotation-side-panel {
    display: flex;
    min-width: 0;
    min-height: 0;
    flex-direction: column;
    gap: 8px;
    padding: 8px;
    overflow-x: hidden;
    overflow-y: auto;
    border: 1px solid var(--retake-border, #d8dee8);
    border-radius: 8px;
    background: var(--retake-surface-muted, #f8fafc);
    overscroll-behavior: contain;
  }

  .retake-annotation-settings,
  .retake-annotation-intents,
  .retake-annotation-global {
    display: grid;
    align-content: start;
    gap: 8px;
    min-width: 0;
  }

  .retake-annotation-settings {
    grid-template-columns: 1fr 1fr;
  }

  .retake-annotation-settings fieldset {
    min-width: 0;
    margin: 0;
    border: 1px solid var(--retake-border, #d8dee8);
    border-radius: 8px;
    background: var(--retake-surface, #fff);
    padding: 7px;
  }

  .retake-annotation-settings legend,
  .retake-annotation-global > span,
  .retake-annotation-run-controls span {
    color: var(--retake-text, #30303d);
    font-size: 11px;
    font-weight: 700;
  }

  .retake-annotation-swatches,
  .retake-annotation-strokes {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  .retake-annotation-swatches button {
    width: 18px;
    height: 18px;
    border: 2px solid #fff;
    border-radius: 999px;
    box-shadow: 0 0 0 1px #cbd5e1;
    cursor: pointer;
  }

  .retake-annotation-swatches button.is-active {
    box-shadow:
      0 0 0 2px var(--retake-accent, #7068b1),
      0 0 0 4px color-mix(in srgb, var(--retake-accent, #7068b1) 18%, transparent);
  }

  .retake-annotation-strokes button {
    width: auto;
    min-width: 30px;
    height: 27px;
    padding: 0 6px;
  }

  .retake-annotation-intents {
    flex: 1;
    min-height: 92px;
    overflow: auto;
    border: 1px solid var(--retake-border, #d8dee8);
    border-radius: 8px;
    background: var(--retake-surface, #fff);
    padding: 8px;
  }

  .retake-annotation-intents > strong {
    font-size: 11px;
  }

  .retake-annotation-intents > p {
    margin: 0;
    color: var(--retake-text-muted, #777782);
    font-size: 11px;
  }

  .retake-annotation-intents label {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 6px;
    border: 1px solid transparent;
    border-radius: 8px;
    padding: 6px;
  }

  .retake-annotation-intents label.is-selected {
    border-color: #60a5fa;
    border-left-width: 3px;
    background: #eff6ff;
    box-shadow: 0 0 0 2px rgb(37 99 235 / 12%);
  }

  .retake-annotation-intents label > button {
    display: flex;
    align-items: center;
    gap: 6px;
    border: 0;
    padding: 0;
    background: transparent;
    color: var(--retake-text, #30303d);
    cursor: pointer;
    font: inherit;
    font-size: 11px;
    font-weight: 700;
  }

  .retake-annotation-intents label > .retake-annotation-delete {
    display: inline-grid;
    width: 23px;
    height: 23px;
    place-items: center;
    border: 1px solid var(--retake-border, #d8dee8);
    border-radius: 7px;
    color: var(--retake-text-muted, #626270);
  }

  .retake-annotation-intents label > textarea {
    grid-column: 1 / -1;
  }

  .retake-annotation-intents label i {
    width: 9px;
    height: 9px;
    border-radius: 999px;
  }

  .retake-annotation-intents textarea,
  .retake-annotation-global textarea,
  .retake-annotation-run-controls select {
    width: 100%;
    box-sizing: border-box;
    border: 1px solid var(--retake-border, #d8dee8);
    border-radius: 7px;
    background: var(--retake-surface, #fff);
    padding: 7px 8px;
    color: var(--retake-text, #20202a);
    font: inherit;
    font-size: 11px;
  }

  .retake-annotation-intents textarea {
    min-height: 48px;
    resize: vertical;
  }

  .retake-annotation-global textarea {
    min-height: 64px;
    resize: vertical;
  }

  .retake-annotation-prompt {
    border-top: 1px solid var(--retake-border, #d8dee8);
    padding-top: 7px;
    color: var(--retake-text-muted, #626270);
    font-size: 10px;
  }

  .retake-annotation-prompt summary {
    cursor: pointer;
    font-weight: 700;
  }

  .retake-annotation-prompt pre {
    max-height: 160px;
    overflow: auto;
    border-radius: 7px;
    background: #eef2f7;
    padding: 7px;
    font-size: 10px;
    white-space: pre-wrap;
  }

  .retake-annotation-errors {
    display: grid;
    flex: none;
    gap: 4px;
  }

  .retake-annotation-errors:empty {
    display: none;
  }

  .retake-annotation-errors .retake-image-studio-panel__error {
    margin: 0;
  }

  .retake-annotation-run-controls {
    display: flex;
    flex: none;
    align-items: center;
    justify-content: flex-end;
    gap: 10px;
  }

  .retake-annotation-run-controls > label {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }

  .retake-annotation-run-controls select {
    width: auto;
    min-width: 190px;
    max-width: 260px;
  }

  .retake-annotation-result-count {
    display: inline-flex;
    align-items: center;
    gap: 4px;
  }

  .retake-annotation-result-count > span {
    margin-right: 2px;
  }

  .retake-annotation-result-count button {
    display: inline-grid;
    width: 28px;
    height: 28px;
    place-items: center;
    border: 1px solid var(--retake-border, #d8dee8);
    border-radius: 6px;
    background: var(--retake-surface, #fff);
    color: #475569;
    cursor: pointer;
    font-size: 11px;
    font-weight: 700;
  }

  .retake-annotation-result-count button.is-active {
    border-color: var(--retake-accent, #7068b1);
    background: color-mix(in srgb, var(--retake-accent, #7068b1) 12%, white);
    color: var(--retake-accent, #625aa8);
  }

  .retake-annotation-run-controls > .retake-image-studio-panel__run {
    width: auto;
    min-width: 126px;
    margin: 0;
  }

  @media (max-width: 760px) {
    .retake-image-studio-panel.is-annotation {
      width: calc(100vw - 20px);
      height: calc(100vh - 24px);
      max-height: calc(100vh - 24px);
    }

    .retake-annotation-editor-shell {
      grid-template-columns: 1fr;
      overflow: auto;
    }

    .retake-annotation-tools {
      flex-direction: row;
      flex-wrap: wrap;
    }

    .retake-annotation-tool-separator {
      width: 1px;
      height: 28px;
      margin: 1px;
    }

    .retake-annotation-workspace {
      min-height: 380px;
    }

    .retake-annotation-side-panel {
      max-height: 320px;
    }

    .retake-annotation-run-controls {
      flex-wrap: wrap;
    }
  }
`;
