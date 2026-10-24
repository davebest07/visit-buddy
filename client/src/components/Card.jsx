// A plain surface panel. No shadows by default: the brief keeps the UI flat
// and quiet, and borders do the work.
export default function Card({ as: Tag = 'div', className = '', children, ...props }) {
  return (
    <Tag className={`rounded border border-line bg-surface p-6 ${className}`} {...props}>
      {children}
    </Tag>
  )
}
