# Playground gallery — how it works

The gallery is **manifest-driven**. `gallery.html` reads `manifest.json` and renders
the same images two ways: a draggable **cloud** on desktop, a **masonry grid** on mobile.
It never hard-codes image paths, so *where* the images live is a one-file decision.

## Folder layout

```
lab/
  gallery.html            ← the page (served at /lab/gallery)
  gallery/
    images/               ← your image files live here
      demo-01.jpg …       ← delete these placeholders once you add real work
    manifest.json         ← generated list the page reads
    build-gallery.mjs     ← regenerates the manifest from images/
    README.md             ← this file
```

## Adding / removing images (the whole workflow)

1. Optimise your images first (keep them web-sized — e.g. ≤1600px on the long edge,
   compressed). Free tools: squoosh.app or tinypng.com.
2. Drop them into `lab/gallery/images/`.
3. Regenerate the manifest:
   ```
   node lab/gallery/build-gallery.mjs
   ```
   It preserves any titles/tags you've already set and appends new files.
4. (Optional) open `manifest.json` and set nicer `title`, `year`, and `tags` per image.
5. Commit + push. Done.

A manifest entry looks like:
```json
{ "src": "/lab/gallery/images/aurora.jpg", "title": "Aurora", "year": 2025, "tags": ["study","light"] }
```
`src` is a normal URL — see "storage options" below.

## Storage options (in order of simplest → most scalable)

**1. In the repo (current setup) — free, zero config.**
Images sit in `images/` and GitHub Pages serves them. Best for a personal gallery.
Keep the repo lean by optimising images before committing.

**2. Same images, served via jsDelivr CDN — still free.**
jsDelivr serves any public GitHub file CDN-cached. Set the prefix in `build-gallery.mjs`:
```js
const SRC_PREFIX = "https://cdn.jsdelivr.net/gh/<user>/<repo>@main/lab/gallery/images/";
```
Re-run the script; the manifest now points at the CDN. Saves Pages bandwidth, faster global loads.

**3. Cloudinary / Cloudflare Images free tier — auto-resize & transforms.**
Upload there, then put the delivered URLs straight into `manifest.json` (skip the script or
adjust the prefix). Use if the gallery grows large or you want automatic responsive sizes.

Because the page only cares about the `src` URLs in the manifest, you can switch between
these at any time **without touching `gallery.html`.**

## Notes
- `manifest.json` must be served over http(s) — the page fetches it, so it won't work from
  a `file://` open. Use `netlify dev`, `npx serve`, or just push to Pages.
- Image dimensions are read at load time, so you don't need to record width/height anywhere.
