import { Camera, FileText } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { readDocument } from '../services/aiService.js'
import AIShell, { useAICall } from './AIShell.jsx'
import Button from './Button.jsx'

/*
 * "Scan a paper": photos (or a PDF) of the paper from the visit, read into text.
 *
 * Pages live only in this component's memory as File objects with a local
 * preview URL. They are never saved, never put in storage and never uploaded:
 * readDocument() is a mock that runs in the browser. Leaving the page drops
 * them and frees the previews.
 *
 * When the words come back, onRead(text) hands them to the page, which shows
 * them for checking before anything is summarized.
 */

const ACCEPT = 'image/*,application/pdf'
const READABLE = /^(image\/|application\/pdf$)/
const MAX_PAGES = 10
const MAX_BYTES = 25 * 1024 * 1024
const READ_STEPS = ['Looking at your pages', 'Reading the words', 'Marking anything hard to read']

let lastId = 0
function toPage(file) {
  const isPdf = file.type === 'application/pdf'
  lastId += 1
  return {
    id: lastId,
    file,
    name: file.name || 'Photo',
    isPdf,
    url: isPdf ? null : URL.createObjectURL(file),
  }
}

function release(page) {
  if (page?.url) URL.revokeObjectURL(page.url)
}

function sortFiles(files) {
  const good = []
  const problems = []
  for (const file of Array.from(files ?? [])) {
    if (!READABLE.test(file.type)) problems.push(`“${file.name}” is not a photo or a PDF.`)
    else if (file.size > MAX_BYTES) problems.push(`“${file.name}” is too big (over 25 MB).`)
    else good.push(file)
  }
  return { good, problems }
}

const outlineButton =
  'flex min-h-tap items-center gap-3 rounded-full border border-primary bg-transparent px-6 py-2 text-body font-bold text-primary transition-colors duration-fast hover:bg-primary-soft disabled:pointer-events-none disabled:opacity-60'
const smallLink =
  'min-h-tap px-2 text-small font-bold underline underline-offset-4 disabled:opacity-50'

export default function ScanPaper({ onRead, onBusyChange, onTypeInstead, disabled = false }) {
  const [pages, setPages] = useState([])
  const [problem, setProblem] = useState(null)
  const [announcement, setAnnouncement] = useState('')
  const [noPreview, setNoPreview] = useState(() => new Set())

  const cameraRef = useRef(null)
  const pickerRef = useRef(null)
  const retakeRef = useRef(null)
  const scanButtonRef = useRef(null)
  const retakeIndex = useRef(null)
  const pagesRef = useRef(pages)
  const onReadRef = useRef(onRead)

  useEffect(() => {
    pagesRef.current = pages
  }, [pages])

  useEffect(() => {
    onReadRef.current = onRead
  }, [onRead])

  // Free the previews when the page is left.
  useEffect(() => () => pagesRef.current.forEach(release), [])

  const request = useCallback(
    (signal) => readDocument(pages.map((page) => page.file), { signal }),
    [pages],
  )
  const reading = useAICall(request)
  const busy = reading.status === 'loading'
  const resetReading = reading.reset

  useEffect(() => {
    onBusyChange?.(busy)
  }, [busy, onBusyChange])

  // The words are handed over once, then this panel goes quiet again.
  useEffect(() => {
    if (typeof reading.data === 'string' && reading.data) {
      onReadRef.current?.(reading.data)
      resetReading()
    }
  }, [reading.data, resetReading])

  function addFiles(files) {
    const { good, problems } = sortFiles(files)
    const room = MAX_PAGES - pages.length
    const taken = good.slice(0, Math.max(room, 0))
    if (good.length > taken.length) problems.push(`You can add up to ${MAX_PAGES} pages.`)
    setProblem(problems.length ? problems.join(' ') : null)
    if (!taken.length) return

    const total = pages.length + taken.length
    setPages((current) => [...current, ...taken.map(toPage)])
    setAnnouncement(
      `${taken.length === 1 ? 'Page' : `${taken.length} pages`} added. ${total} page${total === 1 ? '' : 's'} in all.`,
    )
    resetReading()
  }

  function handlePick(event) {
    addFiles(event.target.files)
    event.target.value = ''
  }

  function startRetake(index) {
    retakeIndex.current = index
    retakeRef.current?.click()
  }

  function handleRetake(event) {
    const index = retakeIndex.current
    const { good, problems } = sortFiles(event.target.files)
    event.target.value = ''
    if (index == null || !pages[index]) return
    if (!good.length) {
      if (problems.length) setProblem(problems.join(' '))
      return
    }
    const fresh = toPage(good[0])
    release(pages[index])
    setPages((current) => current.map((page, i) => (i === index ? fresh : page)))
    setProblem(null)
    setAnnouncement(`Page ${index + 1} replaced.`)
    resetReading()
  }

  function remove(index) {
    const left = pages.length - 1
    release(pages[index])
    setPages((current) => current.filter((_, i) => i !== index))
    setAnnouncement(`Page ${index + 1} removed. ${left} page${left === 1 ? '' : 's'} left.`)
    resetReading()
    // The button that was pressed is gone: keep keyboard focus nearby.
    requestAnimationFrame(() => scanButtonRef.current?.focus())
  }

  const count = pages.length
  const unreadable =
    reading.status === 'error' && ['empty', 'unreadable'].includes(reading.error?.kind)

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <button
          ref={scanButtonRef}
          type="button"
          onClick={() => cameraRef.current?.click()}
          disabled={disabled || busy || count >= MAX_PAGES}
          className={outlineButton}
        >
          <Camera aria-hidden="true" className="h-5 w-5" />
          {count ? 'Add a page' : 'Scan a paper'}
        </button>
        <Button
          variant="quiet"
          size="sm"
          onClick={() => pickerRef.current?.click()}
          disabled={disabled || busy || count >= MAX_PAGES}
        >
          Choose a photo or PDF
        </Button>
      </div>
      <p className="mt-2 text-small text-muted">
        Got a printed summary from the visit? Take a photo of each page. Each page is sent to
        our server and to the AI provider to read the words, then discarded. Only scan a paper
        you are comfortable sharing.
      </p>
      <p className="mt-1 text-small text-muted">
        If the camera shows a black screen, allow camera access for this browser in your
        phone's settings, or use Choose a photo or PDF instead.
      </p>

      {problem ? (
        <p role="alert" className="mt-2 text-small font-bold text-error">
          {problem}
        </p>
      ) : null}

      {count ? (
        <section aria-labelledby="scan-pages" className="mt-4 rounded-card border border-line bg-surface-2 p-4">
          <h3 id="scan-pages" className="text-body font-bold">
            Your pages ({count})
          </h3>
          <ol className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {pages.map((page, index) => (
              <li key={page.id} className="rounded-card border border-line bg-surface p-2">
                <div className="flex aspect-[3/4] items-center justify-center overflow-hidden rounded bg-surface-2">
                  {page.url && !noPreview.has(page.id) ? (
                    <img
                      src={page.url}
                      alt={`Page ${index + 1}`}
                      className="h-full w-full object-cover"
                      onError={() => setNoPreview((current) => new Set(current).add(page.id))}
                    />
                  ) : (
                    <FileText aria-hidden="true" className="h-10 w-10 text-muted" />
                  )}
                </div>
                <p className="mt-2 text-small font-bold">Page {index + 1}</p>
                <p className="truncate text-small text-muted" title={page.name}>
                  {page.isPdf ? 'PDF: ' : ''}
                  {page.name}
                </p>
                <div className="mt-1 flex flex-wrap">
                  <button
                    type="button"
                    onClick={() => startRetake(index)}
                    disabled={busy}
                    aria-label={`Retake page ${index + 1}`}
                    className={`${smallLink} text-primary`}
                  >
                    Retake
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(index)}
                    disabled={busy}
                    aria-label={`Remove page ${index + 1}`}
                    className={`${smallLink} text-error`}
                  >
                    Remove
                  </button>
                </div>
              </li>
            ))}
          </ol>

          <div className="mt-4">
            <Button onClick={reading.run} disabled={disabled || busy}>
              {busy ? 'Reading…' : count > 1 ? `Read ${count} pages` : 'Read my paper'}
            </Button>
          </div>
        </section>
      ) : null}

      {unreadable ? (
        <section role="alert" className="mt-4 rounded-card border-l-4 border-error bg-surface p-6">
          <h3 className="text-subhead font-bold text-error">I could not find any words on your pages.</h3>
          <p className="mt-2 max-w-measure text-body text-muted">
            Try again with the paper flat, in good light, with the whole page in the photo. Or
            type what it says.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button variant="secondary" onClick={reading.run}>
              Retry
            </Button>
            {onTypeInstead ? (
              <Button variant="quiet" onClick={onTypeInstead}>
                Type it instead
              </Button>
            ) : null}
          </div>
        </section>
      ) : reading.status === 'loading' || reading.status === 'error' ? (
        <div className="mt-4">
          <AIShell
            status={reading.status}
            error={reading.error}
            elapsed={reading.elapsed}
            steps={READ_STEPS}
            loadingTitle="Reading your paper"
            onCancel={reading.cancel}
            onRetry={reading.run}
            onTypeInstead={onTypeInstead}
          />
        </div>
      ) : null}

      <p className="sr-only" aria-live="polite">
        {announcement}
      </p>

      {/* The camera on phones; a file picker elsewhere. */}
      <input
        ref={cameraRef}
        type="file"
        accept={ACCEPT}
        capture="environment"
        multiple
        hidden
        onChange={handlePick}
      />
      <input ref={pickerRef} type="file" accept={ACCEPT} multiple hidden onChange={handlePick} />
      <input
        ref={retakeRef}
        type="file"
        accept={ACCEPT}
        capture="environment"
        hidden
        onChange={handleRetake}
      />
    </div>
  )
}
