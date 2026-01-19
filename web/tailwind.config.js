/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#9a9ece',
        secondary: '#424a70',
        accent: '#9eadc8',
        background: '#FFFFFF',
        'background-secondary': '#F2F2F7',
        text: '#000000',
        'text-secondary': '#7374a7',
        'text-light': '#424a70',
        border: '#E5E5EA',
        success: '#6B8DD6',
      },
      fontFamily: {
        sans: ['Montserrat', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        'DEFAULT': '12px',
      },
    },
  },
  plugins: [],
  corePlugins: {
    // Deshabilitar preflight para evitar conflictos con Material UI
    preflight: false,
  },
}
