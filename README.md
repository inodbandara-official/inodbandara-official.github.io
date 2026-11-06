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
me.jpg, favicon.ico Images
CNAME               Custom domain for GitHub Pages
```

## Run locally

Pages load assets with root-relative paths (`/styles.css`, `/app.js`), so opening `index.html` directly from disk (`file://`) will not work. Serve the folder over HTTP from the repo root instead. Pick any one option:

**Python 3**

```bash
python -m http.server 8000
```

**Node.js**

```bash
npx serve .
# or
npx http-server -p 8000
```

**VS Code**

Install the *Live Server* extension, open `index.html`, click **Go Live**.

Then open <http://localhost:8000> (or the port the tool prints).

Stop the server with `Ctrl+C`.

## Deploy

GitHub Pages serves the site straight from the repository. Commit and push to the publishing branch; changes go live after Pages rebuilds (usually under a minute).
