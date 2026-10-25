// Panels. Four tones, one geometry, so every screen belongs to the same family.
const TONES = {
  paper: 'border-line bg-surface',
  tint: 'border-transparent bg-sage',
  sand: 'border-transparent bg-sand',
  mist: 'border-transparent bg-mist',
  night: 'border-white/10 bg-night-2 text-cream',
  glass: 'border-white/15 bg-white/5 text-cream backdrop-blur-xl',
}

export default function Card({ as: Tag = 'div', tone = 'paper', className = '', children, ...props }) {
  return (
    <Tag
      className={`rounded-card border p-6 ${
        tone === 'night' || tone === 'glass' ? '' : 'shadow-soft'
      } ${TONES[tone] ?? TONES.paper} ${className}`}
      {...props}
    >
      {children}
    </Tag>
  )
}
