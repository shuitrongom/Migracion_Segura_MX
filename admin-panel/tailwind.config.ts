import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#FAF7F2',
          100: '#F0E8DA',
          200: '#E0D0B5',
          300: '#D4B896',
          400: '#C4A265',
          500: '#3D2B1F', // Primary dark brown
          600: '#3D2B1F',
          700: '#2C1810',
          800: '#1F1008',
          900: '#150A04',
        },
        gold: {
          50: '#FBF7EE',
          100: '#F5ECDA',
          200: '#EBD9B5',
          300: '#D4B896',
          400: '#C4A265',
          500: '#B08D4A',
          600: '#96753A',
          700: '#7A5E2E',
          800: '#5E4722',
          900: '#423016',
        },
        success: {
          50: '#F0F7F2',
          500: '#4A7C59',
          700: '#3A6247',
        },
        warning: {
          50: '#FDF8E8',
          500: '#D4A017',
          700: '#A67D12',
        },
        danger: {
          50: '#FDF2F1',
          500: '#C0392B',
          700: '#962D22',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
