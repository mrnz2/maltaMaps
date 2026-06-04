import type { Config } from 'tailwindcss'

export default {
  content: [
    './components/**/*.{js,vue,ts}',
    './layouts/**/*.vue',
    './pages/**/*.vue',
    './app.vue',
  ],
  safelist: [
    // Klasy w popupach / markerach Mapbox (HTML string)
    'bg-amber-50',
    'border-amber-300',
    'bg-amber-500',
    'hover:bg-amber-600',
    'active:bg-amber-700',
    '!bg-emerald-500',
    'hover:!bg-emerald-600',
    'h-24',
    'w-full',
    'object-cover',
    'rounded-xl',
    'p-4',
    'text-slate-900',
    'text-slate-500',
    'font-mono',
    'font-bold',
    'animate-pulse',
    'ring-emerald-400/40',
    'bg-emerald-500',
  ],
  theme: {
    extend: {
      colors: {
        malta: {
          sea: '#0ea5e9',
          sand: '#f59e0b',
          stone: '#78716c',
        },
      },
      fontFamily: {
        sans: ['DM Sans', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
} satisfies Config
