# Visit Buddy

A voice-first web app that helps you get ready for a doctor visit and understand it
afterward. You say what worries you before the visit and what the doctor said after it;
Visit Buddy turns that into questions, a plain-language summary, a to-do list and a
medicine schedule.

**Visit Buddy organizes what you tell it. It does not give medical advice.** It never
picks or changes a medicine or dose, and it never says anything is safe.

This is **Phase 3**: the AI is not connected. Every AI call goes through one mock
service that can return success, a slow response, an uncertain result, an empty result
and several errors, so every AI state can be built and tested. Phase 4 replaces the mock
with real Gemini calls behind the server — see [Phase 4](#phase-4).

## Install and run

You need Node.js 20.19 or newer.

```bash
npm run install:all   # installs the root and the client
npm run dev           # starts the client at http://localhost:5173
```

The server (port 3001) is added in stage 6; until then `npm run dev` starts the client
only.

## URL parameters

| Parameter | What it does |
|---|---|
| `?ai=success` | AI returns normally after about 2.5 seconds |
| `?ai=slow` | AI takes about 14 seconds |
| `?ai=uncertain` | AI result with unsure lines flagged |
| `?ai=empty` | AI returns nothing usable |
| `?ai=error` | AI is unavailable |
| `?ai=timeout` | AI gives up after 10 seconds |
| `?ai=ratelimit` | Too many requests |
| `?testing=1` | Small test panel in the corner, for usability sessions |

The `?ai=` value wins over the mode chosen in Settings.

## Folder layout

```
visit-buddy/
  package.json              root scripts (dev, install:all)
  client/                   the React app (Vite + Tailwind + React Router)
    index.html              loads the fonts and the app
    vite.config.js          dev server on 5173, proxies /api to 3001
    tailwind.config.js      maps Tailwind names to the design tokens
    src/
      main.jsx              mounts the app inside the router
      App.jsx               the routes
      styles/tokens.css     every colour, size, space and radius (single source of truth)
      styles/index.css      base styles, text sizes, focus ring, container
      pages/                one file per screen
  server/                   the Express API (stage 6) and .env.example
```

## Design tokens

All colour, type, spacing and shape values live in
`client/src/styles/tokens.css` and are exposed to Tailwind in
`client/tailwind.config.js`. Components use the Tailwind names (`bg-surface`,
`text-hero`, `border-line`) and never hard-code a value.

- Text is based on 20px, not 16px. The Text size control multiplies that by 1, 1.2
  or 1.4.
- Spacing uses the 4 / 8 / 16 / 24 / 32 scale, which in Tailwind is `1`, `2`, `4`,
  `6` and `8`. Those five classes are remapped to exact pixels in
  `tailwind.config.js`, because the 20px root font would otherwise turn `p-4` into
  20px instead of 16px.
- Between whole sections, `.vb-section` uses `--vb-section-gap`, a multiple of the
  32px step, so page rhythm scales with the viewport but stays on the grid.
- There is one `LANDING ONLY` group of two tokens (an editorial display size and one
  lime closing block). They let the public Landing page borrow the layout rhythm of
  the Mission Control visual reference while the app screens stay on the calm
  palette the brief requires.

## The mock AI service

`client/src/services/aiService.js` (stage 3) is the only file allowed to produce AI
results. Components never import sample data directly. It exports `buildQuestions`,
`transcribe`, `summarizeVisit`, `flagUncertain` and `askAboutVisit`, and it honours an
`AbortSignal`. Every returned line carries a `quote` copied word for word from the
user's input.

## Phase 4

Replace `aiService.js` with real calls to `server/routes/ai.js`, which holds the only
place a Gemini key is read (from `.env`). No key is ever in the client, and none is in
this repo.

## Stage plan

| Stage | Status |
|---|---|
| 1. Scaffold, tokens, fonts, routing | done |
| 2. Base components, Landing, Help | done |
| 3. Mock AI service, AIShell, TestPanel | next |
| 4. Before-a-visit flow | |
| 5. After-a-visit flow | |
| 6. Backend and connected screens | |
| 7. Accessibility pass, README, test script | |
