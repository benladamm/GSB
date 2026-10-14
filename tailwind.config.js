/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        creme: '#fbf7ec',
        ivoire: '#fffdf7',
        'brun-olive': '#3a3826',
        'olive-doux': '#7a7458',
        sauge: '#6f9068',
        'sauge-profond': '#557552',
        or: '#b8934a',
        'or-doux': '#d6b876',
        'rose-poudre': '#d49a8c',
        sable: '#e6dab8',
        'vert-pale': '#e4eddc',
      },
      fontFamily: {
        serif: ['var(--font-cormorant)', 'Cormorant Garamond', 'Georgia', 'serif'],
        sans: ['var(--font-lato)', 'Lato', 'system-ui', '-apple-system', 'sans-serif'],
      },
      borderRadius: {
        'bandeau': '220px 220px 24px 24px',
        'carte-1': '70px 8px 70px 8px',
        'carte-2': '8px 70px 8px 70px',
        'stat': '40px 6px 40px 6px',
        'bouton': '30px 6px 30px 6px',
        'champ': '24px 6px 24px 6px',
        'tableau': '40px 8px 40px 8px',
        'feuille': '50% 4px 50% 4px',
      },
      boxShadow: {
        'or': '0 3px 0 #b8934a',
        'or-lg': '0 6px 20px rgba(184, 147, 74, 0.18)',
        'art-nouveau': '0 4px 20px rgba(58, 56, 38, 0.06)',
      },
      maxWidth: {
        'art': '1040px',
      },
    },
  },
  plugins: [],
};
