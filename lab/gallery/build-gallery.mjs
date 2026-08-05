#!/usr/bin/env node
/* -----------------------------------------------------------------------------
   build-gallery.mjs — regenerates manifest.json from the images/ folder.

   Usage (from anywhere):   node lab/gallery/build-gallery.mjs

   What it does:
   - scans ./images next to this script for image files
   - writes ./manifest.json
   - PRESERVES any title / year / tags you've already set for existing images,
     and keeps their order; brand-new files are appended at the end.

   So your workflow to add art is just:
     1. drop optimised images into lab/gallery/images/
     2. run:  node lab/gallery/build-gallery.mjs
     3. (optional) open manifest.json and tweak titles/years/tags
     4. commit + push

   No dependencies. Runs on any Node 14+.
----------------------------------------------------------------------------- */
import { readdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const HERE = dirname(fileURLToPath(import.meta.url));
const IMAGES_DIR = join(HERE, "images");
const MANIFEST = join(HERE, "manifest.json");

/* Public URL prefix for images. Change this if you move the folder or later
   point at a CDN (e.g. "https://cdn.jsdelivr.net/gh/user/repo@main/lab/gallery/images/"). */
const SRC_PREFIX = "/lab/gallery/images/";

const IMG_RE = /\.(jpe?g|png|webp|gif|avif)$/i;

function prettifyTitle(file) {
  return file
    .replace(IMG_RE, "")
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}

// 1. load existing manifest (to preserve metadata + order)
let existing = [];
if (existsSync(MANIFEST)) {
  try { existing = JSON.parse(readFileSync(MANIFEST, "utf8")).items || []; }
  catch { console.warn("! manifest.json was unreadable — starting fresh"); }
}
const byFile = new Map(existing.map((it) => [it.src.split("/").pop(), it]));

// 2. scan images folder
if (!existsSync(IMAGES_DIR)) {
  console.error("✗ no images/ folder found at", IMAGES_DIR);
  process.exit(1);
}
const files = readdirSync(IMAGES_DIR).filter((f) => IMG_RE.test(f));

// 3. keep existing order for files still present, then append new ones (sorted)
const present = new Set(files);
const kept = existing.filter((it) => present.has(it.src.split("/").pop()));
const keptFiles = new Set(kept.map((it) => it.src.split("/").pop()));
const added = files.filter((f) => !keptFiles.has(f)).sort();

const items = [
  ...kept,
  ...added.map((file) => ({
    src: SRC_PREFIX + file,
    title: prettifyTitle(file),
    year: new Date().getFullYear(),
    tags: [],
  })),
];

// 4. write it out
const out = {
  generated: new Date().toISOString(),
  count: items.length,
  items,
};
writeFileSync(MANIFEST, JSON.stringify(out, null, 2) + "\n");
console.log(`✓ manifest.json written — ${items.length} images (${added.length} new)`);
if (added.length) console.log("  new:", added.join(", "));
