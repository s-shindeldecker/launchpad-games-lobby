import type { Config } from 'tailwindcss'

export default {
  theme: {
    extend: {
      fontFamily: {
        game: ['"Fredoka One"', 'cursive'],
        gameBody: ['Fredoka', 'sans-serif']
      }
    }
  },
  plugins: []
} satisfies Config
