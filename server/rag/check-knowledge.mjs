// Knowledge base checks. Run with: npm run test:knowledge
//
// - "ask-doctor" entries are questions the person asks the doctor, so they
//   never speak to the person ("your", "have you", "what would you most like").
// - "interview" entries are questions for the person, so they never say "my".
// - Templates only use {problem}, {part} and {feels}.
// - Every entry is a question, and ids are unique.
import { loadKnowledge } from './search.js'

const chunks = loadKnowledge()
const problems = []
const ids = new Set()
// Wording a doctor uses to ask the person something.
const TO_THE_PERSON =
  /\byour\b|\b(have|did|are|were) you\b|\bdo you (have|feel|get|take|notice|ever|usually)\b|\bwhat would you most like\b|\bhow would you describe\b|\bwhen did\b/i

// The old wording that slipped into the result list must fail this check.
if (!TO_THE_PERSON.test('What would you most like to understand about the dizziness at this visit?')) {
  throw new Error('check-knowledge: the "speaks to the person" rule no longer catches the known bad case')
}

for (const chunk of chunks) {
  if (ids.has(chunk.id)) problems.push(`${chunk.id}: duplicate id`)
  ids.add(chunk.id)
  if (!chunk.question.trim().endsWith('?')) problems.push(`${chunk.id}: not a question`)
  if (chunk.use === 'ask-doctor' && TO_THE_PERSON.test(chunk.question)) {
    problems.push(`${chunk.id}: ask-doctor but it asks the person: "${chunk.question}"`)
  }
  if (chunk.use === 'interview' && /\bmy\b/i.test(chunk.question)) {
    problems.push(`${chunk.id}: interview question says "my": "${chunk.question}"`)
  }
  if (chunk.template) {
    const unknown = chunk.template.match(/\{(?!problem\}|part\}|feels\})[^}]*\}/)
    if (unknown) problems.push(`${chunk.id}: unknown template slot ${unknown[0]}`)
    if (TO_THE_PERSON.test(chunk.template)) problems.push(`${chunk.id}: template asks the person`)
  }
}

const askDoctor = chunks.filter((chunk) => chunk.use === 'ask-doctor').length
console.log(`${chunks.length} entries (${askDoctor} ask-doctor, ${chunks.length - askDoctor} interview).`)
if (problems.length) {
  console.log(problems.map((problem) => `  FAIL ${problem}`).join('\n'))
  process.exit(1)
}
console.log('All checks passed.')
