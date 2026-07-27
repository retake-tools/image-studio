# Release process and checklist

`develop` is the stable integration branch. `main` is the public release
branch. Ordinary feature work is never committed directly to either branch.

Promoting `develop` to `main`, creating a tag, publishing a GitHub Release, or
publishing a Registry artifact requires explicit release approval.

## Automated release-candidate checks

Run:

```bash
npm ci
npm run release:check
npm run typecheck
npm test
```

`release:check` includes Package validation and verifies:

- synchronized semantic versions across the authoring package, Root Package,
  PluginModule, and Capability definition;
- exact Package and Plugin identities;
- synchronized definition hashes;
- required public documentation and repository policy files;
- immutable Git install documentation using `#subdirectory=plugin`;
- absence of private Whiteboard imports and machine-specific paths in portable
  Plugin source.

## Retake integration checks

Use the exact candidate commit:

```text
github:retake-tools/image-studio@<full-commit-id>#subdirectory=plugin
```

Verify in a disposable Retake Workspace:

- controlled build succeeds with the pinned `retake_web_plugin_v1` toolchain;
- install does not enable the PluginModule automatically;
- permission review, code trust, enable, disable, safe mode, and reload work;
- update and cached rollback preserve exact source identity;
- **Adjust image** creates one Operation, one Result Image, one succeeded
  Execution, and one output Asset while leaving the source unchanged;
- missing or disabled Image Studio removes the action but preserves historical
  Operation, Execution, Result, Asset, and History projections;
- the browser console has no warnings or errors during the lifecycle.

## Version promotion

1. Choose the next semantic version.
2. Update all synchronized version fields.
3. Update definition hashes for any changed public contracts.
4. Run the automated and Retake integration checks.
5. Merge the verified feature PR into `develop`.
6. Record the exact `develop` commit and verification evidence.
7. Obtain explicit approval to release the complete scope.
8. Merge the verified `develop` state into `main`.
9. Create an annotated `v<version>` tag from the exact release commit.
10. Publish release notes and, when the public Registry path exists, publish
    the accepted deterministic artifact derived from that exact source.

Do not create a tag from a moving branch, claim a Registry publication before
the Registry entry exists, or rebuild a different source tree for the release.
