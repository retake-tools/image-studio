# Retake Image Studio

[简体中文](./README.zh-CN.md)

Image Studio is the official Retake plugin for deep, workflow-native image
editing on the infinite canvas.

The current package provides three browser-native authoring tools and two
Retake-connected AI editing surfaces:

- `image.local_adjust`: live brightness, contrast, and saturation preview.
- `image.local_crop`: aspect presets, directly resizable crop handles, drag or
  keyboard positioning, exact output dimensions, and Canvas 2D crop output.
- `image.local_resize`: aspect-preserving percentage or pixel sizing, explicit
  upscale control, and PNG, JPEG, or WebP output.
- `image.annotation_edit`: mark an image with numbered points, arrows, freehand
  lines, region brushes, rectangles, or ellipses; attach per-mark or global
  instructions; and request one to four clean edited candidates.
- `image.outpaint`: choose a target ratio and expansion, drag or anchor the
  natural-size source inside the target, and request one to four expanded
  candidates while preserving the original source pixels exactly.

`image.masked_edit` remains a typed compatibility contract for workflows that
already supply an exact external mask; Image Studio no longer exposes mask
authoring or masked-edit UI. Guided Image now binds the Core `image.generate`
Capability with exact `source_image`, ordered `references`, and `prompt` Slots;
Image Studio no longer declares a duplicate `image.guided_edit` Capability or
manual panel.

All processors create a new result asset and block through the Retake Host
API, leaving the source image unchanged.

Image Studio uses the public Retake Command, Surface, Translator, Theme, and
Settings facades. The workspace-level default resize format is a typed Plugin
setting; locale and Theme changes flow from the Host without Plugin-specific
Core access.

The same single Retake Package also contributes the Guided Image Skill,
manual-review Workflow, and bounded Guided Image Operator AgentPreset. Guided
Image is a workflow entrypoint into Image Studio, not a second Plugin or a
separately installed product.

Retake Whiteboard remains responsible for canvas state, assets, executions,
history, package lifecycle, trust, fallback UI, and persistence. This
repository owns the image-specific capability, action, panel, preview,
parameters, and browser processor.

The portable, single Retake Package source lives in [`plugin/`](./plugin). Keeping the
package boundary in its own directory lets the local Package Manager validate
only declared files while repository-level tests and authoring dependencies
stay outside the distributed artifact.

## Install

In Retake Whiteboard 0.1.3 or later, open **Settings → Plugin library**.
To follow the latest stable release and receive update notifications, install:

```text
github:retake-tools/image-studio@main#subdirectory=plugin
```

For an immutable, reproducible install, use the current release tag:

```text
github:retake-tools/image-studio@v0.11.0#subdirectory=plugin
```

Retake resolves either Git source, runs its controlled
`retake_web_plugin_v1` build, caches the portable Package, and asks the user to
review permissions and trust that exact code digest before enabling it.

`main` is the moving stable update channel. The version tag remains fixed and
does not move.

No CLI or local bridge is required. Browser-native processing stays in the
Plugin; connected AI editing uses Retake's existing Codex App Server or manual
Codex/MCP route without exposing credentials or local paths to Plugin code.

See the [installation and lifecycle guide](./docs/install.md) for updates,
rollback, disable, safe mode, and removal behavior.

## Documentation

- [Install and manage Image Studio](./docs/install.md)
- [Package layout and authoring boundaries](./docs/authoring.md)
- [Masked AI editing](./docs/masked-edit.md)
- [Annotation editing](./docs/annotation.md)
- [AI image expand](./docs/outpaint.md)
- [Release process and checklist](./docs/releasing.md)
- [Contributing](./CONTRIBUTING.md)

## Develop and verify

Canonical development, CI, and release checks use Node.js 24.18.0. Node.js
22.12 or later remains a supported compatibility runtime. Node.js 26 is
experimental until it reaches LTS and Retake's Package archive codec is
runtime-independent.

```bash
npm ci
npm run validate
npm run typecheck
npm test
npm run release:check
```

The controlled Package build is owned by the Retake Package toolchain and is
also exercised by the Whiteboard integration workflow before release.

The current `develop` branch is an integration candidate. A public version tag
or GitHub release is created only after the verified `develop` state is
explicitly approved for promotion to `main`.

## License

Retake Image Studio is available under the
[Apache License 2.0](./LICENSE). Required attribution notices are provided in
[NOTICE](./NOTICE).
