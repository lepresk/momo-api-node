# Contributing

Contributions are welcome. This document covers the basics to get started.

## Prerequisites

- Node.js 18 or later
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
2. Create a branch from `master`: `git checkout -b feat/your-feature`
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
