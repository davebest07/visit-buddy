import Magnetic from './Magnetic.jsx'

const VARIANTS = {
  glass: 'vb-btn-glass',
  glassLight: 'vb-btn-glasslight',
  primary: 'bg-primary-solid text-paper shadow-soft hover:bg-primary-solid-hover',
  secondary: 'vb-btn-secondary',
  quiet: 'text-primary underline decoration-2 underline-offset-4 hover:text-primary-deep',
  ghost: 'text-muted vb-btn-ghost hover:text-primary',
  onDark: 'bg-paper text-navy hover:bg-white',
  danger: 'bg-error text-white hover:opacity-90',
}

const SIZES = {
  sm: 'px-4 py-2 text-small',
  md: 'px-6 py-2 text-body',
  lg: 'min-h-[64px] px-8 py-3 text-body',
}

// One button for the whole app. Glass variants carry the material; solid
// variants stay for medical workflows where clarity beats effect.
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
  const glass = variant === 'glass' || variant === 'glassLight'

  const element = (
    <Tag
      className={`inline-flex min-h-tap items-center justify-center gap-2 rounded-full font-bold transition-[transform,box-shadow,background-color,color] duration-200 active:scale-[0.975] disabled:pointer-events-none disabled:opacity-60 ${
        VARIANTS[variant] ?? VARIANTS.primary
      } ${SIZES[size] ?? SIZES.md} ${glass ? 'relative overflow-hidden' : ''} ${className}`}
      {...(isButton ? { type } : {})}
      {...props}
    >
      {children}
    </Tag>
  )

  return magnetic ? <Magnetic>{element}</Magnetic> : element
}
