/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        canvas: 'var(--vb-canvas)',
        surface: 'var(--vb-surface)',
        'surface-2': 'var(--vb-surface-2)',
        sidebar: 'var(--vb-sidebar)',
        'sidebar-line': 'var(--vb-sidebar-line)',
        ink: 'var(--vb-text)',
        muted: 'var(--vb-muted)',
        line: 'var(--vb-line)',
        primary: 'var(--vb-primary)',
        'primary-deep': 'var(--vb-primary-deep)',
        'primary-soft': 'var(--vb-primary-soft)',
        'primary-strong': 'var(--vb-primary-strong)',
        // Filled brand: identical to primary in light mode, deliberately darker
        // in dark mode so white label text still passes WCAG AA.
        'primary-solid': 'var(--vb-primary-solid)',
        'primary-solid-hover': 'var(--vb-primary-solid-hover)',
        // Theme-aware chrome for sticky bars, the drawer and nav hover states.
        chrome: 'var(--vb-chrome)',
        'sidebar-chrome': 'var(--vb-sidebar-chrome)',
        'chrome-line': 'var(--vb-chrome-line)',
        'chrome-line-strong': 'var(--vb-chrome-line-strong)',
        'hover-surface': 'var(--vb-hover)',
        scrim: 'var(--vb-scrim)',
        knob: 'var(--vb-knob)',
        accent: 'var(--vb-accent)',
        'accent-bright': 'var(--vb-accent-bright)',
        'accent-soft': 'var(--vb-accent-soft)',
        'accent-strong': 'var(--vb-accent-strong)',
        'medical-cyan': 'var(--vb-cyan)',
        navy: 'var(--vb-navy)',
        'navy-2': 'var(--vb-navy-2)',
        paper: 'var(--vb-paper)',
        'paper-muted': 'var(--vb-paper-muted)',
        'tint-blue': 'var(--vb-tint-blue)',
        'tint-sky': 'var(--vb-tint-sky)',
        'tint-slate': 'var(--vb-tint-slate)',
        error: 'var(--vb-error)',
        success: 'var(--vb-success)',
        uncertain: {
          DEFAULT: 'var(--vb-uncertain-bg)',
          ink: 'var(--vb-uncertain-text)',
        },
        background: 'var(--vb-canvas)',
      },
      fontFamily: {
        sans: ['var(--vb-font)'],
        display: ['var(--vb-font-display)'],
      },
      fontSize: {
        small: ['var(--vb-text-small)', { lineHeight: '1.5' }],
        body: ['var(--vb-text-body)', { lineHeight: '1.6' }],
        subhead: ['var(--vb-text-subhead)', { lineHeight: '1.35' }],
        heading: ['var(--vb-text-heading)', { lineHeight: '1.2' }],
        hero: ['var(--vb-text-hero)', { lineHeight: '1.08' }],
        display: ['var(--vb-text-display)', { lineHeight: '1.02', letterSpacing: '-0.02em' }],
        mega: ['var(--vb-text-mega)', { lineHeight: '0.98', letterSpacing: '-0.03em' }],
      },
      // The brief's spacing scale is 4 / 8 / 16 / 24 / 32 px. These overrides
      // keep Tailwind's 1 / 2 / 4 / 6 / 8 classes on exactly those values,
      // even though the root font is 20px instead of 16px.
      spacing: {
        1: '4px',
        2: '8px',
        4: '16px',
        6: '24px',
        8: '32px',
      },
      borderRadius: {
        DEFAULT: 'var(--vb-radius)',
        card: 'var(--vb-radius-card)',
        xl: 'var(--vb-radius-xl)',
      },
      boxShadow: {
        soft: 'var(--vb-shadow)',
        lift: 'var(--vb-shadow-lift)',
        calm: 'var(--vb-shadow)',
      },
      minHeight: { tap: 'var(--vb-tap)' },
      minWidth: { tap: 'var(--vb-tap)' },
      maxWidth: {
        container: 'var(--vb-container)',
        measure: '60ch',
      },
      transitionTimingFunction: {
        calm: 'var(--vb-ease)',
        spring: 'var(--vb-ease-spring)',
      },
      transitionDuration: {
        fast: 'var(--vb-duration-fast)',
        calm: 'var(--vb-duration)',
        slow: 'var(--vb-duration-slow)',
      },
      keyframes: {
        drift: {
          '0%, 100%': { transform: 'translate3d(0,0,0) scale(1)' },
          '50%': { transform: 'translate3d(3%, -4%, 0) scale(1.08)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
      },
      animation: {
        drift: 'drift 22s ease-in-out infinite',
        float: 'float 7s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
