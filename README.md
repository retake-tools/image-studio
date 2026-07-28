# Retake Image Studio

[简体中文](./README.zh-CN.md)

Image Studio is the official Retake plugin for deep, workflow-native image
editing on the infinite canvas.

The current package provides four browser-native capabilities and three
Retake-connected AI capabilities:

- `image.local_adjust`: live brightness, contrast, and saturation preview.
- `image.local_crop`: aspect presets, crop-size control, drag or keyboard
  positioning, exact output dimensions, and Canvas 2D crop output.
- `image.local_resize`: aspect-preserving percentage or pixel sizing, explicit
  upscale control, and PNG, JPEG, or WebP output.
- `image.local_selection_mask`: source-sized pixel mask authoring with add,
  erase, undo, redo, invert, and a provider-neutral black/white PNG output.
- `image.masked_edit`: bind one source image and one matching Selection Mask,
  then run a local-account Codex image edit through Retake's current image
  Connection.
- `image.annotation_edit`: mark an image with numbered points, arrows, freehand
  lines, region brushes, rectangles, or ellipses; attach per-mark or global
  instructions; and request one to four clean edited candidates.
- `image.outpaint`: choose a target ratio and expansion, drag or anchor the
  natural-size source inside the target, and request one to four expanded
  candidates while preserving the original source pixels exactly.

All processors create a new result asset and block through the Retake Host
API, leaving the source image unchanged.

Retake Whiteboard remains responsible for canvas state, assets, executions,
history, package lifecycle, trust, fallback UI, and persistence. This
repository owns the image-specific capability, action, panel, preview,
parameters, and browser processor.

The portable Retake Package source lives in [`plugin/`](./plugin). Keeping the
package boundary in its own directory lets the local Package Manager validate
only declared files while repository-level tests and authoring dependencies
stay outside the distributed artifact.

## Install

In Retake Whiteboard, open **Settings → Plugin library** and install:

```text
github:retake-tools/image-studio@<commit-or-tag>#subdirectory=plugin
```

Retake resolves the Git source, runs its controlled
`retake_web_plugin_v1` build, caches the portable Package, and asks the user to
review permissions and trust that exact code digest before enabling it.

Using a full commit ID gives a reproducible install. A branch or version tag
can be used when following updates intentionally.

No CLI or local bridge is required. Browser-native processing stays in the
Plugin; connected AI editing uses Retake's existing Codex App Server or manual
Codex/MCP route without exposing credentials or local paths to Plugin code.

See the [installation and lifecycle guide](./docs/install.md) for updates,
rollback, disable, safe mode, and removal behavior.

## Documentation

- [Install and manage Image Studio](./docs/install.md)
- [Package layout and authoring boundaries](./docs/authoring.md)
- [Selection Mask authoring](./docs/selection-mask.md)
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
