import assert from 'node:assert/strict'
import test from 'node:test'
import { cleanText, groundQuote, normalise, takeList } from './grounding.js'

const TRANSCRIPT =
  'She said my knee pain is probably from wear. She started me on Bellaprin, ' +
  'one tablet every morning with food. Call if the dizziness gets worse.'

test('accepts a quote that appears word for word', () => {
  assert.equal(
    groundQuote('my knee pain is probably from wear', TRANSCRIPT),
    'my knee pain is probably from wear',
  )
})

test('accepts a quote that differs only in case', () => {
  assert.equal(groundQuote('She Said My Knee Pain', TRANSCRIPT), 'She Said My Knee Pain')
})

test('accepts a quote when the source has different spacing', () => {
  const spaced = 'She said my knee pain\nis   probably from wear.'
  assert.equal(groundQuote('my knee pain is probably from wear', spaced), 'my knee pain is probably from wear')
})

test('accepts a quote with curly apostrophes against a straight one', () => {
  const source = "I didn't catch the dose."
  assert.equal(groundQuote('I didn\u2019t catch the dose', source), 'I didn\u2019t catch the dose')
})

test('accepts a quote the model ended with a full stop', () => {
  assert.equal(
    groundQuote('one tablet every morning with food.', TRANSCRIPT),
    'one tablet every morning with food.',
  )
})

test('rejects a paraphrase', () => {
  assert.equal(groundQuote('your knee pain is due to wear and tear', TRANSCRIPT), null)
})

test('rejects a quote stitched from two clauses', () => {
  assert.equal(groundQuote('knee pain is probably from wear and call if dizzy', TRANSCRIPT), null)
})

test('rejects an invented sentence', () => {
  assert.equal(groundQuote('Take two tablets twice a day', TRANSCRIPT), null)
})

test('rejects an empty or whitespace quote', () => {
  assert.equal(groundQuote('', TRANSCRIPT), null)
  assert.equal(groundQuote('   ', TRANSCRIPT), null)
  assert.equal(groundQuote(null, TRANSCRIPT), null)
  assert.equal(groundQuote(undefined, TRANSCRIPT), null)
})

test('rejects everything when the source is empty', () => {
  assert.equal(groundQuote('anything', ''), null)
  assert.equal(groundQuote('anything', null), null)
})

test('accepts a quote that is the whole source', () => {
  assert.equal(groundQuote('Call if the dizziness gets worse', TRANSCRIPT), 'Call if the dizziness gets worse')
})

test('normalise folds case, spacing and curly quotes', () => {
  assert.equal(normalise('  A\u2019B \n C '), "a'b c")
})

test('cleanText collapses whitespace and caps length', () => {
  assert.equal(cleanText('  a\n\nb   c  '), 'a b c')
  assert.equal(cleanText('abcdef', 3), 'abc')
  assert.equal(cleanText(null), '')
})

test('takeList caps length and rejects non-lists', () => {
  assert.deepEqual(takeList([1, 2, 3], 2), [1, 2])
  assert.deepEqual(takeList('nope', 2), [])
  assert.deepEqual(takeList(null, 2), [])
})
