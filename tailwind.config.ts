import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        orbit: {
          forest: '#1A4D23',
          green: '#2E7D3A',
          amber: '#F5A623',
          offwhite: '#F7F7F7',
          dark: '#1A2E1C',
        },
      },
      fontFamily: {
        sans: ['Arial', 'Helvetica', 'sans-serif'],
      },
      fontSize: {
        '2xs': '0.625rem',
      },
    },
  },
  plugins: [],
};

export default config;
