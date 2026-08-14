import {
  createPluginTranslator,
  defineMessages,
} from '@retake/plugin-api';
import type { AnnotationMarkKind } from './annotation';

export interface AnnotationCopy {
  arrow: string;
  blue: string;
  brush: string;
  candidateCount: string;
  cancel: string;
  clear: string;
  clearConfirm: string;
  close: string;
  color: string;
  connection: string;
  done: string;
  draftFailed: string;
  deleteMark: string;
  ellipse: string;
  eraser: string;
  editContent: string;
  editScope: string;
  failed: string;
  globalInstruction: string;
  globalPlaceholder: string;
  green: string;
  historical: string;
  intent: string;
  intentPlaceholder: string;
  keepContent: string;
  markLimit: string;
  manualSelection: string;
  marker: string;
  missingIntent: string;
  noConnection: string;
  noMarks: string;
  noTaskSummary: string;
  panHint: string;
  pen: string;
  purple: string;
  promptPreview: string;
  preserveLogo: string;
  preserveProduct: string;
  preserveText: string;
  rect: string;
  red: string;
  redo: string;
  run: string;
  running: string;
  select: string;
  selectedRegions: string;
  sourceUnavailable: string;
  status: string;
  statusAutosaved: string;
  statusSaving: string;
  stroke: string;
  taskSummary: string;
  title: string;
  undo: string;
  zoomIn: string;
  zoomOut: string;
  zoomReset: string;
  yellow: string;
}

export const annotationMessages = defineMessages({
  arrow: localized('Arrow', '箭头'),
  blue: localized('Blue', '蓝色'),
  brush: localized('Region brush', '区域画笔'),
  candidateCount: localized('Candidates', '候选数量'),
  cancel: localized('Cancel', '取消'),
  clear: localized('Clear', '清空'),
  clearConfirm: localized(
    'Clear every mark? You can restore them with Undo.',
    '确定要清空所有标记吗？此操作可以通过撤销恢复。',
  ),
  close: localized('Close', '关闭'),
  color: localized('Color', '颜色'),
  connection: localized('Connection', '连接'),
  done: localized('Done', '完成'),
  draftFailed: localized('Failed to save draft', '草稿保存失败'),
  deleteMark: localized('Delete mark', '删除标记'),
  ellipse: localized('Ellipse', '椭圆'),
  eraser: localized('Eraser', '橡皮擦'),
  editContent: localized('Edit content', '修改内容'),
  editScope: localized('Edit scope', '修改范围'),
  failed: localized('Failed to start annotation edit', '标注编辑启动失败'),
  globalInstruction: localized('Global instruction', '全局要求'),
  globalPlaceholder: localized(
    'For example: preserve the subject and composition; change only marked areas.',
    '例如：保持人物和构图，只修改标记区域。',
  ),
  green: localized('Green', '绿色'),
  historical: localized(
    'Historical temporary session. Changes do not overwrite the current image draft.',
    '历史临时会话；修改不会覆盖当前图片草稿。',
  ),
  intent: localized('Mark instruction', '标记要求'),
  intentPlaceholder: localized(
    'Describe the edit for this marked location',
    '说明这个标记位置要如何修改',
  ),
  keepContent: localized('Preserve content', '保持内容'),
  markLimit: localized(
    'One annotation session supports up to 256 marks.',
    '单次标注最多支持 256 个标记。',
  ),
  manualSelection: localized('Manual annotations', '手动选择区域'),
  marker: localized('Marker', '定位点'),
  missingIntent: localized(
    'Add an instruction for these marks',
    '请为这些标记补充要求',
  ),
  noConnection: localized(
    'No image Connection is ready. Configure one in Settings.',
    '没有可用的图片连接，请先在设置中配置。',
  ),
  noMarks: localized('No marks yet.', '还没有标记。'),
  noTaskSummary: localized(
    'Describe the change in a mark or the global instruction.',
    '请在标记要求或全局要求中说明修改内容。',
  ),
  panHint: localized(
    'With Select active, drag to pan or double-click to reset to 100%.',
    '切换到选择工具后，拖动可平移，双击可恢复 100%。',
  ),
  pen: localized('Pen', '画笔'),
  purple: localized('Purple', '紫色'),
  promptPreview: localized('Execution prompt', '执行提示词'),
  preserveLogo: localized('Preserve logo', '保持 Logo'),
  preserveProduct: localized('Preserve product', '保持商品'),
  preserveText: localized('Preserve text', '保持文字'),
  rect: localized('Rectangle', '矩形'),
  red: localized('Red', '红色'),
  redo: localized('Redo', '重做'),
  run: localized('Run annotation edit', '执行标注编辑'),
  running: localized('Starting…', '正在启动…'),
  select: localized('Select', '选择'),
  selectedRegions: localized(
    '{count} selected annotations',
    '已选择 {count} 个区域',
  ),
  sourceUnavailable: localized(
    'The source image is outside the current Plugin scope.',
    '源图已不在当前插件授权范围内。',
  ),
  status: localized('Status', '状态'),
  statusAutosaved: localized('Draft autosaved', '草稿已自动保存'),
  statusSaving: localized('Saving draft…', '正在保存草稿…'),
  stroke: localized('Stroke', '粗细'),
  taskSummary: localized('Task summary', '任务摘要'),
  title: localized('Annotation edit', '标注编辑'),
  undo: localized('Undo', '撤销'),
  zoomIn: localized('Zoom in', '放大'),
  zoomOut: localized('Zoom out', '缩小'),
  zoomReset: localized('Reset view', '重置视图'),
  yellow: localized('Yellow', '黄色'),
});

export function annotationCopy(locale: string): AnnotationCopy {
  const translator = createPluginTranslator(annotationMessages, locale);
  return Object.fromEntries(
    Object.keys(annotationMessages).map((messageId) => [
      messageId,
      translator.t(messageId as keyof typeof annotationMessages),
    ]),
  ) as unknown as AnnotationCopy;
}

function localized(english: string, chinese: string) {
  return { default: english, locales: { 'zh-CN': chinese } };
}

export function annotationColorLabel(
  color: string,
  copy: AnnotationCopy,
): string {
  if (color === '#dc2626') return copy.red;
  if (color === '#facc15') return copy.yellow;
  if (color === '#22c55e') return copy.green;
  if (color === '#2563eb') return copy.blue;
  return copy.purple;
}

export function annotationKindLabel(
  kind: AnnotationMarkKind,
  copy: AnnotationCopy,
): string {
  if (kind === 'marker') return copy.marker;
  if (kind === 'arrow') return copy.arrow;
  if (kind === 'pen') return copy.pen;
  if (kind === 'brush') return copy.brush;
  if (kind === 'rect') return copy.rect;
  return copy.ellipse;
}
