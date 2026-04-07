# VEEV Questionnaire App

Tablet/kiosk questionnaire that recommends VEEV products and flavours based on user preferences. Built with React + Vite.

**Live URL:** https://harshiseehear.github.io/veev/

---

## Branches

- `main` — Template questionnaire (unstyled base)
- `creative` — VEEV-branded version with custom backgrounds, fonts, styling
- `gh-pages` — Auto-generated deploy branch, don't edit directly
- `deploy` — Test branch, can be deleted

---

## Tech Stack

- **React 18** — UI framework
- **Vite 5** — Dev server + build tool
- **gh-pages** — Publishes `dist/` to GitHub Pages

No router, state library, or CSS framework. Lightweight for kiosk use.

---

## Deploying

1. Checkout the branch you want to deploy (e.g. `creative`)
2. Run `npm run deploy`
3. In GitHub repo settings, Pages should deploy from `gh-pages` branch

The `base: '/veev/'` in `vite.config.js` handles the subpath.

---

## Codebase

```
src/
  App.jsx       — All logic: questions, answers, recommendations, navigation
  App.css       — All component styling, layout, animations
  index.css     — Fonts, CSS variables, colour theme
  assets/       — Background images (screen_1–6.png), warning.png, font files
```

Everything is in `App.jsx` — single-file app, no child components.

**Flow:** welcome → q1 → q2 → q3 → q4 → result

- Q1 + Q2: pick 2 options each
- Q3 + Q4: pick 1 option each
- Q1 decides the device (VEEV NOW 18mL or VEEV ONE)
- Q3 + Q4 decide the flavour via a lookup table (`RECOMMENDATIONS`)
- 30-second inactivity timer resets to welcome screen

---

## Google Sheets

Results are logged to a Google Sheet via Apps Script.

**Sheet:** https://docs.google.com/spreadsheets/d/1oA3JksQcXxkqhZEhWh0tlMXZsBb5b1y9ZKFRc41XlNI/edit

The frontend POSTs JSON to the Apps Script URL. Two event types:

**`result_reached`** — Appends a row with: flow ID, timestamp, all answers (Q1–Q4), final suggestions.

**`suggestion_clicked`** — Finds the row by flow ID and updates the "Suggestion Clicked" column.

The script lives in **Google Sheet → Extensions → Apps Script**. It reads headers from row 1 to map columns dynamically.

**To make changes:**
- Add a column: add the header in row 1, add a `set()` call in the script, add the field in the frontend POST body
- Change column names: rename in both the sheet header and the script's `set()` calls
- After editing the script: **Deploy → Manage deployments → Edit → New version → Deploy**

---

## Styling

**`index.css`** — `@font-face` for IQOS Sans and Korolev, CSS variables for colours/theme. Change `--font-display` to swap the body font.

**`App.css`** — Fixed 1080×1920 canvas scaled to viewport. Each screen is a `.panel` with absolutely positioned background images. Content positioning uses `margin-top` and `translateY()`. The welcome title font is set separately on `.welcome-title-main`.

To swap images, replace files in `src/assets/` (keep the same filenames).

---

## Kiosk Mode (Windows)

Opens fullscreen, no UI. `Alt+F4` to exit.

Settings → Accounts → Set up a kiosk → choose Edge → set the URL → Digital signage mode.
