# Example-of-Code-Coverage

[![CI](https://github.com/Zadjil-AR/Example-of-Code-Coverage/actions/workflows/ci.yml/badge.svg)](https://github.com/Zadjil-AR/Example-of-Code-Coverage/actions/workflows/ci.yml)
[![Coverage](https://img.shields.io/endpoint?url=https://raw.githubusercontent.com/Zadjil-AR/Example-of-Code-Coverage/main/.github/badges/coverage.json)](https://github.com/Zadjil-AR/Example-of-Code-Coverage/actions/workflows/ci.yml)

A simple shopping cart application used as an example for the
[code-coverage-report-action](https://github.com/Zadjil-AR/code-coverage-report-action).

---

## Application overview

The application is a plain Node.js shopping-cart library with three modules:

| Module | Description |
|---|---|
| `src/product.js` | `Product` class – id, name, price, category |
| `src/cart.js` | `Cart` class – add / remove / update items, discounts, totals |
| `src/checkout.js` | `Checkout` class – order processing, order lookup, cancellation |

## Running the tests

```bash
npm install
npm test                # run tests
npm run test:coverage   # run tests and generate coverage/clover.xml
```

Coverage is collected by [Jest](https://jestjs.io/) and reported in Clover XML
format (`coverage/clover.xml`), which is consumed by the CI workflow.

## Code coverage

Approximately **~84%** of the source code is covered by tests (statements).
The `generateReceipt` method in `src/checkout.js` is intentionally left
uncovered to demonstrate what below-100 % coverage looks like in the report.

### README badge

The **Coverage** badge at the top of this file is a
[shields.io endpoint badge](https://shields.io/badges/endpoint-badge) that
reads from `.github/badges/coverage.json`. Every push to `main` causes the CI
workflow to update that file (and commit it back) with the latest coverage
percentage. The badge therefore always reflects the current coverage on `main`.

### PR summary badge

> **TODO** – Add a badge to each pull-request summary that shows the PR's
> latest coverage result.
>
> The CI workflow already posts a full coverage report as a sticky comment on
> every pull request (via
> [marocchino/sticky-pull-request-comment](https://github.com/marocchino/sticky-pull-request-comment)).
> The comment includes a shields.io badge when the `badge: 'true'` option is
> set on the coverage action. To surface the badge directly in the PR
> *description* (rather than a comment), additional automation is needed – for
> example, a workflow step that reads `steps.code_coverage.outputs.coverage`
> and uses the GitHub API (`gh pr edit`) to prepend or update the badge URL in
> the PR body. This is left as a future improvement.

## CI workflow

The workflow (`.github/workflows/ci.yml`) runs on every push to `main` and on
every pull request targeting `main`. It uses the latest code from
[Zadjil-AR/code-coverage-report-action PR #5](https://github.com/Zadjil-AR/code-coverage-report-action/pull/5)
(branch `copilot/feat-report-line-coverage-loss`), which includes the
`track_lost_lines` feature.

---

## Full Code Coverage for Main Branch

The current code coverage on the `main` branch is **87.58%**.

### Coverage Artifacts

The CI workflow generates and uploads coverage artifacts for every workflow run. These artifacts contain detailed coverage reports that are used when comparing coverage between the base branch and pull requests.

**View coverage artifacts:**
- [Latest main branch workflow run artifacts](https://github.com/Zadjil-AR/Example-of-Code-Coverage/actions/workflows/ci.yml?query=branch%3Amain)
- Click on any completed workflow run, then scroll to the "Artifacts" section to download the `coverage-main` artifact

**How artifacts are used in PR comparisons:**
1. When a pull request is opened or updated, the CI workflow runs tests and generates coverage for the PR branch
2. The `code-coverage-report-action` (configured with `artifact_download_workflow_names: 'CI'`) automatically downloads the most recent coverage artifact from the `main` branch
3. The action compares the PR coverage against the base coverage from the artifact to determine:
   - Overall coverage percentage change (increase/decrease)
   - Specific lines that lost coverage (`track_lost_lines: 'true'`)
   - Files with coverage changes
4. A detailed comparison report is posted as a comment on the pull request, showing exactly what coverage was gained or lost
