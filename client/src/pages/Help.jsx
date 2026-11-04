import { Link } from 'react-router-dom'
import Reveal from '../components/Reveal.jsx'

const DOES = [
  'Turns what worries you into a short list of questions to ask.',
  'Turns what the doctor said into a plain summary, a to-do list and a medicine schedule.',
  'Shows the exact words behind every line, so you can check it.',
  'Lets you ask a question about one visit, and answers only from that visit.',
  'Lets you copy or print a visit for your family.',
]

const DOES_NOT = [
  'It does not give medical advice.',
  'It does not choose, change or stop a medicine or a dose.',
  'It does not check whether two medicines are safe together.',
  'It does not call a doctor, a pharmacy or anyone else for you.',
  'It never says a thing is safe.',
]

export default function Help() {
  return (
    <div className="vb-container ml-0 max-w-4xl pt-10">
      <Reveal>
        <h1 className="mt-3 max-w-[20ch] font-display text-display font-semibold">
          What Visit Buddy does, and what it does not.
        </h1>
        <p className="mt-6 max-w-measure text-subhead font-bold">
          Visit Buddy organizes what you tell it. It does not give medical advice.
        </p>
      </Reveal>

      <Reveal delay={0.05}>
        <section aria-labelledby="does" className="mt-12 grid gap-6 md:grid-cols-2">
          <h2 id="does" className="text-heading font-bold md:col-span-2">
            What it does
          </h2>
          <ul className="grid gap-3 md:col-span-2">
            {DOES.map((item) => (
              <li
                key={item}
                className="flex gap-4 rounded-card border border-line bg-surface p-4 text-body"
              >
                <span aria-hidden="true" className="font-bold text-success">
                  ✓
                </span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>
      </Reveal>

      <Reveal delay={0.05}>
        <section aria-labelledby="does-not" className="mt-14">
          <h2 id="does-not" className="text-heading font-bold">
            What it does not do
          </h2>
          <ul className="mt-4 grid gap-3">
            {DOES_NOT.map((item) => (
              <li key={item} className="flex gap-4 border-t border-line py-3 text-body">
                <span aria-hidden="true" className="font-bold text-error">
                  ✕
                </span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>
      </Reveal>

      <Reveal delay={0.05}>
        <section aria-labelledby="emergency" className="mt-14">
          <div className="rounded-xl bg-navy p-8 text-paper">
            <h2 id="emergency" className="font-display text-heading font-semibold">
              If this might be an emergency, get help now
            </h2>

            <p className="mt-3 max-w-measure text-body text-paper-muted">
              Call 911, or your local emergency number, if you have chest pain, trouble
              breathing, sudden weakness or numbness, a sudden very bad headache, or you feel
              faint. Do not wait for an app.
            </p>

            <p className="mt-4 max-w-measure text-body text-paper-muted">
              For anything else that is getting worse, call your doctor's office. If you are
              not sure, call your doctor or your pharmacist and ask. That list is not complete
              — if something feels very wrong, get help.
            </p>
          </div>
        </section>
      </Reveal>

      <Reveal delay={0.05}>
        <section aria-labelledby="questions" className="mt-14 grid gap-6 md:grid-cols-2">
          <div>
            <h2 id="questions" className="text-heading font-bold">
              Questions about a visit
            </h2>
            <p className="mt-3 text-body text-muted">
              Use "Ask about this visit" on a saved visit. It answers only from what is written
              there, and it shows the line it used. If the answer is not in that visit, it says
              so instead of guessing.
            </p>
          </div>

          <div>
            <h2 id="privacy" className="text-heading font-bold">
              Your information
            </h2>
            <p className="mt-3 text-body text-muted">
              Visits are stored on this device only, and recordings are never saved. What you
              type or say is sent to Google's Gemini API to be organised into questions or a
              summary. You can remove everything from Settings with "Delete all my data".
            </p>
          </div>
        </section>
      </Reveal>

      <p className="mt-12 border-t border-line pt-6 text-body">
        <Link to="/app" className="font-bold text-primary underline underline-offset-4">
          Go to the app
        </Link>
      </p>
    </div>
  )
}
