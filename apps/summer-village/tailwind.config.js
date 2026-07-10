/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary:           '#103457',
        'primary-container': '#2b4b6f',
        secondary:         '#3f6371',
        'secondary-container': '#c2e8f8',
        'inverse-primary': '#a9c9f3',
        sandy:             '#E8DED1',
        surface:           '#f8f9fa',
        'on-surface':      '#191c1d',
        error:             '#ba1a1a',
        today:             '#f0a500',
        tomorrow:          '#1b9e8a',
        'open-green':      '#7ee8a2',
      },
      fontFamily: {
        display: ['"Plus Jakarta Sans"', 'sans-serif'],
        body:    ['Manrope', 'sans-serif'],
      },
      borderRadius: {
        sm:   '0.25rem',
        DEFAULT: '0.5rem',
        md:   '0.75rem',
        lg:   '1rem',
        xl:   '1.5rem',
        full: '9999px',
      },
      backdropBlur: {
        xs: '4px',
        sm: '8px',
        DEFAULT: '12px',
        md: '16px',
        lg: '20px',
        xl: '24px',
      },
    },
  },
  plugins: [],
}
