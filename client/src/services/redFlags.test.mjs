// Red-flag check tests. Run with: npm run test:redflags
import { findRedFlag } from './redFlags.js'

// [text, expected flag id]
const SHOULD_TRIGGER = [
  ['my chest is aching me', 'chest-pain'],
  ['chest feels tight', 'chest-pain'],
  ['pressure in my chest', 'chest-pain'],
  ['I have chest pain when I walk', 'chest-pain'],
  ['My CHEST HURTS', 'chest-pain'],
  ['a heavy feeling in my chest', 'chest-pain'],
  ['it feels like something is squeezing my chest', 'chest-pain'],
  ['crushing pain across my chest', 'chest-pain'],
  ['burning in the middle of my chest', 'chest-pain'],
  ['my heart hurts', 'chest-pain'],
  ['sharp pain near my heart when I climb stairs', 'chest-pain'],
  ['chest tightness at night', 'chest-pain'],
  ["I can't catch my breath", 'breathing'],
  ["I can't breathe properly", 'breathing'],
  ['it is hard to breathe when I lie down', 'breathing'],
  ['trouble breathing since this morning', 'breathing'],
  ["I'm struggling to breathe", 'breathing'],
  ['I get short of breath walking to the car', 'breathing'],
  ['out of breath all the time', 'breathing'],
  ['I was gasping for air', 'breathing'],
  ['my face is drooping on one side', 'stroke'],
  ['my speech is slurred', 'stroke'],
  ["I suddenly can't speak properly", 'stroke'],
  ['sudden weakness in my left arm', 'stroke'],
  ['numbness down my right side', 'stroke'],
  ['I got suddenly confused this morning', 'stroke'],
  ['worst headache of my life', 'stroke'],
  ['a sudden severe headache', 'stroke'],
  ['I fainted at work', 'fainting'],
  ['I passed out in the shower', 'fainting'],
  ['I blacked out for a minute', 'fainting'],
  ['I lost consciousness', 'fainting'],
  ['heavy bleeding that started today', 'bleeding'],
  ["the cut won't stop bleeding", 'bleeding'],
  ["it's bleeding a lot", 'bleeding'],
  ['coughing up blood', 'bleeding'],
  ['I have been vomiting blood', 'bleeding'],
  ['I want to kill myself', 'self-harm'],
  ['sometimes I think about ending my life', 'self-harm'],
  ['I hurt myself on purpose', 'self-harm'],
  ["I don't want to be alive anymore", 'self-harm'],
  ['I have been having suicidal thoughts', 'self-harm'],
]

const SHOULD_NOT_TRIGGER = [
  'I hurt myself lifting a box',
  'my chest cold is better',
  'I cough when I breathe cold air',
  'My knee has been hurting for two weeks',
  'I get dizzy when I stand up',
  "I'm not sure my morning pill is working",
  'I get heartburn after big meals',
  'my head hurts in the afternoon',
  'I feel lightheaded sometimes',
  'my elbow feels funny',
  'I have a rash on my arm',
  "I can't sleep at night",
  "I can't talk to my boss about my health",
  'the nosebleed stopped quickly',
  'my back aches after gardening',
  "I'm tired all the time",
  'I had a chest x-ray last year and it was fine',
  'I breathe through my mouth at night',
  'my stomach hurts after I eat',
  'I want to understand my blood test',
]

let failures = 0

console.log('Should trigger:')
for (const [text, expected] of SHOULD_TRIGGER) {
  const flag = findRedFlag(text)
  const ok = flag?.id === expected
  if (!ok) failures += 1
  console.log(
    `  ${ok ? 'PASS' : 'FAIL'}  "${text}" -> ${flag ? `${flag.id} ("${flag.words}")` : 'nothing'}${
      ok ? '' : `  (expected ${expected})`
    }`,
  )
}

console.log('\nShould not trigger:')
for (const text of SHOULD_NOT_TRIGGER) {
  const flag = findRedFlag(text)
  const ok = !flag
  if (!ok) failures += 1
  console.log(`  ${ok ? 'PASS' : 'FAIL'}  "${text}"${ok ? '' : ` -> ${flag.id} ("${flag.words}")`}`)
}

const total = SHOULD_TRIGGER.length + SHOULD_NOT_TRIGGER.length
console.log(`\n${total - failures} of ${total} passed.`)
process.exit(failures ? 1 : 0)
