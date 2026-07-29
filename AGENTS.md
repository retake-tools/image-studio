# AGENTS.md

This repository contains the official Retake Image Studio Root Package and its
trusted Web PluginModule.

## Architecture boundaries

- Image Studio owns image-specific capabilities, actions, panels, preview
  state, parameters, and processors.
- Retake Whiteboard owns canvas state, Block and Edge mutation, AssetStore,
  ExecutionRecord, History, package lifecycle, trust, fallback UI, and
  persistence.
- Plugin code must use the public Retake Host API. It must not import
  Whiteboard source files or depend on private Core stores.
- Capability output must be returned through `host.execution.run`; do not
  write Board, Asset, or Execution data directly.
- React state, DOM, Canvas 2D, WebGL, and local preview behavior stay inside
  the PluginModule and do not require a generic Host service.
- P9 migration is complete. Add P10 image capabilities as coherent vertical
  slices with an explicit Capability contract, pure processor tests, exact
  controlled-build verification, and disposable Whiteboard browser evidence.

## Branch workflow

Treat `main` as the public release branch and `develop` as the stable
integration branch. Start feature work from `develop` on `codex/*` branches.
Merge only complete, verified slices into `develop`; release to `main` only
after explicit user approval.

Delete local and remote feature branches after they are merged.

## Verification

Run `npm run release:check`, `npm run typecheck`, and `npm test`. Also run the
deterministic Retake controlled build and Whiteboard integration tests relevant
to the changed capability before merging.

Keep `README.md`, `README.zh-CN.md`, and the public files under `docs/` aligned
when install, authoring, version, or release behavior changes.
