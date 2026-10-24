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

## After a visit

- [ ] Open **After a visit**, tap **Use the sample conversation**, then **Check what the
      doctor said**.
- [ ] Summary, To-do and Medicines tabs all have content.
- [ ] Every line has a **Quote** button that shows the words it came from.
- [ ] The Bellaprin row is marked as needing a check, and its dose is not guessed.
- [ ] Add `?ai=uncertain` to the URL and repeat. More lines are highlighted, and the dose
      field is empty.
- [ ] Tap **Approve and save**. The visit opens and nothing was saved before that point.

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
