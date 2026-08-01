# Masked AI editing

`image.masked_edit@0.2.0` performs a provider-backed edit with two explicit
Image inputs:

- `source_image`: the original image;
- `inpaint_mask`: an opaque PNG with identical pixel dimensions, where white
  pixels are editable and black pixels must remain unchanged.

The prompt is an inline text input. The output is one durable `edited_image`.
The Capability supports `agent_runtime.media`, not `local_canvas`.

## Product status

Image Studio no longer exposes Selection Mask authoring or a Masked AI Edit
Command/Panel. For ordinary AI image changes, use semantic Annotation Edit.
The Capability definition remains available only to external Workflows or
Adapters that already provide a validated, source-sized mask. This avoids
keeping two overlapping visual editing paths while preserving a provider-
neutral typed boundary for specialized automation.

## Host boundary

The Plugin calls `host.execution.runConnected` with its owned Capability ID,
two typed bound Block inputs, the prompt, and JSON parameters. Retake validates
the Capability and bindings, resolves the Connection, and owns:

- provider or agent transport;
- Operation and Execution lifecycle;
- AssetStore persistence;
- Result Block, edges, and History.

The Plugin never receives a token, credential, provider client, workspace
path, or unrestricted Core service. This is a single high-level operation
boundary rather than a service registry.

The first routes are the existing local-account Codex App Server and manual
Codex/MCP flow. A separate bridge is not required for this capability.
