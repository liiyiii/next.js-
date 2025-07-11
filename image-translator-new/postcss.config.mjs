export default {
  plugins: {
    // According to Tailwind v4 alpha docs, it might be just 'tailwindcss': {}
    // or '@tailwindcss/postcss': {}
    // Using the one provided by user:
    "@tailwindcss/postcss": {},
    // Autoprefixer is often included, but Tailwind v4 might handle prefixing differently
    // 'autoprefixer': {},
  }
}
