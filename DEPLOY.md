# Pixel Tech Web — Vercel

See the monorepo guide: [`../DEPLOY.md`](../DEPLOY.md).

## Env

```bash
# Required in production — Cloud Run (or other) API origin, no /api suffix
API_PROXY_TARGET=https://your-api.example.com

# Optional Smart Bundles
GEMINI_API_KEY=
```

## CLI deploy

```bash
npx vercel login
npx vercel --prod
```

Root Directory in the Vercel project must be `pixel_tech_web` if the Git repo is the whole Pixel Tech folder.
