# BrightSunSEO – cinematic website

Next.js (App Router) · React 19 · TypeScript · Tailwind CSS v4 · GSAP · three.js (react-three-fiber).
Five pages (Home, Services, Work, About, Contact) plus a blog with a built-in editor at `/admin`.

## Run on your computer
```
npm install
npm run dev        # http://localhost:3000
npm run build      # production build
npm start          # run the production build
```
Needs Node.js 20.9 or newer.

## Settings
Copy `.env.example` to `.env.local` and fill it in. Real values are never committed to Git.

## Folder guide
```
src/app/            pages, layouts, API routes, sitemap, robots
src/components/
  layout/           header, footer, container
  navigation/       menus and menu sound
  mascot/           Sunny the sun mascot (3D character, poses, audio)
  animations/       reveal, scroll and smooth-scroll helpers
  home/ services/ work/ about/ contact/   page-specific sections
  brand/            logo and logo intro
  blog/             blog editor and lists
  ui/ sections/     shared buttons and sections
src/data/           page content, case studies, site settings
src/hooks/          reusable hooks
src/lib/            utilities (blog storage, GSAP setup)
src/_unused/        parked files with no references (kept, not deleted)
public/             images, sounds and voice files served as-is
scripts/            optional helper scripts
```

## Deploying
See `DEPLOY-HOSTINGER.md`. This is a Node.js app, not a static export.
