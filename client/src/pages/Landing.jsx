import { useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { Check, PenLine } from 'lucide-react'
import Button from '../components/Button.jsx'
import Card from '../components/Card.jsx'
import Reveal from '../components/Reveal.jsx'
import { FlipWords } from '../components/ui/FlipWords.jsx'

const WORDS = ['prepared.', 'confident.', 'informed.', 'supported.']

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
      'No. There is no sign-in. Your visits stay on this device, and only text is stored — recordings are never saved.',
  },
  {
    question: 'What happens to my recording?',
    answer:
      'It is sent to Google\'s Gemini API to be turned into words, then it is not kept. Only the text you approve is saved on this device.',
  },

  {
    question: 'What happens to a photo I scan?',
    answer:
      'It is sent to our server and to Google\'s Gemini API to read the words, then it is not kept. Only the text you check and save stays on this device.',
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
          className="text-heading font-bold text-primary"
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
      <section className="vb-hero-light">
        <div className="vb-container grid gap-12 pb-20 pt-12 lg:grid-cols-12 lg:items-center lg:pb-28 lg:pt-16">
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="lg:col-span-7"
          >
            <p className="vb-eyebrow text-primary">Your health. Your voice.</p>

            <h1 className="mt-6 font-display text-[clamp(2.2rem,4.8vw,4.2rem)] font-semibold leading-[1.04] text-ink">
              <span className="sr-only">
                Feel more prepared, confident, informed, and supported.
              </span>

              <span aria-hidden="true" className="block">
                <span className="block">Feel more</span>
                <span className="mt-1 flex items-baseline">
                  <span className="inline-flex min-w-[10ch]">
                    <FlipWords words={WORDS} duration={3200} className="px-0" />
                  </span>
                </span>
              </span>
            </h1>

            <p className="mt-6 max-w-[44ch] text-subhead text-muted">
              Make every doctor&rsquo;s visit easier to prepare for, understand, and remember.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Button as={Link} to="/app" variant="glass" size="lg" magnetic className="w-full sm:w-auto">
                Get Started
              </Button>
              <Button as="a" href="#how" variant="secondary" size="lg" className="w-full sm:w-auto">
                See How It Works
              </Button>
            </div>

            <p className="mt-6 text-small text-muted">
              Your words are sent to Google's Gemini API to write the questions. Visits are saved
              only on this device.
            </p>
          </motion.div>

          <motion.div
            initial={reduce ? false : { opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
            className="relative lg:col-span-5"
          >
            {/* Floating glass window around a real product screen. */}
            <div className="vb-glass-strong relative rounded-xl p-2">
              <div className="flex items-center gap-2 px-3 py-2">
                <span className="flex gap-1.5" aria-hidden="true">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#e2e8f0]" />
                  <span className="h-2.5 w-2.5 rounded-full bg-[#e2e8f0]" />
                  <span className="h-2.5 w-2.5 rounded-full bg-[#e2e8f0]" />
                </span>
                <span className="ml-2 text-small text-muted">visitbuddy.app/app/before</span>
              </div>

              <div className="rounded-lg bg-surface p-5 md:p-6">
                <div className="flex items-center justify-between gap-4">
                  <p className="text-small font-bold uppercase tracking-[0.14em] text-muted">
                    Before a visit
                  </p>
                  <span className="rounded-full bg-primary-soft px-3 py-1 text-small font-bold text-primary">
                    Example
                  </span>
                </div>

                <ol className="mt-5 space-y-4">
                  {EXAMPLE_QUESTIONS.map((question, index) => (
                    <li key={question} className="flex gap-4">
                      <span className="font-display text-subhead text-primary">
                        0{index + 1}
                      </span>
                      <span className="text-body text-ink">{question}</span>
                    </li>
                  ))}
                </ol>

                <div className="mt-5 flex items-center justify-between gap-4 border-t border-line pt-4">
                  <p className="text-small text-muted">Every line shows its words.</p>
                  <span className="flex items-center gap-1 text-small font-bold text-primary">
                    <PenLine size={14} aria-hidden="true" /> Editable
                  </span>
                </div>
              </div>
            </div>

            <div className="vb-glass absolute -top-6 right-8 z-10 hidden items-center gap-2 rounded-full px-4 py-2 lg:flex">
              <Check size={16} className="text-success" aria-hidden="true" />
              <span className="text-small font-bold">From your own words</span>
            </div>

            <div className="vb-glass absolute -bottom-6 left-8 z-10 hidden rounded-full px-4 py-2 lg:block">
              <span className="text-small font-bold text-ink">Nothing saved yet</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ------------------------------------------------------- How it works */}
      <section id="how" className="scroll-mt-32 border-b border-line bg-surface">
        <div className="vb-container vb-section">
          <Reveal>
            <p className="vb-eyebrow text-primary">01 — How it works</p>
            <h2 className="mt-4 max-w-[24ch] font-display text-display font-semibold">
              Three steps.
            </h2>
          </Reveal>

          <ol className="mt-12 grid gap-8 md:grid-cols-3">
            {STEPS.map((step, index) => (
              <Reveal as="li" key={step.number} delay={index * 0.08}>
                <div className="border-t-2 border-primary/20 pt-4">
                  <span className="font-display text-heading text-primary">{step.number}</span>
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
            <p className="vb-eyebrow text-primary">02 — What you get</p>
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
                <p className="mt-2 text-body text-muted">Short sentences. No medical jargon.</p>
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
                  Morning, noon, evening, night. Blank where you were not told.
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
      <section className="vb-container vb-section">
        <Reveal>
          <div className="relative overflow-hidden rounded-xl bg-[linear-gradient(135deg,#0b5c55_0%,#0d9488_100%)] p-4 shadow-lift md:p-6">
            <div className="vb-aurora opacity-30" aria-hidden="true" />

            <div className="vb-glass-strong rounded-xl p-6 md:p-10">
              <p className="vb-eyebrow text-primary">03 — Our promise</p>
              <h2 className="mt-4 max-w-[20ch] font-display text-display font-semibold text-ink">
                You stay in charge.
              </h2>

              <ul className="mt-10 grid gap-x-10 gap-y-8 md:grid-cols-2">
                {PROMISES.map((promise, index) => (
                  <Reveal as="li" key={promise.title} delay={index * 0.05}>
                    <div className="flex gap-4 border-t border-line pt-5">
                      <span aria-hidden="true" className="mt-1 text-primary">
                        ✦
                      </span>
                      <div>
                        <h3 className="text-subhead font-bold">{promise.title}</h3>
                        <p className="mt-1 text-body text-muted">{promise.text}</p>
                      </div>
                    </div>
                  </Reveal>
                ))}
              </ul>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ----------------------------------------------------------- Personas */}
      <section className="border-y border-line bg-surface">
        <div className="vb-container vb-section">
          <Reveal>
            <p className="vb-eyebrow text-primary">Who it is for</p>
            <h2 className="mt-4 max-w-[26ch] font-display text-display font-semibold">
              Built for people who are tired, worried, or both.
            </h2>
          </Reveal>

          <ul className="mt-12 grid gap-4 md:grid-cols-3">
            {PERSONAS.map((persona, index) => (
              <Reveal as="li" key={persona.name} delay={index * 0.06}>
                <Card className="h-full p-8">
                  <p className="text-small font-bold uppercase tracking-[0.14em] text-primary">
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
              <p className="vb-eyebrow text-primary">Questions</p>
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
      <section className="bg-[linear-gradient(135deg,#073b36_0%,#0b5c55_100%)] text-white">
        <div className="vb-container vb-section">
          <Reveal>
            <p className="text-small font-bold uppercase tracking-[0.14em] text-white/90">
              Start here
            </p>
            <h2 className="mt-5 max-w-[22ch] font-display text-mega font-semibold text-white">
              Start with the one thing that worries you.
            </h2>
            <p className="mt-6 max-w-[44ch] text-subhead text-white/90">
              It takes about a minute, and you can change every word.
            </p>
            <div className="mt-8">
              <Button as={Link} to="/app" variant="glassLight" size="lg" magnetic>
                Get Started
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
              Try it
            </Link>
          </nav>
        </div>

        <div className="vb-container pb-10">
          <p className="max-w-measure text-small text-muted">
            Privacy: your visits are stored on this device and recordings are never saved. What
            you type or say is sent to Google's Gemini API to be organised. Built by David Soboma
            Bestman and Caleb Nwego for CMPS 4200.
          </p>
        </div>
      </footer>
    </>
  )
}
