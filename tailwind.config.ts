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
          red: '#EA2027',
          orange: '#F97316',
          yellow: '#F9C80E',
          green: '#22C55E',
          blue: '#0284C7',
          purple: '#8B5CF6',
          darkRed: '#B91C1C',
          darkNavy: '#0F172A',
          deepBg: '#080D1A',
          cardBg: 'rgba(15, 23, 42, 0.85)',
          panelBg: 'rgba(23, 37, 84, 0.75)',
          borderGlow: 'rgba(249, 200, 14, 0.4)',
        },
        passport: {
          steel: '#2D4B73',
          darkSteel: '#1E3A5F',
          border: '#3A6073',
          lightBorder: '#52829D',
          rivet: '#94A3B8',
          cream: '#F4F8FC',
          parchment: '#E8EEF5',
          bannerBlue: '#0284C7',
          bannerRed: '#EA2027',
          bannerGreen: '#16A34A',
          bannerYellow: '#EAB308',
          bannerPurple: '#7C3AED',
          bannerOrange: '#EA580C',
        },
        sci: {
          cyan: '#00F0FF',
          neonGreen: '#39FF14',
          plasmaPink: '#FF007F',
          gold: '#FFC837',
          deepBlue: '#0D1127',
          gridLine: 'rgba(0, 240, 255, 0.15)',
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
          '0%, 100%': { backgroundColor: 'rgba(234, 32, 39, 0.25)' },
          '50%': { backgroundColor: 'rgba(249, 200, 14, 0.35)' },
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
        'neon-red': '0 0 20px rgba(234, 32, 39, 0.6), inset 0 0 10px rgba(234, 32, 39, 0.3)',
        'neon-yellow': '0 0 20px rgba(249, 200, 14, 0.6), inset 0 0 10px rgba(249, 200, 14, 0.3)',
        'neon-green': '0 0 20px rgba(34, 197, 94, 0.6), inset 0 0 10px rgba(34, 197, 94, 0.3)',
        'neon-cyan': '0 0 20px rgba(0, 240, 255, 0.6), inset 0 0 10px rgba(0, 240, 255, 0.3)',
        'passport-frame': '0 10px 25px -5px rgba(0, 0, 0, 0.5), 0 0 0 2px rgba(58, 96, 115, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.15)',
        'passport-inset': 'inset 0 2px 6px rgba(0, 0, 0, 0.4), inset 0 0 0 1px rgba(255, 255, 255, 0.05)',
        'pixel-frame': 'inset -4px -4px 0px 0px rgba(0,0,0,0.5), inset 4px 4px 0px 0px rgba(255,255,255,0.2)',
      },
    },
  },
  plugins: [],
} satisfies Config;
