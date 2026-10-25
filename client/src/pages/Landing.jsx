import { useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import Button from '../components/Button.jsx'
import Card from '../components/Card.jsx'
import Reveal from '../components/Reveal.jsx'

const EXAMPLE_QUESTIONS = [
  'How long will this take to get better?',
  'What should I do if it gets worse?',
  'Do I need to change my medicines?',
]

const STEPS = [
  {
    number: '01',
    title: 'Say what worries you',
    text: 'Type it or speak it. One sentence is enough, and you get a short, ordered list of questions to ask.',
  },
  {
    number: '02',
    title: 'Bring your questions',
    text: 'Read them out at the visit. Edit any line, print the list, or copy it into a message.',
  },
  {
    number: '03',
    title: 'Tell us what the doctor said',
    text: 'You get a plain summary, a to-do list and a medicine schedule, each line beside the words it came from.',
  },
]

const PROMISES = [
  { title: 'You see where it came from', text: 'Every line carries the exact words it was made from.' },
  { title: 'You approve everything', text: 'Nothing is saved until you tap Approve and save.' },
  {
    title: 'It never gives medical advice',
    text: 'It organizes what you said. It does not decide anything for you.',
  },
  { title: 'You can delete it all', text: 'One button removes every visit from this device.' },
]

const PERSONAS = [
  { name: 'Harold, 72', role: 'Lives alone', text: 'Needs big text and to be able to talk instead of type.' },
  { name: 'Denise, 45', role: 'Helps her mother', text: 'Wants the summary afterwards, in words she can forward.' },
  { name: 'Marcus, 29', role: 'New to all this', text: 'Needs plain words and one clear next step.' },
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

function FaqItem({ question, answer }) {
  const [open, setOpen] = useState(false)
  const reduce = useReducedMotion()

  return (
    <div className="border-t border-line">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className="flex min-h-tap w-full items-center justify-between gap-6 py-6 text-left"
      >
        <span className="text-subhead font-bold">{question}</span>
        <motion.span
          aria-hidden="true"
          animate={{ rotate: open ? 45 : 0 }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          className="text-heading font-bold text-accent"
        >
          +
        </motion.span>
      </button>

      <AnimatePresence initial={false}>
        {open ? (
          <motion.div
            key="answer"
            initial={reduce ? false : { height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={reduce ? undefined : { height: 0, opacity: 0 }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <p className="max-w-measure pb-6 text-body text-muted">{answer}</p>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  )
}

export default function Landing() {
  const reduce = useReducedMotion()

  return (
    <>
      {/* ---------------------------------------------------------------- Hero */}
      <section className="vb-navy-field relative isolate overflow-hidden">
        <div aria-hidden="true" className="vb-aurora" />
        <div aria-hidden="true" className="vb-aurora vb-aurora-slow" />

        <div className="vb-container relative grid gap-8 pb-20 pt-12 lg:grid-cols-12 lg:items-center lg:pb-28 lg:pt-16">
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="lg:col-span-7"
          >
            <p className="vb-eyebrow text-accent-bright">For the visit, and for after</p>

            <h1 className="mt-6 font-display text-mega font-semibold text-paper">
              Remember <em className="italic text-accent-bright">everything</em> your doctor
              said.
            </h1>

            <p className="mt-6 max-w-[46ch] text-subhead text-paper-muted">
              Say what worries you before you go. Say what the doctor told you after. Visit
              Buddy turns both into short, plain lists you can actually use.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Button as={Link} to="/app" variant="accent" magnetic>
                Try the demo
              </Button>
              <Button as="a" href="#how" variant="ghostDark">
                See how it works
              </Button>
            </div>

            <p className="mt-6 text-small text-paper-muted">
              Demo only. Please do not enter real personal or medical information.
            </p>
          </motion.div>

          <motion.div
            initial={reduce ? false : { opacity: 0, y: 32, rotate: -1.5 }}
            animate={{ opacity: 1, y: 0, rotate: 0 }}
            transition={{ duration: 0.9, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
            className="relative lg:col-span-5"
          >
            <div className="rounded-xl border border-white/15 bg-white/[0.06] p-6 shadow-lift backdrop-blur-xl">
              <div className="flex items-center justify-between gap-4">
                <p className="text-small font-bold uppercase tracking-[0.14em] text-paper-muted">
                  Before a visit
                </p>
                <span className="rounded-full bg-accent-bright/15 px-3 py-1 text-small font-bold text-accent-bright">
                  Example
                </span>
              </div>

              <ol className="mt-6 space-y-5">
                {EXAMPLE_QUESTIONS.map((question, index) => (
                  <li key={question} className="flex gap-4">
                    <span className="font-display text-subhead text-accent-bright">
                      0{index + 1}
                    </span>
                    <span className="text-body text-paper">{question}</span>
                  </li>
                ))}
              </ol>

              <div className="mt-6 flex items-center justify-between gap-4 border-t border-white/10 pt-5">
                <p className="text-small text-paper-muted">Every line shows its words.</p>
                <span className="rounded-full border border-white/20 px-3 py-1 text-small font-bold text-paper">
                  Editable
                </span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ------------------------------------------------------- How it works */}
      <section id="how" className="scroll-mt-32 border-b border-line">
        <div className="vb-container vb-section">
          <Reveal>
            <p className="vb-eyebrow text-accent">01 — How it works</p>
            <h2 className="mt-4 max-w-[24ch] font-display text-display font-semibold">
              Three steps. No jargon.
            </h2>
          </Reveal>

          <ol className="mt-12 grid gap-8 md:grid-cols-3">
            {STEPS.map((step, index) => (
              <Reveal as="li" key={step.number} delay={index * 0.08}>
                <div className="border-t-2 border-ink pt-4">
                  <span className="font-display text-heading text-accent">{step.number}</span>
                  <h3 className="mt-3 text-subhead font-bold">{step.title}</h3>
                  <p className="mt-2 text-body text-muted">{step.text}</p>
                </div>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      {/* ------------------------------------------------------- What you get */}
      <section className="bg-surface-2">
        <div className="vb-container vb-section">
          <Reveal>
            <p className="vb-eyebrow text-accent">02 — What you get</p>
            <h2 className="mt-4 max-w-[24ch] font-display text-display font-semibold">
              Five things you leave with.
            </h2>
          </Reveal>

          <div className="mt-12 grid gap-4 md:grid-cols-6">
            <Reveal className="md:col-span-4" delay={0.05}>
              <Card tone="paper" className="h-full p-8">
                <h3 className="font-display text-heading font-semibold">Questions for the doctor</h3>
                <p className="mt-2 max-w-[42ch] text-body text-muted">
                  The things you meant to ask, in a useful order, with the worry behind each one.
                </p>
                <ol className="mt-6 space-y-3 border-t border-line pt-6">
                  {EXAMPLE_QUESTIONS.map((question, index) => (
                    <li key={question} className="flex gap-3 text-body">
                      <span className="font-display text-muted">0{index + 1}</span>
                      <span>{question}</span>
                    </li>
                  ))}
                </ol>
              </Card>
            </Reveal>

            <Reveal className="md:col-span-2" delay={0.1}>
              <Card tone="tint-sky" className="h-full">
                <h3 className="text-subhead font-bold">A plain-language summary</h3>
                <p className="mt-2 text-body text-muted">
                  Short sentences. No medical jargon.
                </p>
              </Card>
            </Reveal>

            <Reveal className="md:col-span-2" delay={0.05}>
              <Card tone="tint-blue" className="h-full">
                <h3 className="text-subhead font-bold">A to-do list</h3>
                <p className="mt-2 text-body text-muted">
                  Stretches, blood work, call-backs. Tick them off as you go.
                </p>
              </Card>
            </Reveal>

            <Reveal className="md:col-span-2" delay={0.1}>
              <Card tone="tint-slate" className="h-full">
                <h3 className="text-subhead font-bold">A medicine schedule</h3>
                <p className="mt-2 text-body text-muted">
                  Morning, noon, evening, navy. Blank where you were not told.
                </p>
              </Card>
            </Reveal>

            <Reveal className="md:col-span-2" delay={0.15}>
              <Card tone="paper" className="h-full">
                <h3 className="text-subhead font-bold">Something to share</h3>
                <p className="mt-2 text-body text-muted">
                  Copy or print a visit to send to family.
                </p>
              </Card>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------ Promise */}
      <section className="vb-navy-field">
        <div className="vb-container vb-section">
          <Reveal>
            <p className="vb-eyebrow text-accent-bright">03 — Our promise</p>
            <h2 className="mt-4 max-w-[20ch] font-display text-display font-semibold text-paper">
              You stay in charge.
            </h2>
          </Reveal>

          <ul className="mt-12 grid gap-x-12 gap-y-10 md:grid-cols-2">
            {PROMISES.map((promise, index) => (
              <Reveal as="li" key={promise.title} delay={index * 0.06}>
                <div className="flex gap-4 border-t border-white/15 pt-5">
                  <span aria-hidden="true" className="mt-1 text-accent-bright">
                    ✦
                  </span>
                  <div>
                    <h3 className="text-subhead font-bold text-paper">{promise.title}</h3>
                    <p className="mt-1 text-body text-paper-muted">{promise.text}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </ul>
        </div>
      </section>

      {/* ----------------------------------------------------------- Personas */}
      <section className="border-b border-line">
        <div className="vb-container vb-section">
          <Reveal>
            <p className="vb-eyebrow text-accent">Who it is for</p>
            <h2 className="mt-4 max-w-[26ch] font-display text-display font-semibold">
              Built for people who are tired, worried, or both.
            </h2>
          </Reveal>

          <ul className="mt-12 grid gap-4 md:grid-cols-3">
            {PERSONAS.map((persona, index) => (
              <Reveal as="li" key={persona.name} delay={index * 0.06}>
                <Card className="h-full p-8">
                  <p className="text-small font-bold uppercase tracking-[0.14em] text-accent">
                    {persona.role}
                  </p>
                  <h3 className="mt-3 font-display text-heading font-semibold">{persona.name}</h3>
                  <p className="mt-2 text-body text-muted">{persona.text}</p>
                </Card>
              </Reveal>
            ))}
          </ul>
        </div>
      </section>

      {/* ---------------------------------------------------------------- FAQ */}
      <section>
        <div className="vb-container vb-section">
          <div className="grid gap-10 lg:grid-cols-12">
            <Reveal className="lg:col-span-4">
              <p className="vb-eyebrow text-accent">Questions</p>
              <h2 className="mt-4 font-display text-display font-semibold">
                Four things people ask.
              </h2>
            </Reveal>

            <Reveal className="lg:col-span-8" delay={0.08}>
              <div className="border-b border-line">
                {FAQS.map((faq) => (
                  <FaqItem key={faq.question} question={faq.question} answer={faq.answer} />
                ))}
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------ Closing */}
      <section className="bg-primary-deep text-paper">
        <div className="vb-container vb-section">
          <Reveal>
            <p className="vb-eyebrow text-paper-muted">Start here</p>
            <h2 className="mt-5 max-w-[22ch] font-display text-mega font-semibold">
              Start with the one thing that worries you.
            </h2>
            <p className="mt-6 max-w-[44ch] text-subhead text-paper-muted">
              It takes about a minute, and you can change every word.
            </p>
            <div className="mt-8">
              <Button as={Link} to="/app" variant="onDark" magnetic>
                Try the demo
              </Button>
            </div>
          </Reveal>
        </div>
      </section>

      <footer className="border-t border-line bg-surface">
        <div className="vb-container flex flex-col gap-8 py-12 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="font-display text-heading font-semibold">Visit Buddy</p>
            <p className="mt-3 max-w-measure text-small text-muted">
              Visit Buddy organizes what you tell it. It does not give medical advice.
            </p>
          </div>

          <nav aria-label="Footer" className="flex gap-6">
            <Link
              to="/help"
              className="flex min-h-tap items-center text-small font-bold text-ink hover:text-primary"
            >
              Help
            </Link>
            <Link
              to="/app"
              className="flex min-h-tap items-center text-small font-bold text-ink hover:text-primary"
            >
              Try the demo
            </Link>
          </nav>
        </div>

        <div className="vb-container pb-10">
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
