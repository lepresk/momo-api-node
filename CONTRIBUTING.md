# Contributing

Contributions are welcome. This document covers the basics to get started.

## Prerequisites

- Node.js 22 or later
- pnpm

## Setup

```bash
git clone https://github.com/lepresk/momo-api-node.git
cd momo-api-node
pnpm install
```

## Running tests

```bash
pnpm test
```

Tests use [Vitest](https://vitest.dev) with a mocked `fetch`. No real API calls are made. If you add a new method, add a corresponding test in `tests/` with a fixture in `tests/fixtures/`.

## Submitting changes

1. Fork the repository
2. Create a branch from `main`: `git checkout -b feat/your-feature`
3. Make your changes and add tests
4. Ensure `pnpm build` and `pnpm test` both pass
5. Open a pull request with a clear description of what you changed and why

## Commit style

Use [Conventional Commits](https://www.conventionalcommits.org):

```
feat: add remittance support
fix: handle 409 conflict on duplicate reference ID
docs: update collection usage example
test: add disbursement refund status test
```

## Reporting issues

Open an issue on [GitHub](https://github.com/lepresk/momo-api-node/issues) with:
- the version you are using
- a minimal reproduction
- the expected vs actual behavior

## Publishing

Releases go out automatically: push a `v*` tag and `.github/workflows/publish.yml`
builds, tests, verifies the packed tarball, and publishes to npm.

```bash
# package.json must already carry the new version — the workflow refuses a
# tag that disagrees with it
git tag -a v2.2.0 -m "v2.2.0"
git push origin v2.2.0
```

Authentication is [npm trusted publishing](https://docs.npmjs.com/trusted-publishers)
over OIDC, so there is no `NPM_TOKEN` secret in this repository — nothing to leak
or rotate. It needs a one-time setup on npmjs.com, under the package's
**Settings → Trusted publisher**:

| Field | Value |
|-------|-------|
| Publisher | GitHub Actions |
| Repository | `lepresk/momo-api-node` |
| Workflow filename | `publish.yml` |
| Environment | *(leave empty)* |

Until that is configured, the publish step fails with an authentication error
and nothing is released; the tag and GitHub release are unaffected.

To publish by hand instead:

```bash
npm login
pnpm verify:pack          # installs the real tarball and imports it
npm publish --access public
```
