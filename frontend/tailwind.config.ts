import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-fira-code)', 'monospace'],
      },
      colors: {
        // Based on your prompt's legacyStyle and common shades for a dark theme
        // Primary colors from legacyStyle: ['#3b82f6', '#10b981', '#8b5cf6'] (blue, green, purple)
        // These are approximately blue-500, green-500, purple-500/600 in Tailwind
        'brand-blue': '#3b82f6',
        'brand-green': '#10b981',
        'brand-purple': '#8b5cf6',
        // Additional shades for UI elements - these can be expanded
        // Using Tailwind's gray shades for base dark theme
        'background-primary': 'rgb(var(--color-background-primary) / <alpha-value>)', // e.g., gray-950 from original
        'background-secondary': 'rgb(var(--color-background-secondary) / <alpha-value>)', // e.g., gray-900
        'content-primary': 'rgb(var(--color-content-primary) / <alpha-value>)', // e.g., gray-100
        'content-secondary': 'rgb(var(--color-content-secondary) / <alpha-value>)', // e.g., gray-300
        'border-primary': 'rgb(var(--color-border-primary) / <alpha-value>)', // e.g., gray-700
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic':
          'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
      // Animations based on original project's globals.css and your prompt
      keyframes: {
        'fade-in-down': {
          '0%': { opacity: '0', transform: 'translateY(-20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-in-up': {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        // For OCRScannerFX (粒子轨迹扫描 -科幻电影效果 - can be a complex particle system or a simpler CSS animation)
        'scanner-pulse': { // Simplified pulse for now
          '0%, 100%': { opacity: '1', transform: 'scale(1)'},
          '50%': { opacity: '0.7', transform: 'scale(1.05)'},
        },
         shimmer: { // From original globals.css
          '0%': { backgroundPosition: '200% 0' },
          '100%': { backgroundPosition: '-200% 0' },
        },
      },
      animation: {
        'fade-in-down': 'fade-in-down 0.5s ease-out forwards',
        'slide-in-up': 'slide-in-up 0.5s ease-out forwards',
        'float': 'float 3s ease-in-out infinite',
        'scanner-pulse': 'scanner-pulse 1.5s infinite ease-in-out',
        'shimmer': 'shimmer 4s infinite linear', // From original globals.css
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'), // For better default form styling, if needed
  ],
}
export default config
