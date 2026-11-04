# Manual test script

Run `npm run dev` with `GEMINI_API_KEY` set in `.env`, open http://localhost:5173, and work
down the list. Each line says what you should see.

## Before a visit

- [ ] Open **Before a visit**, type "My knee has been hurting for two weeks, I get dizzy
      when I stand up", then tap **Get my questions**.
- [ ] Three named steps tick over while it works.
- [ ] Between three and six questions appear, numbered, each with a **Quote** button.
- [ ] Tap **Quote** on one that has one. The words shown are copied from what you typed.
- [ ] Edit a question. Tap **Undo**. The toast says "Change undone" and the edit is gone.
- [ ] Tap **Regenerate**. The wording or order changes, because the model answers afresh.
- [ ] Tap **Save**. You land on the saved visit, and it now appears on Home and History.

## After a visit

- [ ] Open **After a visit** and type a short transcript that mentions a medicine with a
      dose, one without a dose, and one instruction, for example: "She said my knee pain is
      from wear and to stretch twice a day. She started me on Bellaprin 10 milligrams every
      morning with food. Keep taking my night pill the same as before. Call if the dizziness
      gets worse."
- [ ] Tap **Check what the doctor said**. Summary, To-do and Medicines tabs all have content.
- [ ] Every line has a **Quote** button that shows the words it came from.
- [ ] The medicine with no dose has an empty dose field and is marked as needing a check.
      No dose is invented for it.
- [ ] Tap **Approve and save**. The visit opens, and nothing was saved before that point.

## Quote checking

- [ ] Type a transcript, then edit one summary line to say something the doctor never said,
      and confirm the quote shown is still only text that really appears in the transcript.
- [ ] Any line the server could not match to the transcript appears under **Needs checking**
      rather than silently passing.

## Recording

- [ ] Tap **Record the visit**, allow the microphone, say one sentence, tap **Stop**.
- [ ] The transcript box fills in with words close to what you said.
- [ ] Deny the microphone instead: the app says the microphone is off and you can type.
- [ ] Make a recording under one second: it says that was too short.

## Visit detail

- [ ] Tick a to-do, reload the page. It stays ticked.
- [ ] Ask "What did she say about my knee?" and get an answer with its quote.
- [ ] Ask something not in the visit and get "I could not find that in this visit."
- [ ] **Copy** puts the visit on the clipboard. **Print** hides the navigation and the
      buttons.
- [ ] **Delete** asks once, then removes the visit.

## Failure states

Real failures are rare now, so these are checked by breaking things on purpose.

- [ ] Clear `GEMINI_API_KEY` in `.env`, restart, and try any AI action: "The AI is not set up
      yet", with the fix named, and the text you typed still there.
- [ ] Set the key to a wrong value, restart, and try: the key was rejected, and the fix is
      named.
- [ ] Disconnect the network and try: it says it could not reach the server, with Retry.
- [ ] While a request is running, wait for **Cancel** to appear and tap it. The wait stops
      and your text is kept.

## Settings

- [ ] Text size Large and Extra large grow everything, and survive a reload.
- [ ] High contrast turns the page white with black text.
- [ ] Appearance: System, Light and Dark all apply immediately and survive a reload. The
      header sun/moon button switches in one tap.
- [ ] **Delete all my data** empties History.

## Keyboard and screen reader

- [ ] Tab from the top: a "Skip to content" link appears first.
- [ ] Every control shows a visible outline when focused.
- [ ] The bottom tabs and the Summary/To-do/Medicines tabs are reachable and usable by
      keyboard.
- [ ] Turn the screen reader on: the loading steps and errors are announced.
