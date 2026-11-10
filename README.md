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
- **Before a visit** — speak or type your worries (spoken words appear live), answer 3–5
  short follow-up questions, then edit, save, print or copy your questions and a "What to
  tell your doctor" list.
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

## Before a visit: the guided interview

Three steps, shown at the top of the page: **Describe → A few questions → Your questions**.

1. **Describe.** Type or say what is worrying you, then tap **Continue**.
2. **Red-flag check.** Before anything is searched, the words are checked for signs that
   need help now: chest pain, trouble breathing, signs of a stroke, fainting, severe
   bleeding, or thoughts of self-harm. The check (`client/src/services/redFlags.js`, not AI)
   looks for word pairs close together in the same part of a sentence, not exact phrases:
   a chest word plus a pain word ("my chest is aching me"), "can't/hard to/trouble" plus a
   breathing word, and so on. It errs on the side of asking.
   - A match stops the flow with a card in the Help page's style: "Are you having chest pain,
     pressure or tightness right now?", with the 911 advice. **Yes, get help** shows the full
     "Get help now — call 911 or your doctor" card. **No, continue** carries on with their
     words kept, and that phrase is not asked about again in this browser session.
   - Thoughts of self-harm always show 988 (call or text, the US Suicide & Crisis Lifeline)
     and 911 first, with a smaller **I'm safe right now, continue**. After that, a small,
     calm line stays at the top of Before a visit (and under "Your questions" on the list)
     for the rest of the browser session: "If you need to talk to someone, call or text
     988." with Call and Text links. It never blocks anything. The Help page lists 988 too.
   - Tests: `npm run test:redflags` (42 phrases that should match, 20 that should not).
3. **A few questions.** The worries are searched in the knowledge base (three searches at
   once: interview prompts, ask-the-doctor questions, and the general set, see
   `findQuestionChunks` in `api.js`). `interviewQuestions` picks 3–5 of them in the order a
   doctor usually asks: when it started → what it feels like → what makes it better or
   worse → how it affects your day → medicines → what you want from the visit. Anything
   their words already cover ("for two weeks") is skipped. When no topic fits, the general
   history questions are made specific with their own words ("my ear feels funny" → "When
   did the funny feeling in your ear first start?"), with at most one "preparing for any
   visit" question at the end. One question shows at a time,
   with quick-reply buttons, a text box, the microphone, **Skip**, **Back** and "Question 2
   of 4". Every answer is checked for red flags too.
4. **Your questions.** `buildQuestions` returns 4–6 questions to ask, in this order:
   - **About their worry first:** one from each worry's topic, then questions to ask the
     doctor in their own words ("What could be causing the funny feeling in my elbow?",
     "Do I need any tests for my elbow?", "Is there anything I should avoid doing with my
     elbow until it's better?", "What signs with my elbow mean I should come back
     sooner?"). These are questions the person asks; the app never suggests a cause.
   - **From their interview answers:** one follow-up, plus one from what they want from
     the visit. Answers like "Nothing" or "Not much" don't produce a follow-up.
   - **At most two general questions at the end**, such as "When should I come back…?".
   - The same idea is never asked twice (for example two questions about tests), and the
     general "What do you think is going on…" is left out when a "What could be causing…"
     question is already there.
   - Only "ask-doctor" entries can appear in this list; interview prompts never do. The
     general ask-the-doctor entries carry a `template` with `{problem}`, `{part}` and
     `{feels}` so they read naturally with "my elbow", "the chest ache" or "my headaches".
     `npm run test:knowledge` checks that no ask-doctor entry is worded as a question to
     the person, that every entry is a question, and that ids are unique.
   - **Why this question** is honest: "You said “my elbow feels funny”." for questions
     built from their words, "You said it started in the last few days." for ones from an
     answer, and "A good question for any visit." for general ones, each with its source.
   Then comes
   **What to tell your doctor**: their own words and answers, in order. Every line has
   a **Quote** button (their exact words) and a **Why this question** line with the
   knowledge-base source. Edit, Undo, Regenerate, Save, Print and Copy all work. Undo
   takes back one whole edit: everything typed in a box until you leave it, or one
   removed line (`hooks/useUndo.js`, also used on After a visit). Saving
   stores the questions, and "What to tell your doctor" in the visit's `summary`.

The questions only gather information. Nothing hints at a cause, a diagnosis or a
treatment. If the search server is down, the page skips the interview and builds questions
from their sentences.

## How it works

Everything AI lives in one file: `client/src/services/aiService.js`. Components never
contain sample AI data. The file exports `interviewQuestions`, `buildQuestions`,
`transcribe`, `summarizeVisit`, `flagUncertain` and `askAboutVisit`, all of which accept an
`AbortSignal`, so Cancel really
stops the request. Speech-to-text on the pages now comes from the browser (see Live
transcription), so the `?ai=` modes apply to the AI steps, not to the microphone.
`transcribe` stays as the shape a server-side speech model would use later.

`interviewQuestions(concerns, retrievedChunks, answersSoFar, { signal })` and
`buildQuestions(text, { chunks, answers, signal })` are grounded in the retrieved
knowledge-base entries. A comment in `aiService.js` explains how a real model will receive
those entries as numbered grounding passages and must return the id of the entry each
question came from.

To connect a real model later, replace the inside of those functions with calls to
`server/routes/ai.js` and keep the shapes the same. That route is the only place a key
would be read, from `.env`. There are no keys in this repository.

## Question knowledge base (RAG)

Before a visit should ask the kind of questions a clinician would ask, not generic AI
questions. So the questions come from a small, hand-written knowledge base, found by
retrieval (the "R" in RAG).

**What is in it.** `server/knowledge/` holds one JSON file per topic: dizziness, joint pain,
back pain, headache, stomach pain, cough, skin and rash, tiredness, sleep, mood and stress,
medication review, chest discomfort, plus two fallback sets, general symptom history and
preparing for any visit. That is 220 short questions. Chest discomfort is only reached
after the red-flag card's "No, continue". Each one looks like this:

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
      services/         aiService.js (AI), api.js (server calls), redFlags.js (safety check)
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
