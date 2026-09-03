# Pixel Tech Web (Next.js)

Next.js App Router storefront for Pixel Tech.

## Run locally

**Prerequisites:** Node.js 20+, Pixel Tech API on **8081**

```bash
cp .env.example .env.local   # optional GEMINI_API_KEY for Smart Bundles
npm install
npm run dev
```

App: [http://127.0.0.1:3000](http://127.0.0.1:3000)  
API proxy: `/api/*` → `http://127.0.0.1:8081` (except `/api/recipes`)

Admin: `/admin` — demo password `pixel-admin`

| App | Port |
|-----|------|
| Pixel Tech web | 3000 |
| Pixel Tech API | 8081 |

## Stack

- Next.js 16 (App Router) + React 19
- Tailwind CSS 4
- Motion, Lucide, Recharts
- Gemini recipes via `app/api/recipes`
