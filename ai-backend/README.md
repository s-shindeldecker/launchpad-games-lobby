# Launchpad Games AI Backend (FastAPI)

Python replacement for the Nuxt/Nitro `/api/ai-config` and `/api/debug-logs` routes. Uses LaunchDarkly agent graphs and direct OpenAI calls.

## Setup

```bash
cd ai-backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

## Environment

```bash
export LAUNCHDARKLY_SDK_KEY=...
export OPENAI_API_KEY=...
# Optional overrides
export LD_AI_CONFIG_PROMPT_GRAPH_KEY=talkin-ship-prompt-graph
export LD_AI_CONFIG_SCORING_GRAPH_KEY=talkin-ship-scoring-graph
export LD_AI_CONFIG_JUDGE_EVAL_KEY=brand-accuracy
```

## Run

```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

Point the Nuxt app at this service (proxy `/api/*` or set `NUXT_PUBLIC_API_BASE`) when ready to cut over from Nitro.
