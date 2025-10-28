/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'sans-serif']
      },
      colors: {
        brand: {
          bg: 'var(--color-bg)',
          'bg-secondary': 'var(--color-bg-secondary)',
          'bg-hover': 'var(--color-bg-hover)',
          text: 'var(--color-text)',
          'text-secondary': 'var(--color-text-secondary)',
          border: 'var(--color-border)',
          accent: 'var(--color-accent)',
          'accent-hover': 'var(--color-accent-hover)',
          success: 'var(--color-success)',
          error: 'var(--color-error)',
          warning: 'var(--color-warning)'
        }
      },
      borderRadius: {
        brand: 'var(--radius)',
        'brand-lg': 'var(--radius-lg)'
      }
    },
  },
  plugins: [],
}

