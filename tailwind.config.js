/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      // replace the overly saturated teal palette with a more neutral, subdued set of
      // primary colors. we also add an "accent" key that can be used for occasional
      // highlights without looking like an AI‑generated gradient.
      colors: {
        primary: {
          50: '#fafafa',
          100: '#f5f5f5',
          200: '#e5e5e5',
          300: '#d4d4d4',
          400: '#a3a3a3',
          500: '#737373',
          600: '#525252',
          700: '#404040',
          800: '#262626',
          900: '#171717',
        },
        // accent color for buttons or small highlights, intentionally muted
        accent: {
          500: '#6b7280',
        },
      },
    },
  },
  plugins: [],
};
