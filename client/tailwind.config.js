/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        canvas: 'var(--vb-canvas)',
        surface: 'var(--vb-surface)',
        'surface-2': 'var(--vb-surface-2)',
        ink: 'var(--vb-text)',
        muted: 'var(--vb-muted)',
        line: 'var(--vb-line)',
        evergreen: 'var(--vb-evergreen)',
        'evergreen-deep': 'var(--vb-evergreen-deep)',
        'evergreen-soft': 'var(--vb-evergreen-soft)',
        ember: 'var(--vb-ember)',
        'ember-bright': 'var(--vb-ember-bright)',
        night: 'var(--vb-night)',
        'night-2': 'var(--vb-night-2)',
        cream: 'var(--vb-cream)',
        'cream-muted': 'var(--vb-cream-muted)',
        sage: 'var(--vb-sage)',
        sand: 'var(--vb-sand)',
        mist: 'var(--vb-mist)',
        error: 'var(--vb-error)',
        success: 'var(--vb-success)',
        uncertain: {
          DEFAULT: 'var(--vb-uncertain-bg)',
          ink: 'var(--vb-uncertain-text)',
        },
        // Legacy aliases so nothing breaks mid-redesign.
        background: 'var(--vb-canvas)',
        accent: 'var(--vb-evergreen)',
        'accent-soft': 'var(--vb-evergreen-soft)',
        'accent-strong': 'var(--vb-evergreen-strong)',
        mint: 'var(--vb-sage)',
        peach: 'var(--vb-sand)',
        sky: 'var(--vb-mist)',
        charcoal: 'var(--vb-night)',
        'charcoal-text': 'var(--vb-cream)',
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
