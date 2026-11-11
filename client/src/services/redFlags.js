/*
 * Words that mean "this might need help now".
 *
 * This is a plain safety check, not AI. It runs on what people type or say
 * before anything is searched, and again on every interview answer.
 *
 * It works on words, not exact phrases: "my chest is aching me" matches
 * because a chest word and a pain word sit close together in the same part of
 * a sentence. It errs on the side of asking. The page then asks "Are you
 * having this right now?", and a "No" is remembered for that phrase for the
 * rest of the browser session.
 *
 * It never says what the problem might be. It only repeats the words it found.
 */

// ---------------------------------------------------------------------------
// Words
// ---------------------------------------------------------------------------

function normalize(text) {
  return String(text ?? '')
    .toLowerCase()
    .replace(/[’‘]/g, "'")
    .replace(/\bcan not\b/g, 'cannot')
}

// Parts of a sentence. A pain word in one part does not pair with a chest
// word in another: "my chest cold is better, but my knee hurts".
function clausesOf(text) {
  return normalize(text)
    .split(/[.!?;,\n]+|\b(?:but|although|though|except)\b/)
    .map((clause) => clause.match(/[a-z0-9']+/g) ?? [])
    .filter((words) => words.length)
}

const is = (pattern) => (word) => pattern.test(word)

const CHEST = is(/^(chest|heart|breastbone|sternum)$/)
const CHEST_FEELING = is(
  /^(pain|pains|painful|ache|aches|aching|achy|achey|hurt|hurts|hurting|sore|tight|tighter|tightness|tightening|pressure|heavy|heaviness|squeez\w*|crush\w*|burn|burns|burning|stabbing|sharp|discomfort)$/,
)

const CANNOT = is(/^(can't|cant|cannot|couldn't|couldnt|unable|hard|harder|trouble|troubles|struggl\w*|difficult|difficulty|problem|problems|labored|laboured)$/)
const BREATH = is(/^(breathe|breath|breathing|breathes)$/)

const SUDDEN = is(/^(sudden|suddenly)$/)
const STROKE_SIGN = is(/^(weak|weakness|numb|numbness|confused|confusion|droop\w*|slur\w*)$/)

const BLEED = is(/^(bleed|bleeds|bleeding|bled|blood)$/)
const HEAVY = is(/^(severe|heavy|heavily|lots|lot|bad|badly|uncontrolled|pouring|gushing|everywhere)$/)
const WONT_STOP = /\b(won't|wont|will not|doesn't|doesnt|does not|can't|cant|cannot|isn't|isnt|not) stop(ping)? (the )?(bleed|bleeding)\b|\b(bleed|bleeding|blood)( \w+){0,2} (won't|wont|will not|doesn't|doesnt|does not|isn't|isnt) stop/
const BRING_UP_BLOOD = /\b(cough\w*|vomit\w*|throw\w* up|threw up|spit\w* up|spitting) (up )?(some |a lot of |lots of )?blood\b|\bblood in (my |the )?(vomit|sick|spit)\b|\b(vomit\w*|sick) (with |has )?blood\b/

// Is there a word matching `a` and one matching `b` within `gap` words of each
// other in this clause? Returns the span of words, or null.
function near(words, a, b, gap = 5, { ordered = false } = {}) {
  for (let i = 0; i < words.length; i += 1) {
    if (!a(words[i])) continue
    const from = ordered ? i + 1 : Math.max(0, i - gap)
    const to = Math.min(words.length - 1, i + gap)
    for (let j = from; j <= to; j += 1) {
      if (j !== i && b(words[j])) {
        return words.slice(Math.min(i, j), Math.max(i, j) + 1).join(' ')
      }
    }
  }
  return null
}

function phrase(clause, pattern) {
  const match = clause.join(' ').match(pattern)
  return match ? match[0].trim() : null
}

// ---------------------------------------------------------------------------
// The flags. Each `find` gets one clause (a list of words) and returns the
// words it matched, or null.
// ---------------------------------------------------------------------------

const RED_FLAGS = [
  {
    id: 'self-harm',
    label: 'thoughts of hurting yourself',
    find: (words) =>
      phrase(
        words,
        /\b(suicid\w*|kill(ing)? myself|end(ing)? (my life|it all)|take my (own )?life|self ?harm\w*|better off dead|no reason to live|(want|wanted|wanting|wish) (to )?(die|be dead)|(don't|dont|do not) want to (live|be alive|be here|wake up)|(hurt|harm|cut|cutting|hurting|harming) myself on purpose|(cutting|harming) myself|(want|wanted|wanting|going|thinking about|thoughts? of|urge to|might|feel like|plan to|planning to)( to)? (hurt|harm|cut|kill)(ing)? myself)\b/,
      ),
  },
  {
    id: 'chest-pain',
    label: 'chest pain or pressure',
    find: (words) =>
      near(words, CHEST, CHEST_FEELING, 6) ?? phrase(words, /\bheart attack\b/),
  },
  {
    id: 'breathing',
    label: 'trouble breathing',
    find: (words) =>
      near(words, CANNOT, BREATH, 4, { ordered: true }) ??
      phrase(
        words,
        /\b(short(ness)? of breath|out of breath|breathless\w*|gasp\w*|choking|can't get (enough )?air|cannot get (enough )?air|not getting (enough )?air)\b/,
      ),
  },
  {
    id: 'stroke',
    label: 'signs of a stroke',
    find: (words) =>
      phrase(
        words,
        /\b(stroke|(face|mouth|smile)( is| looks| has)? (droop\w*|drooped|lopsided|uneven)|droop\w* (face|mouth|smile)|slurr?\w* (speech|words|my words)|(speech|words) (is |are )?slurr?\w*|slurring|worst headache)\b/,
      ) ??
      phrase(
        words,
        /\b(can't|cant|cannot|couldn't|unable to|trouble|hard to|struggling to|difficulty) (speak|speaking|talk|talking|get (my )?words out)(?! (to|about|with|it|this)\b)/,
      ) ??
      near(words, SUDDEN, STROKE_SIGN, 4, { ordered: true }) ??
      phrase(words, /\b(weak\w*|numb\w*|tingl\w*|droop\w*)( \w+){0,4} (one|left|right) side\b|\bone side of (my|the) (face|body)\b/) ??
      phrase(
        words,
        /\bsudden(ly)? (\w+ ){0,3}(severe|bad|terrible|awful|worst|horrible|excruciating)( \w+){0,2} headache\b|\b(severe|terrible|awful|horrible|excruciating) (\w+ )?headache (came on |that came on |started )?(sudden|suddenly|out of nowhere)\b/,
      ),
  },
  {
    id: 'fainting',
    label: 'fainting or passing out',
    find: (words) =>
      phrase(
        words,
        /\b(faint(ed|ing|s)?|pass(ed|es|ing)? out|black(ed|s|ing)? out|lost consciousness|losing consciousness|lose consciousness|unconscious|keeled over|collapsed)\b/,
      ),
  },
  {
    id: 'bleeding',
    label: 'heavy bleeding',
    find: (words) =>
      phrase(words, WONT_STOP) ?? phrase(words, BRING_UP_BLOOD) ?? near(words, HEAVY, BLEED, 3),
  },
]

// The question the card asks, for each flag.
export const RED_FLAG_QUESTIONS = {
  'chest-pain': 'Are you having chest pain, pressure or tightness right now?',
  breathing: 'Are you having trouble breathing right now?',
  stroke:
    'Do you have a drooping face, slurred speech, sudden weakness or numbness, or a sudden very bad headache right now?',
  fainting: 'Have you just fainted or passed out, or do you feel faint right now?',
  bleeding: 'Are you bleeding heavily, or bleeding that will not stop, right now?',
  'self-harm': 'Are you thinking about hurting yourself?',
}

// ---------------------------------------------------------------------------
// "No, continue" is remembered for the rest of the browser session.
// ---------------------------------------------------------------------------

const STORAGE_KEY = 'visit-buddy:red-flags-dismissed'
const dismissed = new Set()

function loadDismissed() {
  try {
    const saved = JSON.parse(window.sessionStorage.getItem(STORAGE_KEY) || '[]')
    if (Array.isArray(saved)) saved.forEach((key) => dismissed.add(key))
  } catch {
    // No storage (private window, tests): the memory copy is enough.
  }
}
loadDismissed()

const keyOf = (flag) => `${flag.id}:${flag.words}`

// After "I'm safe right now, continue", a small 988 line stays on the page for
// the rest of the browser session (components/CrisisLineBanner.jsx).
const CRISIS_LINE_KEY = 'visit-buddy:crisis-line'
let crisisLine = false
try {
  crisisLine = window.sessionStorage.getItem(CRISIS_LINE_KEY) === '1'
} catch {
  // No storage: remembered in memory only.
}

export function crisisLineWanted() {
  return crisisLine
}

export function dismissRedFlag(flag) {
  if (!flag) return
  if (flag.id === 'self-harm') {
    crisisLine = true
    try {
      window.sessionStorage.setItem(CRISIS_LINE_KEY, '1')
    } catch {
      // Memory only.
    }
  }
  dismissed.add(keyOf(flag))
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify([...dismissed]))
  } catch {
    // Keep it in memory only.
  }
}

/*
 * Every red flag in the text: [{ id, label, words }]
 *   words = the part of their text that matched, for the card to repeat.
 */
export function findRedFlags(text) {
  const found = []
  const clauses = clausesOf(text)
  for (const flag of RED_FLAGS) {
    for (const words of clauses) {
      const matched = flag.find(words)
      if (matched) {
        found.push({ id: flag.id, label: flag.label, words: matched })
        break
      }
    }
  }
  return found
}

/*
 * The first red flag that still needs asking about, or null. A phrase already
 * answered "No, continue" (or "I'm safe right now") this session is skipped.
 */
export function findRedFlag(text, { includeDismissed = false } = {}) {
  return findRedFlags(text).find((flag) => includeDismissed || !dismissed.has(keyOf(flag))) ?? null
}

export const RED_FLAG_IDS = RED_FLAGS.map((flag) => flag.id)
