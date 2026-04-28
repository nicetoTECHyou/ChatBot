import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        forge: {
          bg: '#0a0a0f',
          surface: '#12121a',
          card: '#1a1a2e',
          border: '#2a2a3e',
          hover: '#252540',
          purple: '#a855f7',
          'purple-dark': '#7c3aed',
          'purple-light': '#c084fc',
          blue: '#3b82f6',
          'blue-dark': '#2563eb',
          cyan: '#06b6d4',
          red: '#ef4444',
          green: '#22c55e',
          yellow: '#eab308',
          orange: '#f97316',
          pink: '#ec4899',
          text: '#e2e8f0',
          'text-dim': '#94a3b8',
          'text-muted': '#64748b',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'slide-in': 'slideIn 0.3s ease-out',
        'fade-in': 'fadeIn 0.3s ease-out',
      },
      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(168, 85, 247, 0.2), 0 0 20px rgba(168, 85, 247, 0.1)' },
          '100%': { boxShadow: '0 0 10px rgba(168, 85, 247, 0.4), 0 0 40px rgba(168, 85, 247, 0.2)' },
        },
        slideIn: {
          '0%': { transform: 'translateX(-10px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
