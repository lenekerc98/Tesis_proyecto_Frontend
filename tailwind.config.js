/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}', // Esto busca tus archivos en la carpeta src
  ],
  theme: {
    extend: {
      colors: {
        'olive-green': '#5d714d', // El color exacto de tu botón de la foto
      },
      borderRadius: {
        '4xl': '2.5rem', // Para lograr ese redondeado suave de tu diseño
      }
    },
  },
  plugins: [],
}