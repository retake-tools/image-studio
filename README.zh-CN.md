# Retake Image Studio

[English](./README.md)

Image Studio 是 Retake 官方的图片处理 Plugin，目标是在无限画布上提供可视化、流程化、可组合的
真实图片处理能力。

当前首个完整能力是 `image.local_adjust`：

- 在 Image Block 工具栏中提供 **Adjust image** 入口；
- 使用原生 React Panel 实时预览亮度、对比度和饱和度；
- 使用浏览器 Canvas 2D 在本地处理图片；
- 通过 Retake Host API 创建新的标准 Image Asset、Operation、Execution 和 Result Block；
- 不修改源图片。

Retake Whiteboard 继续负责画布、Block / Edge、AssetStore、Execution、History、Package 生命周期、
信任和持久化；本仓库只拥有图片专业能力、界面、参数和处理器。

可分发的 Retake Package 源码位于 [`plugin/`](./plugin)。仓库根目录的测试、依赖和 Git 元数据不会
进入安装产物。

## 从 Web 安装

在 Retake Whiteboard 中打开 **设置 → 插件库**，输入：

```text
github:retake-tools/image-studio@<commit-or-tag>#subdirectory=plugin
```

推荐使用完整 commit ID，以确保安装结果可复现。Retake 会自动获取源码、执行受控构建、缓存安装
产物，并要求用户确认该精确代码版本的权限与信任后再启用。

当前能力完全在浏览器中执行，不需要额外安装 CLI 或本地 bridge。

更新、回滚、禁用、安全模式和移除的行为见
[安装与生命周期说明](./docs/install.md)。

## 开发与验证

需要 Node.js 22 或更新版本：

```bash
npm ci
npm run validate
npm run typecheck
npm test
npm run release:check
```

更多资料：

- [Package 结构与作者边界](./docs/authoring.md)
- [发布流程与检查清单](./docs/releasing.md)
- [参与贡献](./CONTRIBUTING.md)

`develop` 是稳定集成分支。只有在完整验证并得到明确发布确认后，才会将 `develop` 提升到 `main`
并创建公开版本标签或 GitHub Release。
