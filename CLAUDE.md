# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Edwin's photography portfolio — a static multi-page website built with Vite, Tailwind CSS, Flowbite, and vanilla JavaScript. Collection metadata is stored in Firebase Firestore and fetched at runtime. Photos are stored directly in the GitHub repo (`/public/assets/`) and served via jsDelivr CDN.

## Commands

```bash
npm run dev       # Start Vite dev server (public site at :5173, admin at :5173/admin/)
npm run build     # Build for production (outputs to /dist)
npm run preview   # Preview the production build locally
npm run migrate   # One-time migration: seed Firestore from existing /public/assets/
```

## Architecture

### Pages
Three Vite entry points (`vite.config.js`):
- `index.html` — Home page (hero + photography journey)
- `second.html` — Photo gallery/collections page
- `admin/index.html` — Admin panel (login-protected, served at `/admin/`)

### Data Flow
**Public site**: `grid.js` → Firestore (`collections` + `collections/{id}/photos`) → jsDelivr CDN URLs for images  
**Admin**: `admin/admin.js` → Firebase Auth login → GitHub REST API (commits photos to repo) + Firestore (metadata)

### Source (`/src`)
- `main.js` — Entry point; imports styles, flowbite, grid.js
- `styles.css` — Tailwind base imports and custom scrollbar styles
- `js/firebase.js` — Firebase init; exports `db` and `auth`. **Fill in config values before running.**
- `js/grid.js` — Fetches collections from Firestore, renders photo grid and collection detail. URL param `?collection={firestoreDocId}` drives routing.
- `js/photos.js` — Legacy file (unused, kept as reference)

### Admin (`/admin`)
- `index.html` — Four-view SPA: login, settings (GitHub PAT), dashboard, collection detail
- `admin.js` — Firebase Auth, collection/photo CRUD via Firestore, photo upload/delete via GitHub REST API

### Photo Storage
Photos live in `/public/assets/{collectionId}/{filename}`. The admin commits new files there via the GitHub REST API. Images are served via:
- `https://cdn.jsdelivr.net/gh/{owner}/{repo}@{branch}/public/assets/...` (CDN, ~12h cache)

### Firebase Data Model (Firestore only — no Storage needed)
```
collections/{id}          title, coverUrl, photoCount, order, createdAt
collections/{id}/photos/{id}   url, filename, githubPath, order, uploadedAt
```

### Migration (`/scripts`)
`scripts/migrate.js` — Seeds Firestore from existing `/public/assets/` folders with jsDelivr URLs. Requires `scripts/serviceAccountKey.json` (gitignored) and `GITHUB_OWNER`/`GITHUB_REPO` set in the script. Run with `npm run migrate`.

### Styling
- Tailwind CSS 3.x with Flowbite plugin (loaded via `createRequire` in `tailwind.config.js`)
- Custom animations: `typewriter`, `caret`, `blink` — used for the hero text on `index.html`

## Firebase Setup (required before first run)

1. Create a Firebase project (Spark plan — free, no credit card)
2. Enable **Firestore** (production mode, Singapore region) and **Authentication** (Email/Password)
3. Create Edwin's admin account: Authentication → Users → Add user
4. Paste Firebase config into `src/js/firebase.js`
5. Set Firestore rules (Rules tab):
   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /{document=**} {
         allow read: if true;
         allow write: if request.auth != null;
       }
     }
   }
   ```
6. For migration: download service account key (Project Settings → Service Accounts) → save as `scripts/serviceAccountKey.json` → set `GITHUB_OWNER`/`GITHUB_REPO` in `scripts/migrate.js` → run `npm run migrate`

## Admin First-Time Setup (Edwin)
On first login, Edwin is shown a Settings screen where he enters:
- GitHub username, repo name, branch
- A fine-grained GitHub PAT (Contents: Read+Write on this repo)

These are saved to `localStorage` — he only needs to do this once per browser.
