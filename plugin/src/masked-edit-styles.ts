export const maskedEditStyles = `
  .retake-image-studio-panel.is-masked-edit {
    width: min(430px, calc(100vw - 32px));
  }

  .retake-image-studio-connected-note {
    margin: 0;
    border: 1px solid rgba(120, 119, 198, 0.24);
    border-radius: 10px;
    background: rgba(120, 119, 198, 0.08);
    padding: 9px 10px;
    color: #555572;
    font-size: 12px;
    line-height: 1.45;
  }

  .retake-image-studio-masked-inputs {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px;
  }

  .retake-image-studio-masked-input {
    display: grid;
    gap: 7px;
    margin: 0;
    border: 1px solid rgba(38, 38, 48, 0.12);
    border-radius: 12px;
    padding: 8px;
    background: rgba(245, 245, 248, 0.86);
  }

  .retake-image-studio-masked-input figcaption {
    color: #30303d;
    font-size: 12px;
    font-weight: 700;
  }

  .retake-image-studio-masked-input img {
    width: 100%;
    aspect-ratio: 1;
    border-radius: 8px;
    background: #ececf0;
    object-fit: contain;
  }

  .retake-image-studio-masked-input small {
    overflow: hidden;
    color: #777782;
    font-size: 11px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .retake-image-studio-mask-swap {
    align-self: center;
    border: 0;
    background: transparent;
    color: #5c55a5;
    cursor: pointer;
    font: inherit;
    font-size: 12px;
    font-weight: 700;
  }

  .retake-image-studio-prompt {
    display: grid;
    gap: 7px;
    color: #30303d;
    font-size: 12px;
    font-weight: 700;
  }

  .retake-image-studio-prompt textarea {
    resize: vertical;
    min-height: 92px;
    border: 1px solid rgba(38, 38, 48, 0.16);
    border-radius: 10px;
    padding: 10px;
    background: white;
    color: #20202a;
    font: inherit;
    font-weight: 400;
    line-height: 1.5;
  }
`;
