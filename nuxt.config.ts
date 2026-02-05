// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  ssr: false,
  modules: ['@nuxtjs/tailwindcss'],
  css: ['~/assets/css/tailwind.css'],
  runtimeConfig: {
    public: {
      ldClientId: process.env.NUXT_PUBLIC_LD_CLIENT_ID
    }
  },
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
