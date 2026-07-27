# Retake Image Studio

[简体中文](./README.zh-CN.md)

Image Studio is the official Retake plugin for deep, workflow-native image
editing on the infinite canvas.

The current package provides two browser-native capabilities:

- `image.local_adjust`: live brightness, contrast, and saturation preview.
- `image.local_crop`: aspect presets, crop-size control, drag or keyboard
  positioning, exact output dimensions, and Canvas 2D crop output.

Both processors create a new result asset and block through the Retake Host
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

No CLI or local bridge is required for this browser-native capability. Retake
asks for code trust and the three declared, bound-resource permissions before
the PluginModule can be enabled.

See the [installation and lifecycle guide](./docs/install.md) for updates,
rollback, disable, safe mode, and removal behavior.

## Documentation

- [Install and manage Image Studio](./docs/install.md)
- [Package layout and authoring boundaries](./docs/authoring.md)
- [Release process and checklist](./docs/releasing.md)
- [Contributing](./CONTRIBUTING.md)

## Develop and verify

Requires Node.js 22 or later.

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
