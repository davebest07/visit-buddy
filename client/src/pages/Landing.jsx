import { Link } from 'react-router-dom'
import Button from '../components/Button.jsx'
import Card from '../components/Card.jsx'

const EXAMPLE_QUESTIONS = [
  'How long will this take to get better?',
  'What should I do if it gets worse?',
  'Do I need to change my medicines?',
]

const STEPS = [
  {
    number: '01',
    title: 'Say what worries you',
    text: 'Type it or speak it. One sentence is enough. You get a short, ordered list of questions to ask.',
  },
  {
    number: '02',
    title: 'Bring your questions',
    text: 'Read them out at the visit. Edit any line, print the list, or copy it into a message.',
  },
  {
    number: '03',
    title: 'Tell us what the doctor said',
    text: 'You get a plain summary, a to-do list and a medicine schedule, each line shown next to the words it came from.',
  },
]

const GETS = [
  { title: 'Questions for the doctor', text: 'The things you meant to ask, in a useful order.' },
  { title: 'A plain-language summary', text: 'Short sentences. No medical jargon.' },
  { title: 'A to-do list', text: 'Stretches, blood work, call-backs. Tick them off as you go.' },
  { title: 'A medicine schedule', text: 'Morning, noon, evening, night. Blank where you were not told.' },
  { title: 'Something to share', text: 'Copy or print a visit to send to family.' },
]

const PROMISES = [
  { title: 'You see where it came from', text: 'Every line has the exact words it was made from.' },
  { title: 'You approve everything', text: 'Nothing is saved until you tap Approve and save.' },
  {
    title: 'It never gives medical advice',
    text: 'It organizes what you said. It does not decide anything for you.',
  },
  { title: 'You can delete it all', text: 'One button removes every visit from this device.' },
]

const PERSONAS = [
  {
    name: 'Harold, 72',
    text: 'Lives alone. Needs big text and to be able to talk instead of type.',
  },
  {
    name: 'Denise, 45',
    text: 'Helps her mother with appointments. Wants to share the summary afterwards.',
  },
  { name: 'Marcus, 29', text: 'New to all of this. Needs plain words and a clear next step.' },
]

const FAQS = [
  {
    question: 'Is this medical advice?',
    answer:
      'No. Visit Buddy only organizes what you tell it. It does not choose or change a medicine or a dose, and it does not check whether medicines mix. Ask your doctor or pharmacist.',
  },
  {
    question: 'Do I need an account?',
    answer:
      'No. There is no sign-in in this demo. Your visits stay on this computer, and the demo stores text only, never audio.',
  },
  {
    question: 'What happens to my recording?',
    answer:
      'This demo does not send your recording anywhere, and it does not save it. Only the text you approve is kept.',
  },
  {
    question: 'Can I share a visit with family?',
    answer:
      'Yes. Open a saved visit and use Copy or Print. Sharing by email is designed for a later phase, not built yet.',
  },
]

function Check() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="h-6 w-6 shrink-0 text-success"
    >
      <path d="m4 12 5 5L20 6" />
    </svg>
  )
}

export default function Landing() {
  return (
    <>
      {/* Hero */}
      <section className="vb-hero-wash">
        <div className="vb-container vb-section grid gap-8 lg:grid-cols-12 lg:items-center">
          <div className="lg:col-span-7">
            <p className="text-small font-bold uppercase tracking-widest text-accent">
              For the visit, and for after
            </p>

            <h1 className="mt-4 text-display font-bold">
              Remember everything your doctor said.
            </h1>

            <p className="mt-4 max-w-measure text-subhead text-muted">
              Say what worries you before you go. Say what the doctor told you after. Visit
              Buddy turns both into short, plain lists you can actually use.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-4">
              <Button as={Link} to="/app">
                Try the demo
              </Button>
              <Button as="a" href="#how" variant="quiet">
                See how it works
              </Button>
            </div>

            <p className="mt-4 text-small text-muted">
              Demo only. Please do not enter real personal or medical information.
            </p>
          </div>

          <div className="lg:col-span-5">
            <Card className="shadow-calm">
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-subhead font-bold">Before a visit</h2>
                <span className="rounded bg-accent-soft px-2 py-1 text-small font-bold text-accent">
                  Example
                </span>
              </div>

              <ol className="mt-4 space-y-4">
                {EXAMPLE_QUESTIONS.map((question, index) => (
                  <li key={question} className="flex gap-4">
                    <span className="text-small font-bold text-accent">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <span className="text-body">{question}</span>
                  </li>
                ))}
              </ol>

              <p className="mt-4 border-t border-line pt-4 text-small text-muted">
                You can edit every line before you save it.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="border-t border-line">
        <div className="vb-container vb-section">
          <p className="text-small font-bold uppercase tracking-widest text-accent">
            1 — How it works
          </p>
          <h2 className="mt-2 max-w-measure text-hero font-bold">Three steps. No jargon.</h2>

          <ol className="mt-8 grid gap-8 md:grid-cols-3">
            {STEPS.map((step) => (
              <li key={step.number} className="border-t-2 border-accent pt-4">
                <span className="text-small font-bold text-accent">{step.number}</span>
                <h3 className="mt-2 text-subhead font-bold">{step.title}</h3>
                <p className="mt-2 text-body text-muted">{step.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* What you get */}
      <section className="border-y border-line bg-surface">
        <div className="vb-container vb-section">
          <p className="text-small font-bold uppercase tracking-widest text-accent">
            2 — What you get
          </p>
          <h2 className="mt-2 max-w-measure text-hero font-bold">
            Five things you leave with.
          </h2>

          <ul className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {GETS.map((item) => (
              <li key={item.title}>
                <Card className="h-full">
                  <h3 className="text-subhead font-bold">{item.title}</h3>
                  <p className="mt-2 text-body text-muted">{item.text}</p>
                </Card>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Our promise */}
      <section className="bg-accent-soft">
        <div className="vb-container vb-section">
          <p className="text-small font-bold uppercase tracking-widest text-accent">
            3 — Our promise
          </p>
          <h2 className="mt-2 max-w-measure text-hero font-bold">You stay in charge.</h2>

          <ul className="mt-8 grid gap-8 md:grid-cols-2">
            {PROMISES.map((promise) => (
              <li key={promise.title} className="flex gap-4">
                <Check />
                <div>
                  <h3 className="text-subhead font-bold">{promise.title}</h3>
                  <p className="mt-1 text-body text-muted">{promise.text}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Who it is for */}
      <section className="border-t border-line">
        <div className="vb-container vb-section">
          <p className="text-small font-bold uppercase tracking-widest text-accent">
            Who it is for
          </p>
          <h2 className="mt-2 max-w-measure text-hero font-bold">
            Built for people who are tired, worried, or both.
          </h2>

          <ul className="mt-8 grid gap-4 md:grid-cols-3">
            {PERSONAS.map((persona) => (
              <li key={persona.name}>
                <Card className="h-full">
                  <h3 className="text-subhead font-bold">{persona.name}</h3>
                  <p className="mt-2 text-body text-muted">{persona.text}</p>
                </Card>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* FAQ */}
      <section className="border-t border-line">
        <div className="vb-container vb-section">
          <p className="text-small font-bold uppercase tracking-widest text-accent">
            Questions
          </p>
          <h2 className="mt-2 text-hero font-bold">Four things people ask.</h2>

          <div className="mt-8 max-w-measure">
            {FAQS.map((faq) => (
              <details key={faq.question} className="group border-t border-line last:border-b">
                <summary className="flex min-h-tap cursor-pointer list-none items-center justify-between gap-4 py-4 text-subhead font-bold">
                  {faq.question}
                  <span
                    aria-hidden="true"
                    className="text-heading text-accent transition-transform duration-calm group-open:rotate-45"
                  >
                    +
                  </span>
                </summary>
                <p className="pb-4 text-body text-muted">{faq.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Closing call to action */}
      <section className="bg-highlight">
        <div className="vb-container vb-section">
          <h2 className="max-w-measure text-hero font-bold">
            Start with the one thing that worries you.
          </h2>
          <p className="mt-4 max-w-measure text-subhead">
            It takes about a minute, and you can change every word.
          </p>
          <div className="mt-6">
            <Button as={Link} to="/app" variant="inverse">
              Try the demo
            </Button>
          </div>
        </div>
      </section>

      <footer className="border-t border-line bg-surface">
        <div className="vb-container flex flex-col gap-4 py-8 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-subhead font-bold">Visit Buddy</p>
            <p className="mt-2 max-w-measure text-small text-muted">
              Visit Buddy organizes what you tell it. It does not give medical advice.
            </p>
          </div>

          <nav aria-label="Footer" className="flex gap-6">
            <Link
              to="/help"
              className="flex min-h-tap items-center text-body font-bold text-ink hover:text-accent"
            >
              Help
            </Link>
            <Link
              to="/app"
              className="flex min-h-tap items-center text-body font-bold text-ink hover:text-accent"
            >
              Try the demo
            </Link>
          </nav>
        </div>

        <div className="vb-container pb-8">
          <p className="max-w-measure text-small text-muted">
            Privacy: this demo keeps your visits on this computer and never stores audio.
            Please do not enter real personal or medical information. Built by David Soboma
            Bestman and Caleb Nwego for CMPS 4200.
          </p>
        </div>
      </footer>
    </>
  )
}
