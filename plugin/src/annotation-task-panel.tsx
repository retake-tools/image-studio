import React, { type ReactElement } from 'react';
import { CheckCircle2, Paintbrush } from 'lucide-react';
import type {
  AnnotationKeepItems,
  AnnotationMark,
} from './annotation';
import type { AnnotationCopy } from './annotation-copy';

interface AnnotationTaskPanelProps {
  copy: AnnotationCopy;
  disabled: boolean;
  draftStatus: 'failed' | 'saved' | 'saving';
  globalInstruction: string;
  keepItems: AnnotationKeepItems;
  marks: readonly AnnotationMark[];
  onKeepItemsChange(next: AnnotationKeepItems): void;
  showDraftStatus: boolean;
}

export function AnnotationTaskPanel({
  copy,
  disabled,
  draftStatus,
  globalInstruction,
  keepItems,
  marks,
  onKeepItemsChange,
  showDraftStatus,
}: AnnotationTaskPanelProps): ReactElement {
  const editSummary = annotationEditSummary(globalInstruction, marks)
    || copy.noTaskSummary;
  const selectedRegions = copy.selectedRegions.replace(
    '{count}',
    String(marks.length),
  );

  return (
    <div className="retake-annotation-task-panel">
      <section aria-labelledby="retake-annotation-edit-scope">
        <h3 id="retake-annotation-edit-scope">{copy.editScope}</h3>
        <div className="retake-annotation-scope-card">
          <Paintbrush aria-hidden="true" size={17} />
          <span>
            <strong>{copy.manualSelection}</strong>
            <small>{selectedRegions}</small>
          </span>
        </div>
      </section>

      <fieldset disabled={disabled}>
        <legend>{copy.keepContent}</legend>
        <AnnotationKeepToggle
          checked={keepItems.product}
          label={copy.preserveProduct}
          onChange={(checked) => onKeepItemsChange({
            ...keepItems,
            product: checked,
          })}
        />
        <AnnotationKeepToggle
          checked={keepItems.logo}
          label={copy.preserveLogo}
          onChange={(checked) => onKeepItemsChange({
            ...keepItems,
            logo: checked,
          })}
        />
        <AnnotationKeepToggle
          checked={keepItems.text}
          label={copy.preserveText}
          onChange={(checked) => onKeepItemsChange({
            ...keepItems,
            text: checked,
          })}
        />
      </fieldset>

      <section aria-labelledby="retake-annotation-task-summary">
        <h3 id="retake-annotation-task-summary">{copy.taskSummary}</h3>
        <dl className="retake-annotation-task-summary">
          <div>
            <dt>{copy.editContent}</dt>
            <dd>{editSummary}</dd>
          </div>
          <div>
            <dt>{copy.editScope}</dt>
            <dd>{copy.manualSelection} · {selectedRegions}</dd>
          </div>
        </dl>
      </section>

      {showDraftStatus ? (
        <div className="retake-annotation-draft-status" role="status">
          <span>{copy.status}</span>
          <strong className={`is-${draftStatus}`}>
            <CheckCircle2 aria-hidden="true" size={14} />
            {draftStatus === 'saving'
              ? copy.statusSaving
              : draftStatus === 'failed'
                ? copy.draftFailed
                : copy.statusAutosaved}
          </strong>
        </div>
      ) : null}
    </div>
  );
}

function AnnotationKeepToggle({
  checked,
  label,
  onChange,
}: {
  checked: boolean;
  label: string;
  onChange(checked: boolean): void;
}): ReactElement {
  return (
    <label>
      <input
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        type="checkbox"
      />
      <span>{label}</span>
    </label>
  );
}

function annotationEditSummary(
  globalInstruction: string,
  marks: readonly AnnotationMark[],
): string {
  if (globalInstruction.trim()) return globalInstruction.trim();
  return [...new Set(
    marks.map((mark) => mark.intent.trim()).filter(Boolean),
  )].join('；');
}
