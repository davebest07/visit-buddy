// "Why this question": the reason a line is here and the source it came from.
export default function WhyLine({ why, label = 'Why this question' }) {
  if (!why?.reason && !why?.source?.name) return null
  const source = why.source

  return (
    <p className="mt-2 text-small text-muted">
      <span className="font-bold text-ink">{label}:</span> {why.reason}
      {source?.name ? (
        <>
          {' '}
          <span className="whitespace-nowrap">Source:</span>{' '}
          {source.url ? (
            <a
              href={source.url}
              target="_blank"
              rel="noreferrer"
              className="text-primary underline underline-offset-4"
            >
              {source.name}
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
          ) : (
            source.name
          )}
        </>
      ) : null}
    </p>
  )
}
