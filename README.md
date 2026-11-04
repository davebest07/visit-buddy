# Visit Buddy

Visit Buddy helps you get ready for a doctor visit, and remember what happened after.

Say what worries you before you go, and it turns that into a short, ordered list of
questions to ask. Say what the doctor told you afterwards, and it turns that into a
plain-language summary, a to-do list and a medicine schedule. Every line shows the exact
words it came from, and anything unclear is marked "Not sure, ask your doctor or
pharmacist".

**It does not give medical advice.** It organizes what you tell it. It never picks or
changes a medicine or a dose, and it never says something is safe.

The AI runs on Google Gemini. The key lives on the server only and never reaches the
browser.

## Screens

- **Landing** — what the app does, how it works, and the promise it makes.
- **Home** — start a visit before or after, and see the last visit you saved.
- **Before a visit** — speak or type your worries, then edit, print or copy the questions.
- **After a visit** — record or type what the doctor said, then check the summary, to-dos
  and medicines before approving.
- **Visit detail** — the saved visit, with checkable to-dos, a medicine schedule, the
  transcript and "Ask about this visit".
- **History** — every visit, newest first, with search.
- **Settings** — text size, light/dark appearance, high contrast, and delete all data.
- **Help** — what the app does and does not do, and when to call a doctor.

## Run it

You need Node.js 20.19 or newer, and a Google Gemini API key.

```bash
npm run install:all
copy .env.example .env      # macOS/Linux: cp .env.example .env
npm run dev
```

Then put your key in `.env`:

```
GEMINI_API_KEY=your-key-here
```

Get a key from <https://aistudio.google.com/apikey>. Restart `npm run dev` after changing
`.env` — the server reads it at startup.

Open **http://localhost:5173**. The client runs on 5173 and the API on 3001; `npm run dev`
starts both.

Without a key the app still runs and every screen works, but asking the AI for something
shows "The AI is not set up yet" with the fix. Nothing else is hidden or disabled.

Other scripts:

| Command | What it does |
|---|---|
| `npm run build` | Production build of the client |
| `npm test` | Unit tests for quote grounding (no key or network needed) |
| `npm start` | Run the API only (reads `.env`) |

Optional settings in `.env`:

| Name | Default | What it does |
|---|---|---|
| `GEMINI_MODEL` | `gemini-3.6-flash` | Which model to call |
| `AI_TIMEOUT_MS` | `60000` | How long to wait before giving up |
| `PORT` | `3001` | API port |

The default is a free-tier model, so a new key works without a billing account. Other
free-tier choices are `gemini-3.5-flash` and `gemini-3.5-flash-lite`.

Two traps were measured on a real key: `gemini-2.5-*` now returns **404 "no longer
available to new users"**, and `gemini-3.8-flash` was returning **503 "high demand"**
intermittently while `gemini-3.6-flash` answered in about a second. Capacity spikes are
transient, so a 5xx is retried twice (800 ms, then 2 s) before the user sees an error;
a bad key and a rate limit are never retried.

## How the AI works

Three layers, each with one job:

```
client/src/services/aiService.js     fetch calls, AbortSignal, error kinds
        ↓  POST /api/ai/*
server/routes/ai.js                  validation, request limits, status codes
        ↓
server/services/aiTasks.js           prompts, JSON schemas, quote checking
server/services/gemini.js            transport, key, timeouts, error mapping
```

| Endpoint | Body | Returns |
|---|---|---|
| `POST /api/ai/questions` | `{ concerns }` | `{ questions: [{ text, quote }] }` |
| `POST /api/ai/transcribe` | raw audio body | `{ text }` |
| `POST /api/ai/summarize` | `{ transcript }` | `{ status, summary, todos, meds, flags }` |
| `POST /api/ai/ask` | `{ transcript, question }` | `{ found, answer, quote }` |
| `GET /api/ai/status` | — | `{ configured, model }` |

Answers are constrained to a JSON schema (`responseSchema`), so the model cannot drift into
a shape the UI does not understand.

**Quotes are checked on the server.** The model is asked to copy the words it used, but
model output is never trusted: every quote is looked up in the source text (whitespace,
case and curly quotes normalised). A quote that cannot be found is dropped, the line is
marked for checking, and a note says so. That is what keeps "every line shows the exact
words it came from" honest.

The same rule covers medicines: a dose is only shown if it was said clearly. A missing or
unclear dose sets `needsCheck` and is never filled in from the model's own knowledge.

Errors arrive as a `kind` the UI already knows — `notconfigured`, `ratelimit`, `timeout`,
`unavailable`, `invalid`, `empty` — and each one gets its own message and next step. Every
call accepts an `AbortSignal`, so Cancel really stops the request.

## Light and dark

The app ships both, and follows the device until you choose otherwise. Settings →
Appearance offers **System**, **Light** and **Dark**; the sun/moon button in the header
switches between light and dark in one tap. The choice is saved with the other settings,
and a small script in `index.html` applies it before the first paint, so a dark-mode user
never sees a white flash.

Every colour is a token in `client/src/styles/tokens.css`: the light palette lives in
`:root`, and `:root[data-theme='dark']` overrides it. `--vb-primary` is the accent used for
text, icons and borders; `--vb-primary-solid` is the fill used under `text-paper`. They are
the same in light mode and diverge in dark mode, because a teal bright enough to read on a
black canvas is too bright to hold white label text. Glass surfaces, the sticky bars and
the ambient backdrop read their gradients from tokens too, so they never need a
theme-specific class. Every text/background pair in the dark palette passes WCAG AA, and
printing always forces the light palette.

## Project layout

```
visit-buddy/
  .env                  your key, never committed
  .env.example          template
  package.json          root scripts (dev, install:all, build)
  client/               React app (Vite, Tailwind, React Router)
    src/
      App.jsx           routes
      pages/            one file per screen
      components/       Button, Card, AIShell, EditableList, MedRow, navigation, ...
      services/         aiService.js (AI calls) and api.js (visit storage calls)
      context/          SettingsContext (text size, contrast, theme)
      hooks/            useUndo
      styles/           tokens.css (all colours, type, spacing) + base styles
  server/
    index.js            Express app on port 3001
    routes/             visits.js (storage), ai.js (AI endpoints)
    services/           aiTasks.js (prompts + schemas), gemini.js (transport)
    data/visits.json    created at runtime, never committed
```

## Data and privacy

Visits are saved as JSON on the computer running the app, written to a temporary file and
renamed into place so a crash cannot leave a half-written file. Only text is stored.

Recordings are sent to Google's Gemini API to be transcribed and are not saved anywhere by
this app; the transcript is what gets stored. What you type is also sent to Gemini when you
ask for questions, a summary, or an answer about a visit.

"Delete all my data" in Settings empties the store.

**If you use a free-tier key, read this.** Google's terms say content sent through unpaid
quota may be used to improve Google's products, and that human reviewers may read API input
and output. That is fine for coursework and made-up test data, but do not put a real
person's medical details through a free-tier key. Linking a billing account switches the
project to the paid tier, where content is not used to improve their products.

## Built by

David Soboma Bestman and Caleb Nwego for CMPS 4200 (HCI).
