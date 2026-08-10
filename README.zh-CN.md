# Retake Image Studio

[English](./README.md)

Image Studio 是 Retake 官方的图片处理 Plugin，目标是在无限画布上提供可视化、流程化、可组合的
真实图片处理能力。

当前提供三个浏览器原生工具和两个 Retake 连接式 AI 编辑界面：

- `image.local_adjust`：实时预览和调整亮度、对比度、饱和度；
- `image.local_crop`：比例预设、直接拖动四角调整裁剪框、拖动或键盘定位、精确输出尺寸；
- `image.local_resize`：等比百分比或像素缩放、显式放大控制，以及 PNG / JPEG / WebP 输出；
- `image.annotation_edit`：通过编号定位点、箭头、画笔、区域画笔、矩形或椭圆标记图片，
  为每个标记或全局填写修改要求，并生成 1–4 张不含标注的编辑结果；
- `image.outpaint`：选择目标比例与扩展量，拖动或锚定保持自然像素尺寸的原图，并生成
  1–4 张扩图候选；最终结果会精确保留原图区域的像素；
- 使用浏览器 Canvas 2D 在本地处理；
- 通过 Retake Host API 创建新的标准 Image Asset、Operation、Execution 和 Result Block；
- 不修改源图片。

`image.masked_edit` 仅保留为外部 Workflow 已提供精确 Mask 时可调用的 typed compatibility
contract；Image Studio 不再提供选区蒙版制作或局部蒙版编辑界面。

Retake Whiteboard 继续负责画布、Block / Edge、AssetStore、Execution、History、Package 生命周期、
信任和持久化；本仓库只拥有图片专业能力、界面、参数和处理器。

IP 角色策略是当前公开的单 Operation Skill 入口，只从创意简报创建角色设定文档；IP 形象设计继续作为
完整的公开场景 Workflow 入口。退役的 Guided Image Skill、Workflow 和 AgentPreset 不再随 Package
分发，也不会注册进当前创作目录。历史 Run 继续从冻结的 Board、StepRun、Execution 与 Artifact 事实
只读展示，但不能重新启动旧流程。

可分发的单一 Retake Package 源码位于 [`plugin/`](./plugin)。仓库根目录的测试、依赖和 Git 元数据不会
进入安装产物。

## 从 Web 安装

在 Retake Whiteboard 0.1.4 或更高版本中打开 **设置 → 插件库**。如需跟随最新稳定版并接收更新
通知，输入：

```text
github:retake-tools/image-studio@main#subdirectory=plugin
```

如需不可变且可复现的安装，使用当前发布 tag：

```text
github:retake-tools/image-studio@v0.12.3#subdirectory=plugin
```

`main` 是持续移动的稳定更新通道；版本 tag 保持固定。Retake 会自动获取源码、执行受控构建、
缓存安装产物，并要求用户确认该精确代码版本的权限与信任后再启用。

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
