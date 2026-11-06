# inodbandara.lk

Personal site of Inod Bandara. Plain static HTML, CSS and JavaScript — no build step, no dependencies. Hosted on GitHub Pages at [inodbandara.lk](https://inodbandara.lk).

## Project structure

```
index.html          Home page
about.html          About
experience.html     Experience
work.html           Work overview
work/               Individual case studies
lab/                Lab experiments and write-ups
impact.html, stack.html, project.html, contact.html, 404.html
styles.css          All styles
app.js              All client-side behaviour
boot.js             Runs in <head> before first paint: theme, colour hue, intro/transition flags
me.jpg, favicon.ico Images
CNAME               Custom domain for GitHub Pages
```

## Run locally

Pages load assets with root-relative paths (`/styles.css`, `/app.js`) and link to each other with clean URLs (`/about`, `/work`), so opening `index.html` directly from disk (`file://`) will not work. Serve the folder over HTTP from the repo root instead.

**Node.js (recommended)** — `serve` maps `/about` to `about.html`, same as GitHub Pages:

```bash
npx serve .
```

**Python 3** — works for viewing a single page, but nav links like `/about` return 404 because Python's server does not do clean URLs (open `/about.html` by hand instead):

```bash
python -m http.server 8000
```

**VS Code**

Install the *Live Server* extension, open `index.html`, click **Go Live** (same clean-URL caveat as Python).

Then open the address the tool prints (`serve` defaults to <http://localhost:3000>, Python to <http://localhost:8000>).

Stop the server with `Ctrl+C`.

## Deploy

GitHub Pages serves the site straight from the repository. Commit and push to the publishing branch; changes go live after Pages rebuilds (usually under a minute).
