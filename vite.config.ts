/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';
import { playwright } from '@vitest/browser-playwright';
const dirname = typeof __dirname !== 'undefined' ? __dirname : path.dirname(fileURLToPath(import.meta.url));

// Same-origin proxy to the WorkFlowy API for `npm run dev` and `npm run preview` — the production
// image does the same in nginx.conf. The browser sends the key in `X-Workflowy-Key`; it becomes
// `Authorization: Bearer …` here, and cookies / origin are dropped.
const workflowyProxy = {
  '/api/workflowy': {
    target: 'https://workflowy.com',
    changeOrigin: true,
    rewrite: (p: string) => p.replace(/^\/api\/workflowy/, '/api/v1'),
    configure: (proxy: { on: (event: string, cb: (req: { getHeader: (n: string) => unknown; setHeader: (n: string, v: string) => void; removeHeader: (n: string) => void }) => void) => void }) => {
      proxy.on('proxyReq', (req) => {
        const key = req.getHeader('x-workflowy-key')
        if (typeof key === 'string') req.setHeader('authorization', `Bearer ${key}`)
        for (const header of ['x-workflowy-key', 'origin', 'referer', 'cookie']) req.removeHeader(header)
      })
    },
  },
}

export default defineConfig({
  // Served from the root of its own domain (CapRover); set VITE_BASE to host it under a sub-path.
  base: process.env.VITE_BASE ?? '/',
  plugins: [react(), tailwindcss()],
  server: { proxy: workflowyProxy },
  preview: { proxy: workflowyProxy },
  resolve: {
    alias: {
      '@': path.resolve(dirname, 'src'),
    },
  },
  test: {
    projects: [{
      extends: true,
      plugins: [
      storybookTest({
        configDir: path.join(dirname, '.storybook')
      })],
      test: {
        name: 'storybook',
        browser: {
          enabled: true,
          headless: true,
          provider: playwright({}),
          instances: [{
            browser: 'chromium'
          }]
        }
      }
    }]
  }
});
