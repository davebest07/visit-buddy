import { Check, Loader2, TriangleAlert } from 'lucide-react'
import Button from './Button.jsx'

// Idle -> loading -> success/error, with the label staying in place so the
// button never jumps. `state` is controlled by the caller: success is only
// shown after the operation actually resolved.
export default function StatefulButton({
  state = 'idle',
  loadingLabel = 'Working…',
  successLabel = 'Done',
  errorLabel = 'Try again',
  children,
  ...props
}) {
  const busy = state === 'loading'

  return (
    <Button {...props} disabled={busy || props.disabled} aria-busy={busy}>
      {busy ? <Loader2 size={20} className="animate-spin" aria-hidden="true" /> : null}
      {state === 'success' ? <Check size={20} aria-hidden="true" /> : null}
      {state === 'error' ? <TriangleAlert size={20} aria-hidden="true" /> : null}

      <span>
        {busy
          ? loadingLabel
          : state === 'success'
            ? successLabel
            : state === 'error'
              ? errorLabel
              : children}
      </span>
    </Button>
  )
}
