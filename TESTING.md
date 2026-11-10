# Manual test script

Run `npm run dev`, open http://localhost:5173, and work down the list. Each line says what
you should see.

## Before a visit

- [ ] Open **Before a visit**. The steps read **Describe → A few questions → Your
      questions**, with Describe filled. A "How it works" panel sits beside the text box.
- [ ] Type "My knee has been hurting for two weeks, I get dizzy when I stand up, and I'm
      not sure my morning pill is working." and tap **Continue**.
- [ ] A short loading card ("Finding a few questions for you"), then "Question 1 of 5",
      "About your knee", and a question about what the pain feels like. No question asks
      when it started, because "for two weeks" already says so.
- [ ] Each question has quick-reply buttons, a text box, **Answer by talking**, **Next
      question**, **Skip** and **Back**. Tapping a quick reply fills the box; Next is
      greyed out until there is an answer.
- [ ] Answer, Skip and go **Back**. Your earlier answer is still there.
- [ ] On the last question the button reads **See my questions**. Tap it.
- [ ] "Your questions" shows 4–6 questions: ones about your worry first, then one or two
      from your answers, then at most two general ones. Each row is one or two lines of
      plain text; tap a row to edit it. The step pills at the top are fully visible, not
      under the top bar.
- [ ] "Why this question" matches where it came from: "You said “…”" with your words, "You
      said it started …" for an answer, "A good question for any visit." for general ones.
- [ ] Then **What to tell your doctor** with
      your sentences and answers ("What it feels like (my knee): Aching"). Skipped
      questions are left out.
- [ ] Each line has **Quote** (your exact words) and **Why this question** / **Why this is
      here** with a source. The AHRQ source is a link.
- [ ] Edit a line. Tap **Undo**. The toast says "Change undone" and the edit is gone.
- [ ] Tap **Regenerate**. Different questions appear.
- [ ] **Change my answers** goes back to the last question with your answers kept.
- [ ] **Copy** gives both lists. **Print** shows only the lists, no buttons.
- [ ] Tap **Save**. The saved visit shows "Your questions" and "What to tell your doctor".
- [ ] Type "I keep getting headaches". The questions start with when the headaches
      started.
- [ ] Type "my elbow feels funny". The interview asks about your elbow ("When did the funny
      feeling in your elbow start…?"). The list includes "What do you think is going on with
      my elbow?", "What could be causing the funny feeling in my elbow?" and "Do I need any
      tests for my elbow?", and no general "What do you think is going on…".
- [ ] With the knee/dizzy/pill sample, no question in the list is addressed to you (no
      "What would you most like…"). One asks about driving while dizzy.
- [ ] Type "my ear feels funny" (no topic for ears). The general questions use your words:
      "When did the funny feeling in your ear first start?".

## Red flags

- [ ] Run `npm run test:redflags`. It ends with "62 of 62 passed."
- [ ] Run `npm run test:knowledge`. It ends with "All checks passed."
- [ ] Type "my chest is aching me" and tap **Continue**. Nothing is searched. A dark card
      asks "Are you having chest pain, pressure or tightness right now?", repeats "chest is
      aching", and gives the 911 advice. Focus moves to the question.
- [ ] Tap **Yes, get help**. The card becomes "Get help now — call 911 or your doctor" with
      **Call 911**. Tap **Go back**.
- [ ] Tap **No, continue**. Your words are kept and you get chest questions ("When did the
      chest discomfort first start?"). The result has 4–6 chest-specific questions.
- [ ] **Start over**, tap **Continue** again with the same words. The card does not show
      again in this browser session.
- [ ] Try "I can't catch my breath", "pressure in my chest", "my face is drooping", "I
      passed out", "heavy bleeding". Each shows the card.
- [ ] Type "I want to kill myself". The card shows **Call 988**, **Text 988** and **Call
      911** straight away, with no "No, continue". A smaller **I'm safe right now,
      continue** carries on.
- [ ] "I hurt myself lifting a box", "my chest cold is better" and "I cough when I breathe
      cold air" do **not** show the card.
- [ ] In the interview, answer "I passed out last week" and tap Next. The card asks about
      fainting. **No, continue** moves to the next question.
- [ ] The Help page emergency box mentions 988.

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
      lists 14 topics and 220 chunks.
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
- [ ] On Before a visit these apply to both the interview step and the final list.
      `?ai=empty` there skips the interview and ends with "I could not write this up
      reliably".
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
