import Magnetic from './Magnetic.jsx'

const VARIANTS = {
  primary: 'bg-evergreen text-cream shadow-soft hover:bg-evergreen-deep hover:shadow-lift',
  ember: 'bg-ember text-cream shadow-soft hover:bg-ember-bright hover:text-night',
  secondary: 'border border-line bg-surface text-ink hover:border-evergreen hover:text-evergreen',
  quiet: 'text-evergreen underline decoration-2 underline-offset-4 hover:text-evergreen-deep',
  onDark: 'bg-cream text-night hover:bg-white',
  ghostDark: 'border border-white/25 bg-transparent text-cream hover:border-cream',
  danger: 'bg-error text-white hover:opacity-90',
}

const SIZES = {
  md: 'px-6 py-2 text-body',
  sm: 'px-4 py-2 text-small',
}

// One button for the whole app. `as` lets it render as a Link or an anchor.
export default function Button({
  as: Tag = 'button',
  variant = 'primary',
  size = 'md',
  magnetic = false,
  className = '',
  type = 'button',
  children,
  ...props
}) {
  const isButton = Tag === 'button'

  const element = (
    <Tag
      className={`inline-flex min-h-tap items-center justify-center gap-2 rounded-full font-bold transition-all duration-calm ${
        VARIANTS[variant] ?? VARIANTS.primary
      } ${SIZES[size] ?? SIZES.md} ${className}`}
      {...(isButton ? { type } : {})}
      {...props}
    >
      {children}
    </Tag>
  )

  return magnetic ? <Magnetic>{element}</Magnetic> : element
}
