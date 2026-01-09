/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      // هنا ربطنا كلاس font-sans بمتغير الخط اللي عملناه في layout.js
      fontFamily: {
        sans: ['var(--font-tajawal)', 'sans-serif'],
      },
      // (اختياري) تعريف الألوان المخصصة عشان تستخدمها بأسماء أسهل
      colors: {
        gold: '#B69142',
        dark: '#121212',
        'dark-card': '#1E1E1E',
      },
    },
  },
  plugins: [],
};