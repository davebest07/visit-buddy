# Manual test script

Run `npm run dev`, open http://localhost:5173, and work down the list. Each line says what
you should see.

## Before a visit

- [ ] Open **Before a visit**, type "My knee has been hurting for two weeks, I get dizzy
      when I stand up", then tap **Get my questions**.
- [ ] Three named steps tick over while it works.
- [ ] Four questions appear, numbered, each with a **Quote** button.
- [ ] Tap **Quote** on the first one. The exact words you typed are shown.
- [ ] Edit a question. Tap **Undo**. The toast says "Change undone" and the edit is gone.
- [ ] Tap **Regenerate**. The wording or order changes.
- [ ] Tap **Save**. You land on the saved visit, and it now appears on Home and History.

## Live transcription

Use Chrome or Edge on a computer (localhost counts as secure).

- [ ] Open **Before a visit**, tap **Record my worries**, allow the microphone. A red
      "Listening…" indicator and a **Stop** button appear, and focus moves to Stop.
- [ ] Talk. Words appear while you speak: settled words in normal ink, words still being
      worked out in grey italics.
- [ ] Stay silent for about 10 seconds, then talk again. It keeps listening and adds the new
      words.
- [ ] Tap **Stop**. Everything you said is in the text box, the box has focus, and a toast
      says to fix anything that is wrong. Edit a word by hand.
- [ ] Record again. The new words are added after the existing text, not replacing it.
- [ ] While listening, **Get my questions** is disabled.
- [ ] Block the microphone in the browser's site settings and try again. A message explains
      how to allow it.
- [ ] Open the app in Firefox. There is no mic button, only "Live typing isn't available in
      this browser, you can type instead."
- [ ] Open the plain `http://<network address>:5173` on a phone. The page explains the mic
      needs a secure (https) page.
- [ ] Run `npm run dev:https`, open the https Network address on a phone, accept the
      certificate warning, and record. It works.
- [ ] Next to the mic: "Your browser turns your speech into text. In some browsers this uses
      an online service."
- [ ] Screen reader: you hear "Listening…" when it starts and "Stopped listening…" when it
      ends, but not every word.

## Question search (knowledge base)

There is no screen for this yet (Phase 3 adds one). Test it from the browser:

- [ ] Open `https://localhost:5173/api/rag/topics` (or `http://` with `npm run dev`). It
      lists 13 topics and 193 chunks.
- [ ] Open the browser console on any Visit Buddy page and run:
      ```js
      const find = (query, extra = {}) => fetch('/api/rag/search', { method: 'POST',
        headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ query, ...extra }) })
        .then((r) => r.json()).then((d) => { console.log(d.matchedTopics, d.fallback);
          console.table(d.results.map((c) => ({ topic: c.topic, score: c.score, question: c.question }))) })
      ```
- [ ] `find('My knee has been hurting for two weeks, I get dizzy when I stand up')` → topics
      joint pain and dizziness, and the questions alternate between them.
- [ ] `find('I feel lightheaded')` → dizziness only (the synonym works, and no headache).
- [ ] `find('my tummy cramps after meals')` → stomach pain, with the "linked to eating"
      question first.
- [ ] `find('I have a weird feeling')` → `fallback: true` and general questions.
- [ ] `find('knee', { use: 'ask-doctor', limit: 3 })` → only questions to ask the doctor,
      each with an AHRQ source.
- [ ] `find('')` and `find('x', { limit: 99 })` → a readable 400 error message.
- [ ] Skim a few files in `server/knowledge/`. Every entry is a question, and none names a
      diagnosis, a cause, a treatment or a drug.

## After a visit

- [ ] Open **After a visit**, tap **Use the sample conversation**, then **Check what the
      doctor said**.
- [ ] Summary, To-do and Medicines tabs all have content.
- [ ] Every line has a **Quote** button that shows the words it came from.
- [ ] The Bellaprin row is marked as needing a check, and its dose is not guessed.
- [ ] Add `?ai=uncertain` to the URL and repeat. More lines are highlighted, and the dose
      field is empty.
- [ ] Tap **Approve and save**. The visit opens and nothing was saved before that point.
- [ ] Under **Record the visit** you see "Ask your doctor before recording." Record, tap
      **Stop**, and the words land in the "What the doctor said" box for editing.

## Failure states

- [ ] `?ai=error` → "Visit Buddy is paused right now", with Retry and Type it instead.
- [ ] `?ai=timeout` → gives up after 10 seconds with "This is taking too long".
- [ ] `?ai=ratelimit` → "Too many requests, please wait a minute".
- [ ] `?ai=empty` → "I could not write this up reliably", with a way to start over.
- [ ] `?ai=slow` → Cancel appears after 10 seconds. Tapping it stops the wait and keeps
      your text.

## Visit detail

- [ ] Tick a to-do, reload the page. It stays ticked.
- [ ] Ask "What did she say about my knee?" and get an answer with its quote.
- [ ] Ask something not in the visit and get "I could not find that in this visit."
- [ ] **Copy** puts the visit on the clipboard. **Print** hides the navigation and the
      buttons.
- [ ] **Delete** asks once, then removes the visit.

## Settings

- [ ] Text size Large and Extra large grow everything, and survive a reload.
- [ ] High contrast turns the page white with black text.
- [ ] **Delete all my data** empties History.

## Keyboard and screen reader

- [ ] Tab from the top: a "Skip to content" link appears first.
- [ ] Every control shows a visible outline when focused.
- [ ] The bottom tabs and the Summary/To-do/Medicines tabs are reachable and usable by
      keyboard.
- [ ] Turn the screen reader on: the loading steps and errors are announced.
