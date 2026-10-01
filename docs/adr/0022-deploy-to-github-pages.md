# 0022 - Deploy to GitHub Pages

**Date**: 2026-10-01
**Status**: Accepted

## Context
The prototype is functionally complete, hardened, designed and polished. We need a public, shareable URL, and all user data stays local in the browser.

## Decision
Deploy via GitHub Actions to Pages at https://marekbrze.github.io/workflowy-bullet/ (project pages, Vite `base: '/workflowy-bullet/'`, router `basename` from `BASE_URL`). The workflow runs on every push to `main`, uses `npm ci` (so `package-lock.json` is tracked), copies `index.html` to `404.html` so deep links survive a refresh, and deploys with `actions/deploy-pages`. Pages is enabled with the Actions build type and the repository homepage is set. Production scenario locked to `empty`: a first-time visitor sees the connect screen, and `DevToolbar` and the scenario switcher are gated by `import.meta.env.PROD` (the component is removed from the production bundle). Manual fallback via the `gh-pages` CLI on `npm run deploy:manual` (it needs Settings → Pages → Source switched to "Deploy from a branch").
Checked on the production build: `npm ci --dry-run` succeeds, `vite preview` serves `/`, `/connection` and `/review-session/yesterday` under the base path, every asset referenced by `index.html` loads, and `DevToolbar` is absent from the bundle. The deployed site itself was not opened, because nothing has been pushed yet.

## Impact
Every push to `main` redeploys. The app stores everything under namespaced `wfb:` keys in the visitor's own browser, so it does not collide with other sites on `marekbrze.github.io`. API calls to WorkFlowy are still mocked: the deployed prototype demonstrates the flows with local data (switch scenarios in a development build) and does not talk to WorkFlowy.
