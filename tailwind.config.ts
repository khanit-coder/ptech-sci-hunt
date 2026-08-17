import type { Config } from 'tailwindcss';

export default {
  darkMode: ['class'],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
    './index.html',
  ],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      fontFamily: {
        game: ['"Press Start 2P"', 'monospace'],
        display: ['"Outfit"', '"Prompt"', 'sans-serif'],
        sans: ['"Inter"', '"Prompt"', 'sans-serif'],
        thai: ['"Prompt"', '"Noto Sans Thai"', 'sans-serif'],
      },
      colors: {
        mario: {
          red: '#FF2A2A',
          orange: '#FF7A00',
          yellow: '#FFD700',
          green: '#00E676',
          blue: '#00B0FF',
          purple: '#9D4EDD',
          darkRed: '#990000',
          darkNavy: '#080A1A',
          deepBg: '#050714',
          cardBg: 'rgba(15, 23, 42, 0.75)',
          panelBg: 'rgba(20, 26, 50, 0.85)',
          borderGlow: 'rgba(255, 122, 0, 0.4)',
        },
        sci: {
          cyan: '#00F0FF',
          neonGreen: '#39FF14',
          plasmaPink: '#FF007F',
          gold: '#FFC837',
          deepBlue: '#0D1127',
          gridLine: 'rgba(0, 240, 255, 0.12)',
        },
      },
      keyframes: {
        'pulse-glow': {
          '0%, 100%': { opacity: '1', filter: 'drop-shadow(0 0 15px currentColor)' },
          '50%': { opacity: '0.7', filter: 'drop-shadow(0 0 5px currentColor)' },
        },
        'pixel-float': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        'energy-scan': {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100%)' },
        },
        'banner-flash': {
          '0%, 100%': { backgroundColor: 'rgba(255, 42, 42, 0.2)' },
          '50%': { backgroundColor: 'rgba(255, 215, 0, 0.3)' },
        },
        'scale-pop': {
          '0%': { transform: 'scale(0.8)', opacity: '0' },
          '70%': { transform: 'scale(1.08)', opacity: '1' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
      animation: {
        'pulse-glow': 'pulse-glow 2.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'pixel-float': 'pixel-float 3s ease-in-out infinite',
        'energy-scan': 'energy-scan 4s linear infinite',
        'banner-flash': 'banner-flash 1.5s ease-in-out infinite',
        'scale-pop': 'scale-pop 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards',
      },
      boxShadow: {
        'neon-red': '0 0 20px rgba(255, 42, 42, 0.6), inset 0 0 10px rgba(255, 42, 42, 0.3)',
        'neon-yellow': '0 0 20px rgba(255, 215, 0, 0.6), inset 0 0 10px rgba(255, 215, 0, 0.3)',
        'neon-green': '0 0 20px rgba(0, 230, 118, 0.6), inset 0 0 10px rgba(0, 230, 118, 0.3)',
        'neon-cyan': '0 0 20px rgba(0, 240, 255, 0.6), inset 0 0 10px rgba(0, 240, 255, 0.3)',
        'pixel-frame': 'inset -4px -4px 0px 0px rgba(0,0,0,0.5), inset 4px 4px 0px 0px rgba(255,255,255,0.2)',
      },
    },
  },
  plugins: [],
} satisfies Config;
