// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  ssr: false,
  modules: ['@nuxtjs/tailwindcss'],
  css: ['~/assets/css/tailwind.css'],
  app: {
    head: {
      title: 'Launchpad Games Lobby',
      meta: [
        {
          name: 'description',
          content:
            'A playful, animated party-game lobby experience from Launchpad Games.'
        }
      ]
    }
  }
})
