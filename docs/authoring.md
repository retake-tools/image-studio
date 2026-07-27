# Package layout and authoring boundaries

Image Studio is both a public GitHub repository and a Retake Root Package. The
two boundaries are related but not identical.

## Repository layout

```text
image-studio/
├── plugin/                     Portable Retake Package source
│   ├── definitions/            Capability and parameter contracts
│   ├── src/                    Trusted Web PluginModule source
│   ├── retake.package.json     Root Package manifest
│   └── retake.plugin.json      PluginModule manifest
├── test/                       Repository-level tests
├── scripts/                    Validation and release checks
└── docs/                       Public authoring and lifecycle docs
```

Only files listed by `plugin/retake.package.json` are eligible for the
Materialized Package. Tests, local dependencies, Git metadata, and repository
automation are not distributed.

## Ownership boundary

Image Studio owns:

- image-specific Capabilities and parameter schemas;
- toolbar Actions and native React Panels;
- local preview state;
- Canvas 2D, WebGL, Worker, or WASM processors when a real feature needs them.

Retake Whiteboard owns:

- Canvas, Block, Edge, AssetStore, ExecutionRecord, and History mutation;
- Package install, trust, enable, disable, rollback, and removal;
- persistence and generic fallback projections.

Plugin code must use the public Retake Host API. Do not import Whiteboard source
files, private stores, or local workspace paths. Capability output must be
returned through `host.execution.run`.

Direct React state, DOM interaction, Canvas 2D, and local preview do not require
new Host services. Add a Host API only when a capability needs Retake-owned
state or an atomic Retake mutation that cannot remain inside the PluginModule.

The first P10 capability, `image.local_crop`, follows this rule: its aspect
selection, normalized crop region, pointer interaction, preview, and Canvas 2D
processor stay inside Image Studio, while its result uses the same atomic
`host.execution.run` projection as `image.local_adjust`.

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
`@retake/plugin-api`.

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
