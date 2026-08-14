import React, {
  type ReactElement,
  type ReactNode,
} from 'react';
import type {
  PluginAssetV2,
  PluginJsonValueV2,
  PluginPanelProps as PluginPanelPropsV2,
} from '@retake/plugin-api';
import {
  annotationDraftFromUnknown,
  type AnnotationDraft,
  type AnnotationManifest,
  type AnnotationMark,
} from './annotation';
import { annotationPanelStore } from './panel-store';

const capabilityId = 'image.annotation_edit';

export function annotationDraftJson(
  draft: AnnotationDraft | AnnotationManifest,
): PluginJsonValueV2 {
  const value: Record<string, PluginJsonValueV2> = {
    ...(draft.editScope
      ? { editScope: { mode: draft.editScope.mode } }
      : {}),
    globalInstruction: draft.globalInstruction,
    ...(draft.keepItems
      ? {
          keepItems: {
            logo: draft.keepItems.logo,
            product: draft.keepItems.product,
            text: draft.keepItems.text,
          },
        }
      : {}),
    marks: draft.marks.map(annotationMarkJson),
    ...(draft.outputMode ? { outputMode: draft.outputMode } : {}),
    schemaVersion: draft.schemaVersion,
  };
  if ('sourceAssetId' in draft && draft.sourceAssetId) {
    value.sourceAssetId = draft.sourceAssetId;
  }
  return value;
}

function annotationMarkJson(mark: AnnotationMark): PluginJsonValueV2 {
  const value: Record<string, PluginJsonValueV2> = {
    color: mark.color,
    id: mark.id,
    intent: mark.intent,
    kind: mark.kind,
    strokeSize: mark.strokeSize,
  };
  if (mark.kind === 'marker') {
    value.point = { x: mark.point.x, y: mark.point.y };
  } else if (mark.kind === 'pen' || mark.kind === 'brush') {
    value.points = mark.points.map((point) => ({ x: point.x, y: point.y }));
  } else {
    value.end = { x: mark.end.x, y: mark.end.y };
    value.start = { x: mark.start.x, y: mark.start.y };
  }
  return value;
}

export function AnnotationToolButton({
  active,
  children,
  disabled,
  label,
  onClick,
}: {
  active?: boolean;
  children?: ReactNode;
  disabled?: boolean;
  label: string;
  onClick(): void;
}): ReactElement {
  return (
    <button
      aria-pressed={active}
      className={active ? 'is-active' : undefined}
      data-tool-label={label}
      disabled={disabled}
      aria-label={label}
      onClick={onClick}
      type="button"
    >
      {children ?? label}
    </button>
  );
}

export function annotationSourceSession(
  panel: ReturnType<typeof annotationPanelStore.getSnapshot>,
  host: PluginPanelPropsV2['host'],
): {
  asset: PluginAssetV2 | null;
  blockId: string | null;
  title: string;
  url?: string;
} {
  if (panel.block) {
    const asset = host.assets.getBound(panel.block.assetId);
    return {
      asset,
      blockId: panel.block.blockId,
      title: panel.block.title,
      url: asset?.previewUrl ?? panel.block.previewUrl,
    };
  }
  const source = panel.operation?.source;
  if (!source) {
    return { asset: null, blockId: null, title: '' };
  }
  const asset = panel.operation?.inputAssets.find(
    (candidate) => candidate.assetId === source.assetId,
  ) ?? null;
  return {
    asset,
    blockId: source.blockId,
    title: source.title,
    url: asset?.previewUrl,
  };
}

export function initialAnnotationDraft(
  panel: ReturnType<typeof annotationPanelStore.getSnapshot>,
  host: PluginPanelPropsV2['host'],
  sourceAssetId: string | undefined,
): AnnotationDraft | null {
  if (panel.operation) {
    return annotationDraftFromUnknown(
      panel.operation.parameters.manifest
      ?? panel.operation.parameters.annotationManifest,
    );
  }
  if (!panel.block) return null;
  try {
    const draft = annotationDraftFromUnknown(host.drafts.getBound({
      blockId: panel.block.blockId,
      capabilityId,
    })?.value);
    if (
      draft?.sourceAssetId
      && sourceAssetId
      && draft.sourceAssetId !== sourceAssetId
    ) return null;
    return draft;
  } catch {
    return null;
  }
}
