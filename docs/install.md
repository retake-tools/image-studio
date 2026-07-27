# Install and manage Image Studio

Image Studio is installed and managed from Retake Whiteboard. The current
`image.local_adjust`, `image.local_crop`, `image.local_resize`, and
`image.local_selection_mask` run entirely in the browser. `image.masked_edit`
uses the current Retake image Connection. With Codex App Server it uses the
user's existing local Codex account/plan; the manual Codex/MCP route remains
available. Neither path requires a separate Image Studio CLI or bridge.

## Install from GitHub

1. Open **Settings → Plugin library** in Retake Whiteboard.
2. Enter this source:

   ```text
   github:retake-tools/image-studio@<commit-or-tag>#subdirectory=plugin
   ```

3. Install the Package.
4. Review the exact code digest and requested permissions.
5. Trust and enable the PluginModule.
6. Select an Image Block and choose **Adjust image**, **Crop image**,
   **Resize image**, or **Create selection mask**.
7. For **Masked AI edit**, select exactly one source Image and one same-sized
   PNG Selection Mask, then use the multi-selection toolbar.

Use a full commit ID for a reproducible install. Use a version tag only after
that tag appears in this repository. A branch name is convenient for testing
intentional updates but is not immutable.

## Why `#subdirectory=plugin`

The GitHub repository is the authoring workspace. The portable Retake Package
source is the [`plugin/`](../plugin) directory. Repository-only files such as
`.git`, CI configuration, tests, and authoring dependencies are deliberately
outside the distributed Package.

Retake handles this boundary automatically once the source string includes
`#subdirectory=plugin`; users do not need to copy or build files manually.

## Permissions and data

The PluginModule declares only:

- `retake.asset.read.bound`
- `retake.block.read.bound`
- `retake.execution.manage.self`

It can read only the Image Block and Asset bound to its action, and it can
manage only executions started through its own Capability. It cannot access
workspace paths, credentials, arbitrary Board data, or private Whiteboard
stores.

Image processing uses Canvas 2D in the current browser session. The result is
returned to Retake, which persists the standard Asset, Operation, Execution,
Result Block, edges, and History.

For connected AI editing, Image Studio sends only the owned Capability,
typed bound Block IDs, prompt, and JSON parameters through
`host.execution.runConnected`. Retake resolves and tests the Connection,
executes the provider route, and owns durable writeback. Credentials, tokens,
workspace paths, and arbitrary provider clients are not exposed to the Plugin.

## Update and rollback

- **Update** resolves the configured Git source again and shows the new exact
  code digest before trust and enablement.
- **Rollback** selects a previously cached Installation. It does not rebuild
  from an unverified moving branch.
- Existing Board data and historical results remain readable when the Package
  is updated, disabled, rolled back, or removed.

## Disable, safe mode, and remove

- **Disable** removes Image Studio actions and panels from the current runtime
  without deleting Board data.
- **Safe mode** disables native PluginModules while preserving the desired
  enabled state for later recovery.
- **Remove** removes the Package installation. It does not delete Assets,
  Blocks, Executions, or History created earlier.

When Image Studio is unavailable, Retake does not silently substitute a Core
implementation of the same editing capability. Historical Operation and Result
projections remain visible.

## Portable Package files

Registry downloads and `.retakepkg` browser-file installation will use the
same Package identity and lifecycle once those public Registry entry points are
available. They are not required for GitHub installation and are not presented
as available before the corresponding Retake product UI exists.
