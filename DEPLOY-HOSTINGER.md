# Deploying BrightSunSEO on Hostinger (Node.js Web App)

Not static export: this site has server features (blog admin, API routes, contact form), so it must run as a Node.js app.

## Hostinger settings
- Framework: Next.js (or "Other" Node.js app), Node.js 20.9+ (22 recommended)
- Install: `npm install`
- Build command: `npm run build`
- Start command: `npm start` (listens on Hostinger's `PORT` automatically)
- Output/entry: leave default (no `output: export`)

## Environment variables (set BEFORE the build)
See `.env.example`. Required: `NEXT_PUBLIC_SITE_URL`, `ADMIN_PASSWORD`. Set `ALLOW_INDEXING=true` only at launch, then rebuild.

## Keep blog data safe
Posts, blog pictures and enquiries are saved as files. Set `DATA_DIR` to a folder outside the app folder (e.g. `/home/<user>/brightsun-data`) so redeploys never erase them. Back it up regularly.

## Before launch
- Build needs internet (Google Fonts download) and enough memory; if the build is killed, set `NODE_OPTIONS=--max-old-space-size=2048`.
- Mario-style sound files in `public/sounds` belong to Nintendo; replace with licensed/original sounds before going public.
- Case-study logos/previews load from third-party sites.
