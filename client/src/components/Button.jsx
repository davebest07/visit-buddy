// One button for the whole app. `as` lets it render as a React Router <Link>
// or a plain <a> without losing the styles.
const VARIANTS = {
  primary: 'bg-accent text-white hover:bg-accent-strong',
  secondary: 'border border-line bg-surface text-ink hover:border-accent hover:text-accent',
  quiet: 'text-accent underline underline-offset-4 hover:text-accent-strong',
  inverse: 'bg-ink text-surface hover:bg-accent',
  onDark: 'bg-charcoal-text text-charcoal hover:bg-surface',
  danger: 'bg-error text-white hover:opacity-90',
}

export default function Button({
  as: Tag = 'button',
  variant = 'primary',
  className = '',
  type = 'button',
  children,
  ...props
}) {
  const isButton = Tag === 'button'

  return (
    <Tag
      className={`inline-flex min-h-tap items-center justify-center gap-2 rounded px-6 py-2 text-body font-bold transition-colors duration-fast ${VARIANTS[variant]} ${className}`}
      {...(isButton ? { type } : {})}
      {...props}
    >
      {children}
    </Tag>
  )
}
