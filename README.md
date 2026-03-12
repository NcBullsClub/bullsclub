# NC Bulls Cricket Club Website

Official website for **NC Bulls Cricket Club** — home of the **Raising Bulls** and **Royal Bulls**.

## Tech Stack
- **React + Vite** — fast modern frontend
- **Tailwind CSS** — Blue (#1a3a6b) & Yellow (#f5c518) theme
- **React Router v7** with HashRouter (GitHub Pages compatible)
- **Framer Motion** — page & section animations
- **Formspree** — contact form (no backend needed)
- **gh-pages** — one-command deployment

## Pages
| Route | Page |
|---|---|
| / | Home — hero, stats, fixtures strip, results, news |
| /about | About — club story, values, timeline |
| /teams | Teams — Raising Bulls / Royal Bulls tabbed view |
| /players | Players — filterable roster grid |
| /fixtures | Fixtures — upcoming matches |
| /results | Results — match scorecards with MoM |
| /gallery | Gallery — photo grid with lightbox |
| /news | News — articles list |
| /news/:slug | Article — single article detail |
| /contact | Contact / Join Us — Formspree form |
| /sponsors | Sponsors — tier-sorted sponsor grid |

## Development

```bash
npm install
npm run dev
```

## Data
All data lives in src/data/ as static JSON files.
Replace placeholder values with real player/match data.

## Setup Formspree (Contact Form)
1. Create free account at formspree.io
2. Copy your form ID (e.g. xyzabc12)
3. In src/pages/Contact.jsx, replace YOUR_FORM_ID

## Deploy to GitHub Pages

1. Update homepage in package.json + base in vite.config.js with your GitHub org/username
2. Run: npm run deploy

Site will be live at https://<username>.github.io/raising_website
# bullsclub
