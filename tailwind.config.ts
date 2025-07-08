import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // G'dAI Mate Brand Colors
        'worksite-gold': '#D9B43B',
        'outback-midnight': '#002A3E',
        'slate-shadow': '#1B2838',
        'eucalypt-mist': '#6B8E7A',
        'off-white': '#F9FAFB',
        
        // Semantic colors based on brand palette
        primary: {
          50: '#fefaf0',
          100: '#fef3e0',
          200: '#fde4b8',
          300: '#fbd085',
          400: '#f8b94f',
          500: '#D9B43B', // worksite-gold
          600: '#c19a2f',
          700: '#a07c27',
          800: '#826225',
          900: '#6b5122',
        },
        secondary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#002A3E', // outback-midnight
        },
        neutral: {
          50: '#F9FAFB', // off-white
          100: '#f3f4f6',
          200: '#e5e7eb',
          300: '#d1d5db',
          400: '#9ca3af',
          500: '#6b7280',
          600: '#4b5563',
          700: '#374151',
          800: '#1B2838', // slate-shadow
          900: '#111827',
        },
        success: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#6B8E7A', // eucalypt-mist
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      borderRadius: {
        'brand': '8px', // Standard 8px as per brand guide
      },
      boxShadow: {
        'brand': '0 2px 4px rgba(0, 0, 0, 0.06)', // Soft shadow from brand guide
        'brand-lg': '0 4px 8px rgba(0, 0, 0, 0.1)',
        'brand-xl': '0 8px 16px rgba(0, 0, 0, 0.15)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'pulse-gold': 'pulseGold 2s infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        pulseGold: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(217, 180, 59, 0.7)' },
          '50%': { boxShadow: '0 0 0 8px rgba(217, 180, 59, 0)' },
        },
      },
      backgroundImage: {
        'australia-outline': "url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxwYXRoIGQ9Ik0xMCA1MEM4IDQ4IDYgNDYgNSA0NEMzIDQwIDIgMzUgNCAzMEM2IDI1IDEwIDIyIDE1IDIwQzIwIDE4IDI1IDE3IDMwIDE4QzM1IDE5IDQwIDIxIDQ1IDIzQzUwIDI1IDU1IDI3IDYwIDMwQzY1IDMzIDcwIDM2IDc1IDQwQzgwIDQ0IDg1IDQ4IDkwIDUyQzk1IDU2IDk4IDYwIDk5IDY1Qzk5IDcwIDk4IDc1IDk1IDc5Qzk0IDgxIDkyIDgzIDkwIDg0Qzg4IDg1IDg2IDg2IDg0IDg3Qzc4IDg5IDcyIDkwIDY2IDkwQzYwIDkwIDU0IDg5IDQ4IDg3QzQyIDg1IDM2IDgyIDMwIDc4QzI0IDc0IDE4IDY5IDE0IDYzQzEwIDU3IDggNTAgMTAgNTBaIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIwLjUiIGZpbGw9Im5vbmUiIG9wYWNpdHk9IjAuMDUiLz4KPC9zdmc+')",
      },
    },
  },
  plugins: [],
}

export default config