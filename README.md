# Launchpad Games Showcase

Launchpad Games is a fictional party-game studio. This project is a marketing
and discovery surface designed to promote and sell party-game packs across
multiple platforms (console app stores, Steam, and direct web purchase).

The UI is intended to feel playful, energetic, and premium, inspired by
promotional pages for Jackbox Party Packs. Toggle characters are used as
animated, expressive visual elements that represent the fun and chaos of party
gameplay.

Beyond the storefront, the project doubles as a **LaunchDarkly demo**: it
showcases multiple client-side feature flags, a LaunchDarkly **AI Config**
driven game, and Amplitude analytics enriched with flag evaluation reasons.

## Architecture

The repository contains two services:

- **Nuxt 4 app** (repo root) — the client-rendered (SSR disabled) storefront,
  game pages, and the interactive AI game UIs. Uses the LaunchDarkly JavaScript
  client SDK and Amplitude. It also hosts in-app Nitro server routes
  (`server/api/ai-config` and `server/api/debug-logs`) that power the
  **Talkin' Ship** game using the LaunchDarkly Node server SDK + AI SDK
  (Bedrock and OpenAI providers).
- **Python FastAPI AI backend** (`ai-backend/`) — powers the **AI-t Mile**
  rap-battle game. Uses the LaunchDarkly Python **AI SDK** (agent graphs + AI
  judges) and calls OpenAI to generate AI bars and score rounds. It exposes its
  own `/api/ai-config` and `/api/debug-logs` endpoints, mirroring the Nitro
  contract.

## Key features

- **Game catalog & cart** — a playful PLP/PDP storefront with a cart drawer and
  simulated checkout / purchase analytics events. The catalog lists 9 games;
  most are showcase/marketing entries, and two (below) are interactive.
- **Two AI-powered games**, each backed by LaunchDarkly AI Configs:
  - **Talkin' Ship** (`/games/talkin-ship`) — respond to AI-generated ship-pun
    prompts and get scored by an AI judge. Served by the in-app Nitro routes
    (`server/api/*`), which resolve LaunchDarkly AI Configs and invoke Bedrock
    or OpenAI depending on the config's provider.
  - **AI-t Mile** (`/games/a-it-mile`) — rap against an AI MC; an AI judge
    scores both the human and AI bars and crowns a winner. Served by the Python
    FastAPI backend (`ai-backend/`). Win/loss metrics are tracked.
- **LaunchDarkly feature flags** — several client-side flags control storefront
  copy, layout, the hero CTA, and AI game behavior (see below).
- **LaunchDarkly AI Configs** — both backends resolve prompt-generation and
  scoring configs (the Python backend uses **agent graphs**) plus an AI judge,
  with fallback prompts/agents when configs are unavailable.
- **Amplitude analytics** — product and game events are sent to Amplitude, and
  LaunchDarkly flag evaluations (including evaluation reasons) are attached to
  the user identity.
- **Debug overlay** — on the game page, `Cmd/Ctrl+D` toggles a debug window that
  streams client and backend logs, and `Cmd/Ctrl+J` toggles the judge results
  panel.

## LaunchDarkly

The Nuxt app initializes the LaunchDarkly JS client SDK with a rich multi-
attribute user context (name, plan, region, state, owned platforms, device) and
`evaluationReasons` enabled.

Client-side flags currently in use:

| Flag | Type | Purpose |
| --- | --- | --- |
| `plp-large-images` | boolean | Larger product imagery on the listing/detail pages |
| `plp-number-of-columns` | number | Game grid column count |
| `plp-title` | string | Listing page title copy |
| `plp-subtitle` | string | Listing page subtitle copy |
| `home-hero-cta` | JSON | Home hero CTA text, link, size, and color |
| `ai-judge-enabled` | boolean | Enables the AI judge on the Talkin' Ship game |
| `ai-prompt-variant` | string | AI prompt tone for Talkin' Ship (e.g. `playful`) |

Server-side, the Nitro routes (Talkin' Ship) and the Python backend (AI-t Mile)
each resolve LaunchDarkly **AI Configs** — prompts, scoring, and an AI judge —
via the LaunchDarkly server SDKs.

## Environment variables

### Nuxt app (root `.env`)

```
# Required
NUXT_PUBLIC_LD_CLIENT_ID=your_ld_client_id_here

# Optional
NUXT_PUBLIC_AMPLITUDE_API_KEY=your_amplitude_api_key
NUXT_PUBLIC_AI_BACKEND_URL=http://localhost:8000   # defaults to localhost:8000
```

### AI backend (`ai-backend/`)

```
# Required
LAUNCHDARKLY_SDK_KEY=your_ld_server_sdk_key
OPENAI_API_KEY=your_openai_api_key

# Optional overrides
LD_AI_CONFIG_PROMPT_GRAPH_KEY=talkin-ship-prompt-generation-graph
LD_AI_CONFIG_SCORING_GRAPH_KEY=talkin-ship-scoring-graph
LD_AI_CONFIG_JUDGE_EVAL_KEY=brand-accuracy
```

## Setup

Install Nuxt app dependencies:

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

Talkin' Ship runs entirely within the Nuxt app (Nitro routes). To exercise the
AI-t Mile game, also start the Python backend (see below).

## AI backend (AI-t Mile)

The Python FastAPI service powers the AI-t Mile rap-battle game. It is not
required for Talkin' Ship, which uses the in-app Nitro routes.

```bash
cd ai-backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

Point the Nuxt app at this service by setting `NUXT_PUBLIC_AI_BACKEND_URL`
(defaults to `http://localhost:8000`). See [`ai-backend/README.md`](ai-backend/README.md)
for more detail.

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

The Nuxt app and the AI backend are deployed as separate Vercel projects.

Check out the [deployment documentation](https://nuxt.com/docs/getting-started/deployment) for more information.
