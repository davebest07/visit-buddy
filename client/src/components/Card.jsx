// A panel. `tone` picks one of the soft tints from the healthcare-dashboard
// reference; the default keeps a plain white surface for reading-heavy content.
const TONES = {
  surface: 'border-line bg-surface',
  mint: 'border-mint bg-mint',
  peach: 'border-peach bg-peach',
  sky: 'border-sky bg-sky',
}

export default function Card({ as: Tag = 'div', tone = 'surface', className = '', children, ...props }) {
  return (
    <Tag
      className={`rounded-card border p-6 shadow-soft ${TONES[tone] ?? TONES.surface} ${className}`}
      {...props}
    >
      {children}
    </Tag>
  )
}
