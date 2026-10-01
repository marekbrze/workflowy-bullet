# 0023 - Real WorkFlowy integration, hosted on CapRover

**Date**: 2026-10-01
**Status**: Accepted — supersedes 0022 (GitHub Pages)

## Context
The GitHub Pages deploy worked but showed nothing after entering a key: everything behind "WorkFlowy" was still a local mock. Making it real exposed a hard constraint: the WorkFlowy API sends no `Access-Control-Allow-Origin` (checked for the Pages origin, localhost and a foreign origin), so a browser app on a static host cannot call it. The user hosts apps on CapRover (see `newsletter-manager`).

## Decision
- Host on CapRover: an nginx image serves the SPA and proxies `/api/workflowy/*` to `https://workflowy.com/api/v1/*`, taking the user's key from an `X-Workflowy-Key` header (not `Authorization`, which CapRover Basic Auth uses). The key stays in the user's browser. Deploy by GitHub Actions → Scaleway registry → CapRover, mirroring `newsletter-manager`. The Pages workflow, `gh-pages` and the `/workflowy-bullet/` base are removed (`base` defaults to `/`).
- Real client (`workflowy-api.ts`) with typed errors (auth, network, rate limit); a Vite proxy does the same for local work.
- The tree snapshot (~3 MB) lives in IndexedDB; days, entries and destinations are derived from it (rules in `docs/WORKFLOWY.md`). Entries are re-derived on every refresh; the review queue already reconciles against changes.
- Every decision is written to WorkFlowy before it is kept locally (tags in the bullet's text, complete, copy with sub-items, mirror, delete), with exact undo. In-flight state is now real: controls wait while a write is on its way, and quick-typing on the Today list does the same.
- The mock stays as demo data (`mode: 'demo'`) for development scenarios and `VITE_MOCK_API=1`; it never writes.
- `.env` is git-ignored (it was not).

## Impact
The prototype now works against the real WorkFlowy when run through the proxy (locally or on CapRover). The user must create the CapRover app and add three repository secrets (`docs/DEPLOY.md`). Verified live: client, derivation, all writes and undos on a throwaway subtree. Not verified: the nginx image, the CI pipeline, a browser session, and calendar targeting by date.
