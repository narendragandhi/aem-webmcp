# Playwright browser tests

The Playwright suite is the supported browser-test runner for AEM WebMCP. It
covers the WebMCP API, agents, forms, commerce, navigation, layout,
accessibility, security, and performance suites. `tests/cypress-parity.spec.ts`
contains the smoke, console-error, responsive, metrics, and visual checks
migrated from `ui.tests/test-module/cypress/e2e`.

Run the parity checks against a running AEM author instance:

```sh
npm ci
npx playwright install --with-deps chromium
npx playwright test tests/cypress-parity.spec.ts --project=chromium
```

The repository CI contract validates installation and test discovery. A full
browser pass requires AEM author and publish URLs; run it through the Docker
Compose test profile or deployment CI with those services available.

Set `AEM_AUTHOR_URL` for a non-local author. Set `AEM_PUBLISH_URL` when the
publish console-error check should target a separate publish instance.

Visual baselines are Playwright snapshots. Create or intentionally update
them with:

```sh
npx playwright test tests/cypress-parity.spec.ts --project=chromium --update-snapshots
```

Review snapshot diffs in `tests/cypress-parity.spec.ts-snapshots/` before
committing them. The Cypress suite remains in the repository until these
parity checks pass in CI and the snapshot baselines have been reviewed.
