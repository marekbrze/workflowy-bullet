# Deploying workflowy-bullet (CapRover)

The app is a static SPA served by nginx **plus** a same-origin proxy to the WorkFlowy API. WorkFlowy sends no CORS headers (checked: no `Access-Control-Allow-Origin` for any origin), so a browser cannot call it directly — which is why a GitHub Pages deploy cannot work against the real WorkFlowy. The proxy lives in `nginx.conf`; the image is built from `Dockerfile` and deployed by `.github/workflows/deploy.yml`, the same way as `newsletter-manager`.

## One-time setup

1. **CapRover**: create an app named exactly `workflowy` (the name is `CAPROVER_APP` in the workflow). Enable HTTPS and *Force HTTPS*. Under *HTTP Settings* enable **Basic Auth** — the container is deliberately open and access control is CapRover's job, as in the other apps. Under *Deployment* enable the **app token**.
2. **CapRover registry access**: the image is private, so CapRover needs the Scaleway registry under *Cluster → Docker Registry Configuration* (`rg.pl-waw.scw.cloud`, user `nologin`, password = Scaleway secret key). Without it the deploy is accepted but the image pull fails.
3. **GitHub repository secrets** (Settings → Secrets and variables → Actions):
   - `SCALEWAY_SECRET_KEY` — Scaleway API secret key (registry `rg.pl-waw.scw.cloud/marekbrze`)
   - `CAPROVER_URL` — the CapRover URL, e.g. `https://captain.example.com`
   - `CAPROVER_APP_TOKEN` — the app token from step 1
   - `APP_BASIC_AUTH` *(optional)* — `user:password` of the app's Basic Auth, so the workflow can confirm the new version is live. Without it the check only confirms the app answers.
   - Variable `APP_URL` *(optional)* — the app's public URL if it is not `https://workflowy.<captain root domain>`.
4. Push to `main`. The workflow checks the secrets, builds `img-workflowy-bullet:<sha>` (with the SHA in `/version.txt`), pushes it to Scaleway, tells CapRover to deploy it and polls `/version.txt` until it serves the new SHA. Any failed step turns the run red.

No WorkFlowy secret goes to the server: the user pastes their API key into the app and it stays in their own browser.

## How the proxy works

- The browser calls `/api/workflowy/<path>` with the key in an **`X-Workflowy-Key`** header. It must not use `Authorization`: CapRover's Basic Auth sends that header on every same-origin request.
- nginx turns the header into `Authorization: Bearer <key>` for `https://workflowy.com/api/v1/<path>`, drops cookies, origin and referer, and answers `401` if the header is missing.
- Only these paths are reachable: `targets`, `nodes-export`, `nodes`, `nodes/<id>`, `nodes/<id>/{complete,uncomplete,move,mirror}`; methods GET, POST, DELETE. Everything else under `/api/` is a 404.
- The key is never written to nginx logs (headers are not logged) or to disk on the server.

## Local development

- `npm run dev` / `npm run preview` proxy `/api/workflowy` to WorkFlowy through Vite (same header translation), so the app talks to the real WorkFlowy locally.
- `VITE_MOCK_API=1 npm run dev` runs the connect flow on local sample data (no network); the development toolbar switches sample scenarios. The scenarios are demo data and never write to WorkFlowy.
- `.env` holds a personal key for scripts and is git-ignored. It is never read by the app.
- `VITE_BASE=/sub/path/` builds for a sub-path; the default is `/`.

## What was and was not verified

Verified against the real WorkFlowy account (read-only, plus writes confined to a throwaway subtree that was deleted afterwards): the API client, error mapping, deriving days and entries from the exported tree, and every write the app makes (tag, change type, done, roll-over with sub-items, irrelevant, mirror, delete, and each undo). The Vite proxy was tested end to end with the real key.
**Not verified**: the nginx image itself (no Docker daemon was available — the config was reviewed and its path regex tested, not run), the CapRover/Scaleway pipeline, the app in a browser, and roll-over targeting a calendar day by date (`parent_id: "YYYY-MM-DD"`), which creates calendar nodes and was therefore left to the documentation.
