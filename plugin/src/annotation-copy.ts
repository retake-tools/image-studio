import { isChineseLocale } from './localization';
import type { AnnotationMarkKind } from './annotation';

export interface AnnotationCopy {
  arrow: string;
  blue: string;
  brush: string;
  candidateCount: string;
  clear: string;
  close: string;
  color: string;
  connection: string;
  draftFailed: string;
  deleteMark: string;
  ellipse: string;
  eraser: string;
  failed: string;
  globalInstruction: string;
  globalPlaceholder: string;
  green: string;
  historical: string;
  intent: string;
  intentPlaceholder: string;
  markLimit: string;
  marker: string;
  missingIntent: string;
  noConnection: string;
  noMarks: string;
  panHint: string;
  pen: string;
  purple: string;
  promptPreview: string;
  rect: string;
  red: string;
  redo: string;
  run: string;
  running: string;
  select: string;
  sourceUnavailable: string;
  stroke: string;
  title: string;
  undo: string;
  zoomIn: string;
  zoomOut: string;
  zoomReset: string;
  yellow: string;
}

export function annotationCopy(locale: string): AnnotationCopy {
  if (isChineseLocale(locale)) {
    return {
      arrow: '箭头',
      blue: '蓝色',
      brush: '区域画笔',
      candidateCount: '候选数量',
      clear: '清空',
      close: '关闭',
      color: '颜色',
      connection: '连接',
      draftFailed: '草稿保存失败',
      deleteMark: '删除标记',
      ellipse: '椭圆',
      eraser: '橡皮擦',
      failed: '标注编辑启动失败',
      globalInstruction: '全局要求',
      globalPlaceholder: '例如：保持人物和构图，只修改标记区域。',
      green: '绿色',
      historical: '历史临时会话；修改不会覆盖当前图片草稿。',
      intent: '标记要求',
      intentPlaceholder: '说明这个标记位置要如何修改',
      markLimit: '单次标注最多支持 256 个标记。',
      marker: '定位点',
      missingIntent: '请为这些标记补充要求',
      noConnection: '没有可用的图片连接，请先在设置中配置。',
      noMarks: '还没有标记。',
      panHint: '放大后在空白处拖动可平移。',
      pen: '画笔',
      purple: '紫色',
      promptPreview: '执行提示词',
      rect: '矩形',
      red: '红色',
      redo: '重做',
      run: '执行标注编辑',
      running: '正在启动…',
      select: '选择',
      sourceUnavailable: '源图已不在当前插件授权范围内。',
      stroke: '粗细',
      title: '标注编辑',
      undo: '撤销',
      zoomIn: '放大',
      zoomOut: '缩小',
      zoomReset: '重置视图',
      yellow: '黄色',
    };
  }
  return {
    arrow: 'Arrow',
    blue: 'Blue',
    brush: 'Region brush',
    candidateCount: 'Candidates',
    clear: 'Clear',
    close: 'Close',
    color: 'Color',
    connection: 'Connection',
    draftFailed: 'Failed to save draft',
    deleteMark: 'Delete mark',
    ellipse: 'Ellipse',
    eraser: 'Eraser',
    failed: 'Failed to start annotation edit',
    globalInstruction: 'Global instruction',
    globalPlaceholder: 'For example: preserve the subject and composition; change only marked areas.',
    green: 'Green',
    historical: 'Historical temporary session. Changes do not overwrite the current image draft.',
    intent: 'Mark instruction',
    intentPlaceholder: 'Describe the edit for this marked location',
    markLimit: 'One annotation session supports up to 256 marks.',
    marker: 'Marker',
    missingIntent: 'Add an instruction for these marks',
    noConnection: 'No image Connection is ready. Configure one in Settings.',
    noMarks: 'No marks yet.',
    panHint: 'Drag empty space to pan after zooming in.',
    pen: 'Pen',
    purple: 'Purple',
    promptPreview: 'Execution prompt',
    rect: 'Rectangle',
    red: 'Red',
    redo: 'Redo',
    run: 'Run annotation edit',
    running: 'Starting…',
    select: 'Select',
    sourceUnavailable: 'The source image is outside the current Plugin scope.',
    stroke: 'Stroke',
    title: 'Annotation edit',
    undo: 'Undo',
    zoomIn: 'Zoom in',
    zoomOut: 'Zoom out',
    zoomReset: 'Reset view',
    yellow: 'Yellow',
  };
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
