import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'

// The three settings the brief asks for, plus the list of valid AI modes so the
// URL parameter can be checked before it is trusted.
export const TEXT_SCALES = ['normal', 'large', 'extra-large']
export const CONTRASTS = ['normal', 'high']
export const AI_MODES = [
  'success',
  'slow',
  'uncertain',
  'empty',
  'error',
  'timeout',
  'ratelimit',
]

const STORAGE_KEY = 'visit-buddy:settings'

const DEFAULTS = {
  textScale: 'normal',
  contrast: 'normal',
  aiMode: 'success',
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
      aiMode: AI_MODES.includes(saved.aiMode) ? saved.aiMode : DEFAULTS.aiMode,
    }
  } catch {
    return DEFAULTS
  }
}

const SettingsContext = createContext(null)

export function SettingsProvider({ children }) {
  const [searchParams] = useSearchParams()
  const [settings, setSettings] = useState(readStoredSettings)

  // ?ai= wins over the saved setting, so a demo link can force a state.
  const urlMode = searchParams.get('ai')
  const resolvedAiMode = AI_MODES.includes(urlMode) ? urlMode : settings.aiMode

  // Settings are written onto <html> as data attributes; tokens.css and
  // index.css read them to change text size and contrast.
  useEffect(() => {
    const root = document.documentElement
    root.dataset.textScale = settings.textScale
    root.dataset.contrast = settings.contrast

    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
    } catch {
      // Saving is a nice-to-have; the app still works without it.
    }
  }, [settings])

  const setTextScale = useCallback((textScale) => {
    setSettings((current) => ({ ...current, textScale }))
  }, [])

  const setContrast = useCallback((contrast) => {
    setSettings((current) => ({ ...current, contrast }))
  }, [])

  const setAiMode = useCallback((aiMode) => {
    setSettings((current) => ({ ...current, aiMode }))
  }, [])

  const value = useMemo(
    () => ({
      textScale: settings.textScale,
      contrast: settings.contrast,
      aiMode: settings.aiMode,
      resolvedAiMode,
      setTextScale,
      setContrast,
      setAiMode,
    }),
    [settings, resolvedAiMode, setTextScale, setContrast, setAiMode],
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
