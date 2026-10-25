import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

// shadcn's helper: merge conditional classes, with Tailwind conflicts resolved
// in favour of the last one.
export function cn(...inputs) {
  return twMerge(clsx(inputs))
}
