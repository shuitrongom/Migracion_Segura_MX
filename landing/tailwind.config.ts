import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        amber: { 500: '#f59e0b', 600: '#d97706' },
      },
    },
  },
  plugins: [],
};
export default config;
