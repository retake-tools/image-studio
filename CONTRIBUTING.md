# Contributing

Thank you for improving Retake Image Studio.

## Branch and pull request flow

- Start from the latest `develop`.
- Use a dedicated `codex/*` or descriptive contributor feature branch.
- Open pull requests against `develop`.
- Keep `main` reserved for explicitly approved public releases.
- Delete local and remote feature branches after merge.

Keep each pull request focused on one coherent image capability, runtime
boundary, or authoring improvement. New Host abstractions need a concrete Image
Studio requirement and must preserve the ownership rules in
[docs/authoring.md](./docs/authoring.md).

## Required checks

```bash
npm ci
npm run validate
npm run typecheck
npm test
npm run release:check
```

Changes to a runtime capability also require an exact-commit controlled build
and a disposable Retake Whiteboard lifecycle test before merge.

Do not commit generated build output, local Retake workspaces, credentials,
provider tokens, or machine-specific paths.
