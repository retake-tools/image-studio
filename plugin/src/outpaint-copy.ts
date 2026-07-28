import {
  createPluginTranslator,
  defineMessages,
} from '@retake/plugin-api';

export const outpaintMessages = defineMessages({
  anchor: localized('Source anchor', '原图锚点'),
  aspectRatio: localized('Target ratio', '目标比例'),
  candidates: localized('Candidates', '候选数量'),
  close: localized('Close', '关闭'),
  connection: localized('Image connection', '图片连接'),
  decrease: localized('Decrease expansion', '减少扩展量'),
  defaultPrompt: localized(
    'Naturally continue the surrounding scene, lighting, texture, and spatial relationships.',
    '自然延续原图周围的场景、光线、纹理和空间关系。',
  ),
  expandAmount: localized('Expansion', '扩展量'),
  failed: localized('Failed to start AI Expand', 'AI 扩图启动失败'),
  increase: localized('Increase expansion', '增加扩展量'),
  noConnection: localized(
    'No image Connection can run AI Expand. Configure and test one in Settings.',
    '没有可用于 AI 扩图的图片连接，请先在设置中配置并测试。',
  ),
  noExpansion: localized(
    'The target canvas does not extend the source. Increase expansion or choose another ratio.',
    '当前画布没有比原图更大，请增加扩展量或更换比例。',
  ),
  output: localized('Output size', '最终尺寸'),
  prompt: localized('Expand instruction (optional)', '扩图要求（可选）'),
  promptPlaceholder: localized(
    'Leave empty to continue the scene naturally, or describe the new area.',
    '留空时会自然延续场景；也可以描述新增区域。',
  ),
  run: localized('Run AI Expand', '执行 AI 扩图'),
  running: localized('Preparing expand…', '正在准备扩图…'),
  sourcePosition: localized('Drag source position', '拖动原图位置'),
  sourceUnavailable: localized(
    'The source image is unavailable.',
    '当前源图不可用。',
  ),
  targetTooLarge: localized(
    'The target exceeds the V0 limit of 4096px per side / 16M pixels.',
    '目标画布超过首版 4096px / 1600 万像素限制。',
  ),
  title: localized('AI Expand', 'AI 扩图'),
});

export function outpaintCopy(locale: string) {
  const translator = createPluginTranslator(outpaintMessages, locale);
  return Object.fromEntries(
    Object.keys(outpaintMessages).map((messageId) => [
      messageId,
      translator.t(messageId as keyof typeof outpaintMessages),
    ]),
  ) as Record<keyof typeof outpaintMessages, string>;
}

function localized(english: string, chinese: string) {
  return { default: english, locales: { 'zh-CN': chinese } };
}
