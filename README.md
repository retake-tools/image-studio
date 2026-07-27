# Retake Image Studio

Image Studio is the official Retake plugin for deep, workflow-native image
editing on the infinite canvas.

The first vertical slice provides `image.local_adjust`: a native React panel
with live brightness, contrast, and saturation preview plus a local Canvas 2D
processor. The processor creates a new result asset and block through the
Retake Host API, leaving the source image unchanged.

Retake Whiteboard remains responsible for canvas state, assets, executions,
history, package lifecycle, trust, fallback UI, and persistence. This
repository owns the image-specific capability, action, panel, preview,
parameters, and browser processor.

The portable Retake Package source lives in [`plugin/`](./plugin). Keeping the
package boundary in its own directory lets the local Package Manager validate
only declared files while repository-level tests and authoring dependencies
stay outside the distributed artifact.

## Install from GitHub

In Retake Whiteboard, open **Settings → Plugin library** and install:

```text
github:retake-tools/image-studio@<commit-or-tag>#subdirectory=plugin
```

Retake resolves the Git source, runs its controlled
`retake_web_plugin_v1` build, caches the portable Package, and asks the user to
review permissions and trust that exact code digest before enabling it.

Using a full commit ID gives a reproducible install. A branch or version tag
can be used when following updates intentionally.

## Develop

Requires Node.js 22 or later.

```bash
npm ci
npm run validate
npm run typecheck
npm test
```

The controlled Package build is owned by the Retake Package toolchain and is
also exercised by the Whiteboard integration workflow before release.
