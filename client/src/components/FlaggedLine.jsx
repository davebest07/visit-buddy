// An unsure line: colour, an icon and words, never colour alone.
export default function FlaggedLine({ flagged = false, children }) {
  if (!flagged) return children

  return (
    <div className="rounded-card border-2 border-uncertain bg-uncertain p-4 text-uncertain-ink">
      <p className="flex items-center gap-2 text-small font-bold">
        <span aria-hidden="true">!</span>
        Not sure, ask your doctor or pharmacist
      </p>
      <div className="mt-2">{children}</div>
    </div>
  )
}
