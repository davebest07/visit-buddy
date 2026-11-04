import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

// The appearance settings. The AI itself is no longer mocked, so there is no
// "pretend the AI failed" switch to persist any more.
export const TEXT_SCALES = ['normal', 'large', 'extra-large']
export const CONTRASTS = ['normal', 'high']
// 'system' follows the device; light and dark override it.
export const THEMES = ['system', 'light', 'dark']

export const SETTINGS_STORAGE_KEY = 'visit-buddy:settings'
const STORAGE_KEY = SETTINGS_STORAGE_KEY

const DARK_QUERY = '(prefers-color-scheme: dark)'

const DEFAULTS = {
  textScale: 'normal',
  contrast: 'normal',
  theme: 'system',
}

// localStorage can throw (private mode, disabled storage). Never let that
// break the app: fall back to the defaults.
function readStoredSettings() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULTS

    const saved = JSON.parse(raw)
    return {
      textScale: TEXT_SCALES.includes(saved.textScale) ? saved.textScale : DEFAULTS.textScale,
      contrast: CONTRASTS.includes(saved.contrast) ? saved.contrast : DEFAULTS.contrast,
      theme: THEMES.includes(saved.theme) ? saved.theme : DEFAULTS.theme,
    }
  } catch {
    return DEFAULTS
  }
}

// matchMedia is missing in a few embedded browsers, and older Safari only has
// the deprecated addListener API. Both are handled so the toggle still works.
function systemPrefersDark() {
  try {
    return window.matchMedia(DARK_QUERY).matches
  } catch {
    return false
  }
}

function resolveTheme(theme) {
  if (theme === 'dark' || theme === 'light') return theme
  return systemPrefersDark() ? 'dark' : 'light'
}

const SettingsContext = createContext(null)

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(readStoredSettings)
  const [resolvedTheme, setResolvedTheme] = useState(() => resolveTheme(settings.theme))

  // When the choice is "system", follow the device live — a user switching
  // their OS to dark mode should not have to reload the page.
  useEffect(() => {
    setResolvedTheme(resolveTheme(settings.theme))

    if (settings.theme !== 'system') return undefined

    let query
    try {
      query = window.matchMedia(DARK_QUERY)
    } catch {
      return undefined
    }

    const onChange = (event) => setResolvedTheme(event.matches ? 'dark' : 'light')
    if (query.addEventListener) {
      query.addEventListener('change', onChange)
      return () => query.removeEventListener('change', onChange)
    }

    query.addListener(onChange)
    return () => query.removeListener(onChange)
  }, [settings.theme])

  // Settings are written onto <html> as data attributes; tokens.css and
  // index.css read them to change text size, contrast and theme.
  useEffect(() => {
    const root = document.documentElement
    root.dataset.textScale = settings.textScale
    root.dataset.contrast = settings.contrast
    root.dataset.theme = resolvedTheme

    // Matches the browser chrome (mobile address bar) to the page.
    const meta = document.querySelector('meta[name="theme-color"]')
    if (meta) meta.setAttribute('content', resolvedTheme === 'dark' ? '#0a1513' : '#f7faf8')

    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
    } catch {
      // Saving is a nice-to-have; the app still works without it.
    }
  }, [settings, resolvedTheme])

  const setTextScale = useCallback((textScale) => {
    setSettings((current) => ({ ...current, textScale }))
  }, [])

  const setContrast = useCallback((contrast) => {
    setSettings((current) => ({ ...current, contrast }))
  }, [])

  const setTheme = useCallback((theme) => {
    setSettings((current) => ({ ...current, theme }))
  }, [])

  const value = useMemo(
    () => ({
      textScale: settings.textScale,
      contrast: settings.contrast,
      theme: settings.theme,
      resolvedTheme,
      setTextScale,
      setContrast,
      setTheme,
    }),
    [settings, resolvedTheme, setTextScale, setContrast, setTheme],
  )

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>
}

export function useSettings() {
  const value = useContext(SettingsContext)
  if (!value) {
    throw new Error('useSettings must be used inside <SettingsProvider>')
  }
  return value
}
