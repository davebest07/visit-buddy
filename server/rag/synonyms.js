// Everyday words people use, mapped to the words the knowledge base uses.
// A phrase on the left adds the words on the right to the search. Multi-word
// phrases are matched before single words, so "lower back" wins over "back".
export const SYNONYMS = {
  // dizziness
  lightheaded: 'dizziness dizzy',
  'light headed': 'dizziness dizzy',
  'light-headed': 'dizziness dizzy',
  woozy: 'dizziness dizzy',
  vertigo: 'dizziness spinning',
  'room spins': 'dizziness spinning',
  'room spinning': 'dizziness spinning',
  'off balance': 'dizziness balance unsteady',
  unsteady: 'dizziness balance',
  giddy: 'dizziness',
  wobbly: 'dizziness unsteady',

  // chest discomfort (only reached after the red-flag check says "not right now")
  'chest ache': 'chest discomfort',
  'chest pain': 'chest discomfort',
  'tight chest': 'chest discomfort tightness',
  'chest tightness': 'chest discomfort tightness',
  'chest pressure': 'chest discomfort pressure',
  'heart pain': 'chest discomfort',

  // joint pain
  knee: 'joint knee',
  knees: 'joint knee',
  hip: 'joint hip',
  hips: 'joint hip',
  shoulder: 'joint shoulder',
  elbow: 'joint elbow',
  wrist: 'joint wrist',
  ankle: 'joint ankle',
  arthritis: 'joint stiff',
  'stiff joints': 'joint stiff',

  // back pain
  'lower back': 'back spine',
  'upper back': 'back spine',
  backache: 'back',
  sciatica: 'back leg spread',
  spine: 'back',

  // headache
  migraine: 'headache',
  migraines: 'headache',
  'head hurts': 'headache head',
  'head pain': 'headache head',
  'head is pounding': 'headache throbbing',
  pounding: 'throbbing',

  // stomach
  belly: 'stomach',
  tummy: 'stomach',
  abdomen: 'stomach',
  abdominal: 'stomach',
  gut: 'stomach',
  nauseous: 'stomach nausea',
  queasy: 'stomach nausea',
  'throwing up': 'stomach vomiting',
  'throw up': 'stomach vomiting',
  heartburn: 'stomach heartburn',
  indigestion: 'stomach heartburn',
  bloated: 'stomach bloating',
  diarrhoea: 'stomach diarrhea',

  // cough
  coughing: 'cough',
  phlegm: 'cough phlegm',
  mucus: 'cough phlegm',
  wheezy: 'cough wheezing',
  'chest cold': 'cough cold',

  // skin
  itchy: 'skin rash itch',
  itching: 'skin rash itch',
  hives: 'skin rash',
  spots: 'skin rash',
  bumps: 'skin rash',
  eczema: 'skin rash',
  blisters: 'skin rash blister',

  // tiredness
  tired: 'tiredness fatigue energy',
  exhausted: 'tiredness fatigue',
  'worn out': 'tiredness fatigue',
  'no energy': 'tiredness fatigue energy',
  'low energy': 'tiredness fatigue energy',
  drained: 'tiredness fatigue',
  sluggish: 'tiredness fatigue',

  // sleep
  insomnia: 'sleep',
  "can't sleep": 'sleep',
  'cannot sleep': 'sleep',
  'trouble sleeping': 'sleep',
  'waking up': 'sleep waking',
  snoring: 'sleep snore',
  snore: 'sleep snore',

  // mood and stress
  anxious: 'mood anxiety worried',
  anxiety: 'mood anxiety worried',
  stressed: 'mood stress',
  depressed: 'mood low sad',
  'feeling down': 'mood low sad',
  'feeling low': 'mood low sad',
  overwhelmed: 'mood stress',
  panicky: 'mood anxiety panic',
  'on edge': 'mood anxiety',

  // medicines
  meds: 'medicine medication',
  pill: 'medicine pill',
  pills: 'medicine pill',
  tablet: 'medicine pill',
  tablets: 'medicine pill',
  prescription: 'medicine prescription',
  dose: 'medicine dose',
  dosage: 'medicine dose',
  refill: 'medicine prescription',
  'side effect': 'medicine side effects',
  'side effects': 'medicine side effects',
  vitamins: 'medicine supplement',
  supplements: 'medicine supplement',
}
