export const annotationStyles = `
  .retake-image-studio-panel.is-annotation {
    position: fixed;
    display: grid;
    top: 16px;
    right: 16px;
    bottom: 16px;
    width: min(920px, calc(100vw - 32px));
    max-height: none;
    grid-template-columns: minmax(0, 1.35fr) minmax(280px, 0.65fr);
    align-content: start;
    overflow: auto;
  }

  .retake-image-studio-panel.is-annotation > .retake-image-studio-panel__header,
  .retake-image-studio-panel.is-annotation > .retake-annotation-notice,
  .retake-image-studio-panel.is-annotation > .retake-annotation-tools,
  .retake-image-studio-panel.is-annotation > .retake-image-studio-panel__error,
  .retake-image-studio-panel.is-annotation > .retake-annotation-prompt,
  .retake-image-studio-panel.is-annotation > .retake-image-studio-panel__run {
    grid-column: 1 / -1;
  }

  .retake-annotation-notice {
    margin: 0;
    border: 1px solid color-mix(in srgb, var(--retake-accent, #7068b1) 30%, transparent);
    border-radius: 10px;
    background: color-mix(in srgb, var(--retake-accent, #7068b1) 8%, transparent);
    padding: 8px 10px;
    color: var(--retake-text-muted, #626270);
    font-size: 12px;
  }

  .retake-annotation-tools {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  .retake-annotation-tools button,
  .retake-annotation-zoom button,
  .retake-annotation-strokes button {
    border: 1px solid var(--retake-border, rgba(38, 38, 48, 0.14));
    border-radius: 8px;
    background: var(--retake-surface, #fff);
    padding: 6px 8px;
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
    font-weight: 700;
  }

  .retake-annotation-tools button:disabled,
  .retake-annotation-zoom button:disabled {
    cursor: default;
    opacity: 0.42;
  }

  .retake-annotation-workspace {
    display: grid;
    min-width: 0;
    gap: 8px;
  }

  .retake-annotation-stage-shell {
    display: grid;
    place-items: center;
    min-height: 390px;
    overflow: hidden;
    border: 1px solid var(--retake-border, rgba(38, 38, 48, 0.14));
    border-radius: 14px;
    background:
      linear-gradient(45deg, rgba(40, 40, 48, 0.035) 25%, transparent 25%),
      linear-gradient(-45deg, rgba(40, 40, 48, 0.035) 25%, transparent 25%),
      linear-gradient(45deg, transparent 75%, rgba(40, 40, 48, 0.035) 75%),
      linear-gradient(-45deg, transparent 75%, rgba(40, 40, 48, 0.035) 75%);
    background-position: 0 0, 0 8px, 8px -8px, -8px 0;
    background-size: 16px 16px;
  }

  .retake-annotation-stage {
    position: relative;
    transform-origin: center;
    touch-action: none;
  }

  .retake-annotation-stage img {
    display: block;
    width: 100%;
    height: 100%;
    border-radius: 4px;
    object-fit: fill;
    user-select: none;
  }

  .retake-annotation-pointer-layer {
    position: absolute;
    inset: 0;
    outline: none;
    cursor: crosshair;
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
    stroke: #fff;
    stroke-opacity: 0.9;
    stroke-dasharray: 0.015 0.01;
  }

  .retake-annotation-endpoint {
    fill: #fff;
    stroke: var(--retake-accent, #7068b1);
    stroke-width: 0.004;
  }

  .retake-annotation-zoom {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 7px;
  }

  .retake-annotation-zoom span {
    min-width: 44px;
    text-align: center;
    color: var(--retake-text-muted, #626270);
    font-size: 11px;
  }

  .retake-annotation-pan-hint {
    text-align: center;
    color: var(--retake-text-muted, #777782);
    font-size: 11px;
  }

  .retake-annotation-settings,
  .retake-annotation-intents,
  .retake-annotation-global,
  .retake-annotation-execution {
    display: grid;
    align-content: start;
    gap: 10px;
    min-width: 0;
  }

  .retake-annotation-settings {
    grid-template-columns: 1fr 1fr;
  }

  .retake-annotation-settings fieldset {
    min-width: 0;
    margin: 0;
    border: 1px solid var(--retake-border, rgba(38, 38, 48, 0.12));
    border-radius: 10px;
    padding: 8px;
  }

  .retake-annotation-settings legend,
  .retake-annotation-global > span,
  .retake-annotation-execution span {
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
    width: 24px;
    height: 24px;
    border: 2px solid transparent;
    border-radius: 999px;
    cursor: pointer;
  }

  .retake-annotation-swatches button.is-active {
    border-color: #fff;
    box-shadow: 0 0 0 2px var(--retake-accent, #7068b1);
  }

  .retake-annotation-intents {
    max-height: 300px;
    overflow: auto;
    border: 1px solid var(--retake-border, rgba(38, 38, 48, 0.12));
    border-radius: 12px;
    padding: 10px;
  }

  .retake-annotation-intents > strong {
    color: var(--retake-text, #30303d);
    font-size: 12px;
  }

  .retake-annotation-intents > p {
    margin: 0;
    color: var(--retake-text-muted, #777782);
    font-size: 12px;
  }

  .retake-annotation-intents label {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 6px;
    border: 1px solid transparent;
    border-radius: 9px;
    padding: 6px;
  }

  .retake-annotation-intents label.is-selected {
    border-color: color-mix(in srgb, var(--retake-accent, #7068b1) 35%, transparent);
    background: color-mix(in srgb, var(--retake-accent, #7068b1) 6%, transparent);
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
    width: 22px;
    height: 22px;
    place-items: center;
    border: 1px solid var(--retake-border, rgba(38, 38, 48, 0.16));
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
  .retake-annotation-execution select {
    width: 100%;
    box-sizing: border-box;
    border: 1px solid var(--retake-border, rgba(38, 38, 48, 0.16));
    border-radius: 9px;
    background: var(--retake-surface, #fff);
    padding: 8px;
    color: var(--retake-text, #20202a);
    font: inherit;
    font-size: 12px;
  }

  .retake-annotation-global {
    margin-top: -2px;
  }

  .retake-annotation-global textarea {
    resize: vertical;
  }

  .retake-annotation-execution {
    grid-template-columns: minmax(0, 1fr) 110px;
  }

  .retake-annotation-execution label {
    display: grid;
    gap: 6px;
  }

  .retake-annotation-prompt {
    color: var(--retake-text-muted, #626270);
    font-size: 11px;
  }

  .retake-annotation-prompt pre {
    max-height: 180px;
    overflow: auto;
    border-radius: 9px;
    background: var(--retake-surface-muted, #f5f5f8);
    padding: 9px;
    white-space: pre-wrap;
  }

  @media (max-width: 760px) {
    .retake-image-studio-panel.is-annotation {
      grid-template-columns: 1fr;
    }

    .retake-image-studio-panel.is-annotation > * {
      grid-column: 1 !important;
    }

    .retake-annotation-stage-shell {
      min-height: 300px;
    }
  }
`;
