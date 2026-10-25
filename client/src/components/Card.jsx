// Panels. One geometry, a small set of tones, so every screen belongs together.
const TONES = {
  paper: 'border-line bg-surface',
  'tint-blue': 'border-transparent bg-tint-blue',
  'tint-sky': 'border-transparent bg-tint-sky',
  'tint-slate': 'border-transparent bg-tint-slate',
  navy: 'border-white/10 bg-navy-2 text-paper',
  glass: 'border-white/15 bg-white/5 text-paper backdrop-blur-xl',
}

export default function Card({ as: Tag = 'div', tone = 'paper', className = '', children, ...props }) {
  const dark = tone === 'navy' || tone === 'glass'

  return (
    <Tag
      className={`rounded-card border p-6 ${dark ? '' : 'shadow-soft'} ${
        TONES[tone] ?? TONES.paper
      } ${className}`}
      {...props}
    >
      {children}
    </Tag>
  )
}
