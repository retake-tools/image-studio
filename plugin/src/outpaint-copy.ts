import { isChineseLocale } from './localization';

export function outpaintCopy(locale: string) {
  if (isChineseLocale(locale)) {
    return {
      anchor: '原图锚点',
      aspectRatio: '目标比例',
      candidates: '候选数量',
      close: '关闭',
      connection: '图片连接',
      decrease: '减少扩展量',
      defaultPrompt: '自然延续原图周围的场景、光线、纹理和空间关系。',
      expandAmount: '扩展量',
      failed: 'AI 扩图启动失败',
      increase: '增加扩展量',
      noConnection: '没有可用于 AI 扩图的图片连接，请先在设置中配置并测试。',
      noExpansion: '当前画布没有比原图更大，请增加扩展量或更换比例。',
      output: '最终尺寸',
      prompt: '扩图要求（可选）',
      promptPlaceholder: '留空时会自然延续场景；也可以描述新增区域。',
      run: '执行 AI 扩图',
      running: '正在准备扩图…',
      sourcePosition: '拖动原图位置',
      sourceUnavailable: '当前源图不可用。',
      targetTooLarge: '目标画布超过首版 4096px / 1600 万像素限制。',
      title: 'AI 扩图',
    };
  }
  return {
    anchor: 'Source anchor',
    aspectRatio: 'Target ratio',
    candidates: 'Candidates',
    close: 'Close',
    connection: 'Image connection',
    decrease: 'Decrease expansion',
    defaultPrompt:
      'Naturally continue the surrounding scene, lighting, texture, and spatial relationships.',
    expandAmount: 'Expansion',
    failed: 'Failed to start AI Expand',
    increase: 'Increase expansion',
    noConnection:
      'No image Connection can run AI Expand. Configure and test one in Settings.',
    noExpansion:
      'The target canvas does not extend the source. Increase expansion or choose another ratio.',
    output: 'Output size',
    prompt: 'Expand instruction (optional)',
    promptPlaceholder:
      'Leave empty to continue the scene naturally, or describe the new area.',
    run: 'Run AI Expand',
    running: 'Preparing expand…',
    sourcePosition: 'Drag source position',
    sourceUnavailable: 'The source image is unavailable.',
    targetTooLarge:
      'The target exceeds the V0 limit of 4096px per side / 16M pixels.',
    title: 'AI Expand',
  };
}
