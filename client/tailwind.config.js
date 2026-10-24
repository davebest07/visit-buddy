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
        display: ['var(--vb-text-display)', { lineHeight: '1.02', letterSpacing: '-0.02em' }],
      },
      borderRadius: {
        DEFAULT: 'var(--vb-radius)',
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
