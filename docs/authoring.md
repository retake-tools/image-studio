# Package layout and authoring boundaries

Image Studio is both a public GitHub repository and a Retake Root Package. The
two boundaries are related but not identical.

## Repository layout

```text
image-studio/
├── plugin/                     Portable Retake Package source
│   ├── agents/                 Guided Image AgentPreset
│   ├── definitions/            Capability and parameter contracts
│   ├── skills/                 Guided Image Skill
│   ├── src/                    Trusted Web PluginModule source
│   ├── vendor/npm/             Pinned build-time authoring artifacts
│   ├── workflows/              Guided Image Workflow
│   ├── package.json            Controlled-build dependencies
│   ├── package-lock.json       Exact dependency versions and integrity
│   ├── retake.package.json     Root Package manifest
│   └── retake.plugin.json      PluginModule manifest
├── test/                       Repository-level tests
├── scripts/                    Validation and release checks
└── docs/                       Public authoring and lifecycle docs
```

Only files listed by `plugin/retake.package.json` enter the portable source
snapshot. Retake uses the pinned npm metadata and vendored tarballs during the
controlled build, then removes those build-only files from the Materialized
Package. Tests, Git metadata, and repository automation are not distributed.

## Ownership boundary

Image Studio owns:

- image-specific Capabilities and parameter schemas;
- its image-specific Skills, Workflows, and AgentPresets;
- toolbar Actions and native React Panels;
- local preview state;
- Canvas 2D, WebGL, Worker, or WASM processors when a real feature needs them.

Retake Whiteboard owns:

- Canvas, Block, Edge, AssetStore, ExecutionRecord, and History mutation;
- Package install, trust, enable, disable, rollback, and removal;
- persistence and generic fallback projections.

Plugin code must use the public Retake Host API. Do not import Whiteboard source
files, private stores, or local workspace paths. Browser-native Capability
output must be returned through `host.execution.run`. Provider-backed
Capabilities use the narrow, Retake-owned `host.execution.runConnected`
operation boundary.

Action placement uses public Command and Surface contributions. User-facing
copy uses `defineMessages` with the Host Translator; normal panel chrome uses
public Theme tokens; behavior configuration uses typed `defineSettings`
contracts. Theme and toolbar state are not Plugin settings. The current
workspace setting, `defaultOutputFormat`, only controls the initial Resize
encoding and is read through `host.settings`.

Direct React state, DOM interaction, Canvas 2D, and local preview do not require
new Host services. Add a Host API only when a capability needs Retake-owned
state or an atomic Retake mutation that cannot remain inside the PluginModule.

The first P10 capability, `image.local_crop`, follows this rule: its aspect
selection, normalized crop region, pointer interaction, preview, and Canvas 2D
processor stay inside Image Studio, while its result uses the same atomic
`host.execution.run` projection as `image.local_adjust`.

`image.local_resize` uses the same boundary for aspect-preserving geometry and
PNG, JPEG, or WebP encoding. Retake persists the returned Data URL as a standard
Image Asset and continues to own generic download behavior.

Image Studio no longer exposes a Selection Mask authoring surface. Semantic
Annotation is the official visual AI-editing path. `image.masked_edit` remains
only as a typed compatibility contract for external workflows that already
supply a source-sized black/white mask; it has no Command or Panel contribution.
Retake still owns provider transport, Operation, Execution, Asset, Result
Block, edges, and History. See [Masked AI editing](./masked-edit.md).

`image.annotation_edit` uses the same connected boundary for semantic image
editing. The Plugin owns the six annotation tools, normalized geometry,
per-mark intent, bound draft, prompt compilation, annotated-composite
generation, Connection choice, and candidate count. Retake owns the source
Block scope, imported composite Asset, execution lifecycle, multi-result
projection, Board History, and historical Operation context. See
[Annotation editing](./annotation.md).

Guided Image is the narrow composable path for Package-authored Skills and
Workflows. The same Image Studio Package carries its Guided Image Skill,
manual-review Workflow, and bounded AgentPreset; these definitions are not a
second Package or Plugin. They bind Core `image.generate` with one exact
`source_image`, one prompt, and optional ordered `references`. Image Studio
does not declare a duplicate Capability, Command, or Panel for this path.

`image.outpaint` keeps target geometry and image preparation in the Plugin.
Image Studio builds one transparent target-size guide and one opaque black/white
mask, then sends them as typed bound Assets through the same connected
execution boundary. Retake validates the frozen geometry, owns provider
transport and durable writeback, and copies the original source pixels back
into every normalized result. No generic geometry service or additional Host
API is needed. See [AI image expand](./outpaint.md).

## Version and contract rules

The Root Package, authoring workspace, and current single PluginModule versions
move together:

- root authoring `package.json`;
- `plugin/retake.package.json`;
- `plugin/retake.plugin.json`;
- Capability definitions use their own contract versions and change only when
  that specific Capability contract changes.

Change a `definitionHash` whenever the corresponding public definition changes,
and update every manifest reference to the same hash.

Keep permissions and contribution IDs sorted. Keep
`plugin/retake.package.json.files` sorted and complete. Do not add generated
`dist/` files to the source manifest; Retake produces them through the fixed
`retake_web_plugin_v1` controlled build profile.

## Build profile

Authors do not select a build profile in the Retake UI. The Root Package
declares `retake_web_plugin_v1`, and Retake applies the matching pinned
toolchain.

Runtime dependencies intentionally remain bare imports when the Host owns their
singleton identity, including React, React DOM, JSX Runtime, and
`@retake/plugin-api`. Image Studio pins the real `@retake/plugin-api` artifact
for authoring and controlled-build type resolution; it does not carry a local
ambient declaration or a copied Host contract.

The first Image Studio slice embeds scoped CSS in the PluginModule. A dedicated
controlled-build stylesheet entry is a future Host enhancement for larger
Studio surfaces; it is not a reason to create a generic service registry.

## Local checks

```bash
npm ci
npm run validate
npm run typecheck
npm test
npm run release:check
```

Before release, also install the exact Git commit through Retake Whiteboard and
run the browser lifecycle checks described in [releasing.md](./releasing.md).
