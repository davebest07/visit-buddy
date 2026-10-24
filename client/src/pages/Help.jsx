import { Link } from 'react-router-dom'

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
    <div className="vb-container vb-section max-w-3xl">
      <p className="text-small font-bold uppercase tracking-widest text-accent">Help</p>

      <h1 className="mt-2 text-display font-bold">
        What Visit Buddy does, and what it does not.
      </h1>

      <p className="mt-6 text-subhead font-bold">
        Visit Buddy organizes what you tell it. It does not give medical advice.
      </p>

      <section aria-labelledby="does" className="mt-8">
        <h2 id="does" className="text-hero font-bold">
          What it does
        </h2>
        <ul className="mt-4 space-y-2">
          {DOES.map((item) => (
            <li key={item} className="flex gap-4 text-body">
              <span aria-hidden="true" className="font-bold text-success">
                ✓
              </span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="does-not" className="mt-8">
        <h2 id="does-not" className="text-hero font-bold">
          What it does not do
        </h2>
        <ul className="mt-4 space-y-2">
          {DOES_NOT.map((item) => (
            <li key={item} className="flex gap-4 text-body">
              <span aria-hidden="true" className="font-bold text-error">
                ✕
              </span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="emergency" className="mt-8">
        <div className="rounded border-2 border-error bg-surface p-6">
          <h2 id="emergency" className="text-subhead font-bold text-error">
            If this might be an emergency, get help now
          </h2>

          <p className="mt-2 text-body">
            Call 911, or your local emergency number, if you have chest pain, trouble
            breathing, sudden weakness or numbness, a sudden very bad headache, or you feel
            faint. Do not wait for an app.
          </p>

          <p className="mt-4 text-body">
            For anything else that is getting worse, call your doctor's office. If you are not
            sure, call your doctor or your pharmacist and ask. That list is not complete — if
            something feels very wrong, get help.
          </p>
        </div>
      </section>

      <section aria-labelledby="questions" className="mt-8">
        <h2 id="questions" className="text-hero font-bold">
          Questions about a visit
        </h2>
        <p className="mt-2 max-w-measure text-body text-muted">
          Use "Ask about this visit" on a saved visit. It answers only from what is written
          there, and it shows the line it used. If the answer is not in that visit, it says so
          instead of guessing.
        </p>
      </section>

      <section aria-labelledby="privacy" className="mt-8">
        <h2 id="privacy" className="text-hero font-bold">
          Your information
        </h2>
        <p className="mt-2 max-w-measure text-body text-muted">
          This is a demonstration. Visits are stored on the computer running the demo, and
          audio is never saved. You can remove everything from Settings with "Delete all my
          data". Please do not enter real personal or medical information.
        </p>
      </section>

      <p className="mt-8 border-t border-line pt-6 text-body">
        <Link to="/app" className="font-bold text-accent underline underline-offset-4">
          Go to the app
        </Link>
      </p>
    </div>
  )
}
