# Pixel Tech Web (Next.js)

Next.js App Router storefront for Pixel Tech.

## Setup

```bash
cp .env.example .env
# Edit .env — set API_PROXY_TARGET + optional GEMINI_API_KEY
npm install
npm run dev
```

Use **only** `.env` (not `.env.local`). `.env` is gitignored.

App: [http://127.0.0.1:3000](http://127.0.0.1:3000)  
API proxy: `/api/*` → `API_PROXY_TARGET` (except local `/api/recipes`)

Admin: `/admin`

## Environment

| Variable | Purpose |
|----------|---------|
| `API_PROXY_TARGET` | Cloud Run / Spring origin (no `/api` suffix) |
| `GEMINI_API_KEY` | Optional Smart Bundles |

Production (Vercel): set the **same** keys in the Vercel project env, then redeploy.

Live site: https://pixel-tech-mm.vercel.app  
API: https://pixel-tech-api-389277809553.asia-southeast1.run.app

## Stack

- Next.js 16 (App Router) + React 19
- Tailwind CSS 4
- Motion, Lucide, Recharts
- Gemini recipes via `app/api/recipes`
