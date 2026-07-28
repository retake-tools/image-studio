# Retake Image Studio

[English](./README.md)

Image Studio 是 Retake 官方的图片处理 Plugin，目标是在无限画布上提供可视化、流程化、可组合的
真实图片处理能力。

当前包含四个浏览器原生能力和三个 Retake 连接式 AI 能力：

- `image.local_adjust`：实时预览和调整亮度、对比度、饱和度；
- `image.local_crop`：比例预设、裁剪范围、拖动或键盘定位、精确输出尺寸；
- `image.local_resize`：等比百分比或像素缩放、显式放大控制，以及 PNG / JPEG / WebP 输出；
- `image.local_selection_mask`：添加 / 擦除选区、撤销、重做、反选，并输出与原图等大的
  provider-neutral 黑白 PNG 蒙版；
- `image.masked_edit`：同时绑定源图与等大的 Selection Mask，通过 Retake 当前图片默认连接
  执行局部 Codex 图片编辑；
- `image.annotation_edit`：通过编号定位点、箭头、画笔、区域画笔、矩形或椭圆标记图片，
  为每个标记或全局填写修改要求，并生成 1–4 张不含标注的编辑结果；
- `image.outpaint`：选择目标比例与扩展量，拖动或锚定保持自然像素尺寸的原图，并生成
  1–4 张扩图候选；最终结果会精确保留原图区域的像素；
- 使用浏览器 Canvas 2D 在本地处理；
- 通过 Retake Host API 创建新的标准 Image Asset、Operation、Execution 和 Result Block；
- 不修改源图片。

Retake Whiteboard 继续负责画布、Block / Edge、AssetStore、Execution、History、Package 生命周期、
信任和持久化；本仓库只拥有图片专业能力、界面、参数和处理器。

同一个 Retake Package 还包含 Guided Image Skill、人工审阅 Workflow 和受限 Guided Image
Operator AgentPreset。Guided Image 是进入 Image Studio 的流程入口，不是第二个 Plugin，也不是
需要单独安装的产品。

可分发的单一 Retake Package 源码位于 [`plugin/`](./plugin)。仓库根目录的测试、依赖和 Git 元数据不会
进入安装产物。

## 从 Web 安装

在 Retake Whiteboard 中打开 **设置 → 插件库**，输入：

```text
github:retake-tools/image-studio@<commit-or-tag>#subdirectory=plugin
```

推荐使用完整 commit ID，以确保安装结果可复现。Retake 会自动获取源码、执行受控构建、缓存安装
产物，并要求用户确认该精确代码版本的权限与信任后再启用。

不需要额外安装 CLI 或本地 bridge。本地处理保留在 Plugin 中；AI 编辑复用 Retake 已有的
Codex App Server 或手动 Codex/MCP 路由，Plugin 不接触凭据与本地路径。

更新、回滚、禁用、安全模式和移除的行为见
[安装与生命周期说明](./docs/install.md)。

## 开发与验证

canonical 开发、CI 与发布检查使用 Node.js 24.18.0。Node.js 22.12 或更高版本继续作为
兼容运行时；Node.js 26 在进入 LTS 且 Retake Package 归档 codec 与运行时解耦前仅作实验性验证：

```bash
npm ci
npm run validate
npm run typecheck
npm test
npm run release:check
```

更多资料：

- [Package 结构与作者边界](./docs/authoring.md)
- [Selection Mask 边界](./docs/selection-mask.md)
- [局部 AI 编辑边界](./docs/masked-edit.md)
- [标注编辑边界](./docs/annotation.md)
- [AI 扩图边界](./docs/outpaint.md)
- [发布流程与检查清单](./docs/releasing.md)
- [参与贡献](./CONTRIBUTING.md)

`develop` 是稳定集成分支。只有在完整验证并得到明确发布确认后，才会将 `develop` 提升到 `main`
并创建公开版本标签或 GitHub Release。

## 开源协议

Retake Image Studio 使用 [Apache License 2.0](./LICENSE)，需要保留的署名信息见
[NOTICE](./NOTICE)。
