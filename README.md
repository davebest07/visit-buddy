# Visit Buddy

Visit Buddy helps you get ready for a doctor visit, and remember what happened after.

Say what worries you before you go, and it turns that into a short, ordered list of
questions to ask. Say what the doctor told you afterwards, and it turns that into a
plain-language summary, a to-do list and a medicine schedule. Every line shows the exact
words it came from, and anything unclear is marked "Not sure, ask your doctor or
pharmacist".

**It does not give medical advice.** It organizes what you tell it. It never picks or
changes a medicine or a dose, and it never says something is safe.

## Screens

- **Landing** — what the app does, how it works, and the promise it makes.
- **Home** — start a visit before or after, and see the last visit you saved.
- **Before a visit** — speak or type your worries (spoken words appear live), then edit,
  print or copy the questions.
- **After a visit** — record or type what the doctor said (spoken words appear live), then
  check the summary, to-dos and medicines before approving.
- **Visit detail** — the saved visit, with checkable to-dos, a medicine schedule, the
  transcript and "Ask about this visit".
- **History** — every visit, newest first, with search.
- **Settings** — text size, light/dark appearance, high contrast, and delete all data.
- **Help** — what the app does and does not do, and when to call a doctor.

## Run it

You need Node.js 20.19 or newer. No API keys are needed.

```bash
npm run install:all
npm run dev
```

Then open **http://localhost:5173**. The client runs on 5173 and the API on 3001;
`npm run dev` starts both.

Other scripts:

| Command | What it does |
|---|---|
| `npm run dev:https` | Same as `npm run dev`, but the client is served over https (for the mic on a phone) |
| `npm run build` | Production build of the client |
| `npm start` | Run the API only |

## Live transcription

"Record my worries" (Before a visit) and "Record the visit" (After a visit) use the
browser's own speech recognition (the Web Speech API). Words appear while you talk: words
the browser is sure of are in normal ink, words it may still change are grey and italic.
Press **Stop** and the full text goes into the text box so you can fix mistakes before
continuing. The code is in `client/src/hooks/useLiveTranscript.js` and
`client/src/components/LiveTranscriber.jsx`.

- **Chrome, Edge and Safari** support it. **Firefox** does not; the mic is hidden and the
  page says you can type instead.
- Browsers stop listening after a few seconds of silence. Visit Buddy starts again on its
  own until you press Stop.
- If the microphone is blocked, the page explains how to allow it.
- The microphone only works on a secure page: `localhost` counts, but a plain
  `http://192.168…` address on a phone does not. Use `npm run dev:https` for that.

### Trying the mic on a phone

1. Run `npm run dev:https` from the project root.
2. Find the **Network** address Vite prints, for example `https://192.168.5.35:5173`.
3. Open it on a phone on the same Wi-Fi.
4. The phone warns that the certificate is not trusted. That is expected: it is a
   self-signed certificate made by `@vitejs/plugin-basic-ssl` for development only. Choose
   to continue (Safari: *Show Details → visit this website*; Chrome: *Advanced → Proceed*).
5. Allow the microphone when asked.

`npm run dev` (plain http) still works for everything else.

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

## Try the AI states

The AI is mocked for now, but it produces every real state a connected AI would. Add a
parameter to the URL or use the testing panel.

| Parameter | Result |
|---|---|
| `?ai=success` | Normal answer after about 2.5 seconds |
| `?ai=slow` | Answer after about 14 seconds, so Cancel appears |
| `?ai=uncertain` | Lines that were hard to hear are highlighted |
| `?ai=empty` | Nothing usable comes back |
| `?ai=error` | "Visit Buddy is paused right now" |
| `?ai=timeout` | Gives up after 10 seconds |
| `?ai=ratelimit` | "Too many requests, please wait a minute" |
| `?testing=1` | Small panel for usability sessions |

The `?ai=` value wins over the saved setting.

## How it works

Everything AI lives in one file: `client/src/services/aiService.js`. Components never
contain sample AI data. The file exports `buildQuestions`, `transcribe`, `summarizeVisit`,
`flagUncertain` and `askAboutVisit`, all of which accept an `AbortSignal`, so Cancel really
stops the request. Speech-to-text on the pages now comes from the browser (see Live
transcription), so the `?ai=` modes apply to the AI steps, not to the microphone.
`transcribe` stays as the shape a server-side speech model would use later.

To connect a real model later, replace the inside of those five functions with calls to
`server/routes/ai.js` and keep the shapes the same. That route is the only place a key
would be read, from `.env`. There are no keys in this repository.

## Question knowledge base (RAG)

Before a visit should ask the kind of questions a clinician would ask, not generic AI
questions. So the questions come from a small, hand-written knowledge base, found by
retrieval (the "R" in RAG).

**What is in it.** `server/knowledge/` holds one JSON file per topic: dizziness, joint pain,
back pain, headache, stomach pain, cough, skin and rash, tiredness, sleep, mood and stress,
medication review, plus two fallback sets, general symptom history and preparing for any
visit. That is 193 short questions. Each one looks like this:

```json
{
  "id": "dizziness-04",
  "topic": "dizziness",
  "category": "triggers/relief",
  "use": "interview",
  "question": "Does it happen when you stand up, turn your head, or lie down?",
  "keywords": ["dizzy", "lightheaded", "vertigo", "stand", "head"],
  "replies": ["When I stand up", "When I turn my head", "When I lie down", "Nothing I've noticed"],
  "source": { "name": "Standard clinical history-taking (OLDCARTS/OPQRST)", "url": "" }
}
```

- `category` is one of: onset, location, duration, character, triggers/relief, timing,
  severity, related symptoms, impact on daily life, history, medicines, goals for the visit.
  These follow the standard symptom-history structures OLDCARTS and OPQRST.
- `use` is `interview` (something the doctor would want to know from you) or `ask-doctor`
  (a question you can ask the doctor, in the spirit of AHRQ's *Questions Are the Answer*).
- `replies` are optional quick answers for the interview.
- Every question is written in plain words for Visit Buddy; nothing is copied from a source.
  The knowledge base holds **questions only**: no diagnoses, causes, treatments or drug
  information.
- **Sources to verify.** Only the AHRQ link is filled in
  (`https://www.ahrq.gov/questions/index.html`). Questions based on OLDCARTS and OPQRST are
  credited to "Standard clinical history-taking (OLDCARTS/OPQRST)". These, and the general
  history structure, are teaching frameworks without one official page, so their `url` is
  left empty on purpose.

**How search works.** `POST /api/rag/search` (`server/routes/rag.js`, logic in
`server/rag/search.js`) scores every question with BM25 keyword ranking. Before scoring,
everyday words are mapped to the knowledge base's words (`server/rag/synonyms.js`):
"lightheaded" → dizziness, "knee" → joint pain, "tummy" → stomach. A topic only counts when
your words hit that topic's own keywords, results take turns between topics (so "my knee
hurts and I get dizzy" returns both), and if nothing matches you get the general set.
No API key is needed.

```
POST /api/rag/search
{ "query": "I get dizzy when I stand up", "limit": 8, "use": "interview" }

→ { "method": "bm25", "fallback": false, "expandedWith": [...],
    "matchedTopics": [{ "topic": "dizziness", "score": 10.9 }],
    "results": [{ ...chunk, "score": 10.9 }] }
```

`limit` (1–50, default 12), `use` and `topics` (a list of topic names) are optional. Bad
input gets a 400 with a readable message. `GET /api/rag/topics` lists the topics. The client
calls it through `searchKnowledge()` in `client/src/services/api.js`.

**Switching to embeddings later.** The scorer is one object with
`score(query) → [{ id, score }]`. An embedding scorer that returns cosine similarities in
that shape can replace `createBm25Scorer` without changing the response.

**Editing the knowledge base.** Edit the JSON files and restart the server. Keep every
entry a question, keep ids unique, and keep `topic` the same within a file.

## Project layout

```
visit-buddy/
  package.json          root scripts (dev, install:all, build)
  client/               React app (Vite, Tailwind, React Router)
    src/
      App.jsx           routes
      pages/            one file per screen
      components/       Button, Card, AIShell, EditableList, MedRow, navigation, ...
      services/         aiService.js (AI) and api.js (server calls)
      context/          SettingsContext (text size, contrast, AI mode)
      hooks/            useUndo, useLiveTranscript
      styles/           tokens.css (all colours, type, spacing) + base styles
  server/
    index.js            Express app on port 3001
    routes/             visits.js (JSON storage), rag.js (question search), ai.js (stub)
    rag/                search.js (BM25 retrieval), synonyms.js
    knowledge/          question knowledge base, one JSON file per topic
    data/visits.json    created at runtime, never committed
```

## Data

Visits are saved as JSON on the computer running the app. Only text is stored. Visit
Buddy never records, uploads or saves audio.

Live transcription is done by the browser, not by Visit Buddy. In some browsers (Chrome,
for example) that means the browser sends your speech to an online service (Google's) to
turn it into text. The page says so next to the microphone. If that is a concern, type
instead.

"Delete all my data" in Settings empties the store.

## Built by

David Soboma Bestman and Caleb Nwego for CMPS 4200 (HCI).
