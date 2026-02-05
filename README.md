# Launchpad Games Showcase

Launchpad Games is a fictional party-game studio. This project is a marketing
and discovery surface designed to promote and sell party-game packs across
multiple platforms (console app stores, Steam, and direct web purchase).

The UI should feel playful, energetic, and premium, inspired by promotional
pages for Jackbox Party Packs. Toggle characters are used as animated,
expressive visual elements that represent the fun and chaos of party gameplay
— not real players or online users.

## LaunchDarkly

This demo uses the LaunchDarkly JavaScript client SDK for a single client-side
flag (`plp-large-images`). Configure a public client ID in local development
and in Vercel:

```
NUXT_PUBLIC_LD_CLIENT_ID=your_client_id_here
```

## Setup

Make sure to install dependencies:

```bash
# npm
npm install

# pnpm
pnpm install

# yarn
yarn install

# bun
bun install
```

## Development Server

Start the development server on `http://localhost:3000`:

```bash
# npm
npm run dev

# pnpm
pnpm dev

# yarn
yarn dev

# bun
bun run dev
```

## Production

Build the application for production:

```bash
# npm
npm run build

# pnpm
pnpm build

# yarn
yarn build

# bun
bun run build
```

Locally preview production build:

```bash
# npm
npm run preview

# pnpm
pnpm preview

# yarn
yarn preview

# bun
bun run preview
```

Check out the [deployment documentation](https://nuxt.com/docs/getting-started/deployment) for more information.
