# Pixel Tech Web — Vercel

Use a single env file locally: **`.env`** (never `.env.local`).

```bash
cp .env.example .env
```

On Vercel → **Settings → Environment Variables**, set:

| Name | Value |
|------|--------|
| `API_PROXY_TARGET` | `https://pixel-tech-api-389277809553.asia-southeast1.run.app` |

AI features call the backend; set `GEMINI_API_KEY` on Cloud Run, not Vercel.

Then redeploy.

See also [`../DEPLOY.md`](../DEPLOY.md).
