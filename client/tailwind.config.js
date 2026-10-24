/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      // Every value points at a CSS variable in styles/tokens.css.
      colors: {
        background: 'var(--vb-background)',
        surface: 'var(--vb-surface)',
        ink: 'var(--vb-text)',
        muted: 'var(--vb-muted)',
        accent: 'var(--vb-accent)',
        'accent-soft': 'var(--vb-accent-soft)',
        'accent-strong': 'var(--vb-accent-strong)',
        error: 'var(--vb-error)',
        success: 'var(--vb-success)',
        line: 'var(--vb-line)',
        uncertain: {
          DEFAULT: 'var(--vb-uncertain-bg)',
          ink: 'var(--vb-uncertain-text)',
        },
        highlight: 'var(--vb-highlight)',
      },
      fontFamily: {
        sans: ['var(--vb-font)'],
      },
      fontSize: {
        small: ['var(--vb-text-small)', { lineHeight: '1.5' }],
        body: ['var(--vb-text-body)', { lineHeight: '1.6' }],
        subhead: ['var(--vb-text-subhead)', { lineHeight: '1.35' }],
        heading: ['var(--vb-text-heading)', { lineHeight: '1.25' }],
        hero: ['var(--vb-text-hero)', { lineHeight: '1.1' }],
        display: ['var(--vb-text-display)', { lineHeight: '1.05', letterSpacing: '-0.02em' }],
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
      },
      boxShadow: {
        calm: 'var(--vb-shadow)',
      },
      minHeight: {
        tap: 'var(--vb-tap)',
      },
      minWidth: {
        tap: 'var(--vb-tap)',
      },
      maxWidth: {
        container: 'var(--vb-container)',
        // Comfortable reading measure for long paragraphs.
        measure: '60ch',
      },
      transitionTimingFunction: {
        calm: 'var(--vb-ease)',
      },
      transitionDuration: {
        fast: 'var(--vb-duration-fast)',
        calm: 'var(--vb-duration)',
        slow: 'var(--vb-duration-slow)',
      },
    },
  },
  plugins: [],
}
