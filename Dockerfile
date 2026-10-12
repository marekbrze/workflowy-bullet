# syntax=docker/dockerfile:1
# ==================================================================
# Build stage — compile the Vite SPA to static files in /app/dist
# ==================================================================
FROM node:lts-alpine AS build
WORKDIR /app

# Playwright + Storybook browser tests are devDependencies and are never needed
# to build — skip the browser download during `npm ci`.
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1
ENV CI=true

# Install deps against the lockfile first so this layer caches on manifest changes only.
COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm npm ci

COPY . .
# `npm run build` = `tsc && vite build` → static output in dist/
# version.txt carries the commit SHA so the deploy workflow can confirm the new image is live.
ARG GIT_SHA=dev
RUN npm run build && echo "$GIT_SHA" > dist/version.txt

# ==================================================================
# Runtime stage — nginx serves dist/ with SPA history fallback and
# proxies /api/workflowy/* to WorkFlowy (nginx.conf is an envsubst template)
# ==================================================================
FROM nginx:1.27-alpine AS runtime
COPY nginx.conf /etc/nginx/templates/default.conf.template
ENV NGINX_ENTRYPOINT_LOCAL_RESOLVERS=1
COPY --from=build /app/dist /usr/share/nginx/html

# CapRover routes to container port 80 by default.
EXPOSE 80
