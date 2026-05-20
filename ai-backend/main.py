"""
FastAPI backend mirroring the Nuxt/Nitro /api/ai-config and /api/debug-logs contract.

Uses LaunchDarkly Python AI SDK agent graphs + direct OpenAI invocation.
"""

from __future__ import annotations

from dotenv import load_dotenv
from pathlib import Path

env_path = Path(__file__).parent.parent / ".env"
if env_path.exists():
    load_dotenv(env_path)

import json
import os
import uuid
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from threading import Lock
from typing import Any, Literal, Optional

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from ldai import LDAIClient
from ldai.agent_graph import AgentGraphDefinition
from ldai.models import AIAgentConfig, AIAgentConfigDefault, AIJudgeConfig, AIJudgeConfigDefault, LDMessage
from ldai.providers.types import JudgeResult, LDAIMetrics
from ldai.tracker import LDAIConfigTracker, TokenUsage
from ldclient import Context, LDClient
from ldclient.config import Config
from openai import OpenAI
from pydantic import BaseModel, Field

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

MAX_DEBUG_LOGS = 200
DEFAULT_JUDGE_THRESHOLD = 0.6

ROOT_PROMPT_AGENT = "talkin-ship-prompt-creator-agent"
FALLBACK_PROMPT_AGENT = "fallback-prompt-creator-agent"
ROOT_SCORE_AGENT = "talkin-ship-score-agent"
FALLBACK_SCORE_AGENT = "fallback-score-agent"

PROMPT_GRAPH_KEY = os.environ.get(
    "LD_AI_CONFIG_PROMPT_GRAPH_KEY", "talkin-ship-prompt-generation-graph"
)
SCORING_GRAPH_KEY = os.environ.get(
    "LD_AI_CONFIG_SCORING_GRAPH_KEY", "talkin-ship-scoring-graph"
)
JUDGE_EVAL_KEY = os.environ.get("LD_AI_CONFIG_JUDGE_EVAL_KEY", "brand-accuracy")

AIT_ROOT_PROMPT_AGENT = "a-it-mile-prompt-agent"
AIT_FALLBACK_PROMPT_AGENT = "a-it-mile-fallback-prompt-agent"
AIT_ROOT_SCORE_AGENT = "a-it-mile-score-agent"
AIT_FALLBACK_SCORE_AGENT = "a-it-mile-fallback-score-agent"

AIT_PROMPT_GRAPH_KEY = os.environ.get(
    "LD_AI_CONFIG_AIT_MILE_PROMPT_GRAPH_KEY", "a-it-mile-prompt-generation-graph"
)
AIT_SCORING_GRAPH_KEY = os.environ.get(
    "LD_AI_CONFIG_AIT_MILE_SCORING_GRAPH_KEY", "a-it-mile-scoring-graph"
)
AIT_JUDGE_EVAL_KEY = os.environ.get(
    "LD_AI_CONFIG_AIT_MILE_JUDGE_EVAL_KEY", "hip-hop-voice"
)

# ---------------------------------------------------------------------------
# Debug log ring buffer
# ---------------------------------------------------------------------------

_log_lock = Lock()
_debug_logs: list[dict[str, str]] = []


def add_log(level: Literal["info", "warn", "error"], message: str, meta: Any = None) -> None:
    meta_suffix = ""
    if meta is not None:
        try:
            meta_suffix = f" {json.dumps(meta)}"
        except (TypeError, ValueError):
            meta_suffix = f" {meta}"
    entry = {
        "ts": datetime.now(timezone.utc).isoformat(),
        "level": level,
        "message": f"{message}{meta_suffix}",
    }
    with _log_lock:
        _debug_logs.append(entry)
        if len(_debug_logs) > MAX_DEBUG_LOGS:
            del _debug_logs[: len(_debug_logs) - MAX_DEBUG_LOGS]
    log_fn = {"info": print, "warn": print, "error": print}[level]
    log_fn(f"[{level}] {message}{meta_suffix}")


# ---------------------------------------------------------------------------
# Singleton clients
# ---------------------------------------------------------------------------

ld_client: Optional[LDClient] = None
ai_client: Optional[LDAIClient] = None
openai_client: Optional[OpenAI] = None


@asynccontextmanager
async def lifespan(_app: FastAPI):
    global ld_client, ai_client, openai_client

    sdk_key = os.environ.get("LAUNCHDARKLY_SDK_KEY")
    if not sdk_key:
        raise RuntimeError("LAUNCHDARKLY_SDK_KEY is required")

    openai_key = os.environ.get("OPENAI_API_KEY")
    if not openai_key:
        raise RuntimeError("OPENAI_API_KEY is required")

    add_log("info", "Initializing LaunchDarkly client")
    ld_client = LDClient(config=Config(sdk_key))
    if not ld_client.is_initialized():
        ld_client.wait_for_initialization()
    ai_client = LDAIClient(ld_client)
    openai_client = OpenAI(api_key=openai_key)
    add_log("info", "Clients ready")

    yield

    add_log("info", "Shutting down LaunchDarkly client")
    if ld_client is not None:
        ld_client.close()
    ld_client = None
    ai_client = None
    openai_client = None


app = FastAPI(title="Launchpad Games AI API", lifespan=lifespan)

# Tighten allow_origins to specific domains before any public deployment.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Request / response models
# ---------------------------------------------------------------------------


class AiConfigRequest(BaseModel):
    type: str
    input: dict[str, Any] = Field(default_factory=dict)
    context: dict[str, Any] = Field(default_factory=dict)


# ---------------------------------------------------------------------------
# Context + provider helpers
# ---------------------------------------------------------------------------


def build_ld_context(payload: Optional[dict[str, Any]]) -> Context:
    data = payload or {}
    key_value = data.get("key")
    key = key_value.strip() if isinstance(key_value, str) and key_value.strip() else "demo-user"

    builder = Context.builder(key).kind("user")
    if data.get("anonymous") is True:
        builder.anonymous(True)

    for field in ("name", "state", "region", "plan", "device", "platform"):
        value = data.get(field)
        if isinstance(value, str):
            builder.set(field, value)

    owned = data.get("owned_platforms")
    if isinstance(owned, list):
        builder.set("owned_platforms", owned)

    return builder.build()


def resolve_provider_name(provider_name: Optional[str]) -> str:
    if not provider_name:
        return "unknown"
    normalized = provider_name.lower().strip()
    if "openai" in normalized:
        return "openai"
    return "unknown"


def strip_json_code_fence(value: str) -> str:
    trimmed = value.strip()
    if not trimmed.startswith("```"):
        return trimmed
    lines = trimmed.split("\n")
    start = 1 if lines[0].startswith("```") else 0
    end = len(lines) - 1 if lines[-1].startswith("```") else len(lines)
    return "\n".join(lines[start:end]).strip()


def safe_parse_json(value: str) -> Any:
    try:
        return json.loads(strip_json_code_fence(value))
    except json.JSONDecodeError:
        return None


def get_handoff_threshold(
    graph: AgentGraphDefinition,
    source_key: str,
    target_key: str,
    default: float = DEFAULT_JUDGE_THRESHOLD,
) -> float:
    node = graph.get_node(source_key)
    if node is None:
        return default
    for edge in node.get_edges():
        if edge.target_config == target_key:
            handoff = edge.handoff if isinstance(edge.handoff, dict) else {}
            threshold = handoff.get("threshold", default)
            if isinstance(threshold, (int, float)):
                return float(threshold)
    return default


def extract_ait_prompt(payload: Any) -> Optional[dict[str, str]]:
    if not payload or not isinstance(payload, dict):
        return None
    topic = payload.get("topic")
    bars = payload.get("bars")
    if isinstance(topic, str) and isinstance(bars, str):
        return {"topic": topic, "bars": bars}
    nested = payload.get("output") or payload.get("result")
    if isinstance(nested, dict):
        return extract_ait_prompt(nested)
    return None


def extract_ait_score(payload: Any) -> Optional[dict[str, Any]]:
    if not payload or not isinstance(payload, dict):
        return None
    if any(
        k in payload
        for k in ("score", "winner", "verdict", "comment")
    ):
        return {
            "score": payload.get("score"),
            "winner": payload.get("winner"),
            "verdict": payload.get("verdict"),
            "comment": payload.get("comment"),
        }
    nested = payload.get("output") or payload.get("result")
    if isinstance(nested, dict):
        return extract_ait_score(nested)
    return None


def extract_judge(payload: Any) -> Optional[dict[str, Any]]:
    if not payload or not isinstance(payload, dict):
        return None
    if any(
        isinstance(payload.get(k), (int, float)) or isinstance(payload.get(k), str)
        for k in ("score", "label", "verdict")
    ):
        return {
            "score": payload.get("score"),
            "label": payload.get("label"),
            "verdict": payload.get("verdict"),
            "comment": payload.get("comment"),
        }
    nested = payload.get("output") or payload.get("result")
    if isinstance(nested, dict):
        return extract_judge(nested)
    return None


def normalize_brand_score(raw_score: Any) -> float:
    if not isinstance(raw_score, (int, float)):
        return 0.0
    score = float(raw_score)
    return score / 100.0 if score > 1.0 else score


def usage_to_meta(usage: Optional[TokenUsage]) -> dict[str, Any]:
    if usage is None:
        return {}
    return {
        "usage": {
            "inputTokens": usage.input,
            "outputTokens": usage.output,
            "totalTokens": usage.total,
        }
    }


def openai_metrics_extractor(response: Any) -> LDAIMetrics:
    """Map an OpenAI chat completion response to LDAIMetrics (SDK 1.0.x)."""
    tokens: Optional[TokenUsage] = None
    usage = getattr(response, "usage", None)
    if usage is not None:
        tokens = TokenUsage(
            input=getattr(usage, "prompt_tokens", 0) or 0,
            output=getattr(usage, "completion_tokens", 0) or 0,
            total=getattr(usage, "total_tokens", 0) or 0,
        )
    content = ""
    choices = getattr(response, "choices", None) or []
    if choices:
        message = getattr(choices[0], "message", None)
        content = (getattr(message, "content", None) or "").strip()
    return LDAIMetrics(success=bool(content), tokens=tokens)


def variation_meta(config_key: str, context: Context) -> tuple[str, int]:
    assert ld_client is not None
    variation = ld_client.variation(config_key, context, {})
    if not isinstance(variation, dict):
        return "", 1
    meta = variation.get("_ldMeta", {})
    if not isinstance(meta, dict):
        return "", 1
    return meta.get("variationKey", ""), int(meta.get("version", 1))


def create_graph_scoped_tracker(
    config: AIAgentConfig | AIJudgeConfig,
    context: Context,
    graph_key: str,
) -> LDAIConfigTracker:
    """
    Create an LDAIConfigTracker with graph_key so graphKey appears on every
    track_* payload ($ld:ai:generation:success, $ld:ai:duration:total, etc.).
    """
    assert ld_client is not None
    variation_key, version = variation_meta(config.key, context)
    return LDAIConfigTracker(
        ld_client=ld_client,
        run_id=str(uuid.uuid4()),
        config_key=config.key,
        variation_key=variation_key,
        version=version,
        context=context,
        model_name=config.model.name if config.model else "",
        provider_name=config.provider.name if config.provider else "",
        graph_key=graph_key,
    )


def track_evaluation_score(
    judge_cfg: AIJudgeConfig,
    context: Context,
    score: float,
    graph_key: str,
    *,
    judge_config_key: str,
    metric_key: str,
    reasoning: str = "",
) -> None:
    """
    Record a brand-accuracy evaluation score with graphKey on the event payload.

    Uses public ``LDAIConfigTracker`` + ``track_judge_result`` (the SDK surface
    for evaluation scores; there is no separate ``track_evaluation_score`` on 1.0.x).
    """
    tracker = create_graph_scoped_tracker(judge_cfg, context, graph_key)
    tracker.track_judge_result(
        JudgeResult(
            judge_config_key=judge_config_key,
            success=True,
            sampled=True,
            metric_key=metric_key,
            score=score,
            reasoning=reasoning,
        )
    )


def build_openai_messages(
    *,
    instructions: Optional[str],
    config_messages: Optional[list[LDMessage]],
    extra_user: Optional[str] = None,
) -> list[dict[str, str]]:
    messages: list[dict[str, str]] = []
    if instructions:
        messages.append({"role": "system", "content": instructions})
    if config_messages:
        for msg in config_messages:
            messages.append({"role": msg.role, "content": msg.content})
    elif extra_user:
        messages.append({"role": "user", "content": extra_user})
    return messages


def invoke_openai(
    config: AIAgentConfig | AIJudgeConfig,
    messages: list[dict[str, str]],
    *,
    tracker: LDAIConfigTracker,
) -> tuple[str, dict[str, Any]]:
    assert openai_client is not None

    if not config.model or not config.model.name:
        raise ValueError("model_unavailable")

    provider = resolve_provider_name(
        config.provider.name if config.provider else None
    )
    if provider != "openai":
        raise ValueError("provider_unavailable")

    metrics_tracker = tracker

    model_params: dict[str, Any] = {}
    if config.model._parameters:  # noqa: SLF001
        model_params = dict(config.model._parameters)

    def call_provider() -> Any:
        return openai_client.chat.completions.create(
            model=config.model.name,
            messages=messages,
            **model_params,
        )

    response = metrics_tracker.track_metrics_of(openai_metrics_extractor, call_provider)
    content = ""
    if response.choices:
        content = (response.choices[0].message.content or "").strip()

    metrics = openai_metrics_extractor(response)
    return content, usage_to_meta(metrics.tokens)


def load_graph(graph_key: str, context: Context) -> AgentGraphDefinition:
    assert ai_client is not None
    graph = ai_client.agent_graph(graph_key, context)
    if not graph.is_enabled():
        raise ValueError("config_disabled")
    root = graph.root()
    if root is None:
        raise ValueError("config_disabled")
    root_cfg = root.get_config()
    if not root_cfg.enabled or not root_cfg.model or not root_cfg.model.name:
        raise ValueError("model_unavailable")
    provider = resolve_provider_name(
        root_cfg.provider.name if root_cfg.provider else None
    )
    if provider == "unknown":
        raise ValueError("provider_unavailable")
    return graph


def invoke_graph_agent(
    graph: AgentGraphDefinition,
    node_key: str,
    context: Context,
    variables: dict[str, Any],
    *,
    extra_user: Optional[str] = None,
) -> tuple[str, dict[str, Any]]:
    assert ai_client is not None
    graph_key = graph._agent_graph.key  # noqa: SLF001

    config = ai_client.agent_config(
        node_key,
        context,
        AIAgentConfigDefault.disabled(),
        variables,
    )
    if not config.enabled:
        raise ValueError("config_disabled")
    if not config.model or not config.model.name:
        raise ValueError("model_unavailable")

    if graph.get_node(node_key) is None:
        raise ValueError("config_disabled")

    messages = build_openai_messages(
        instructions=config.instructions,
        config_messages=None,
        extra_user=extra_user,
    )
    if not messages and config.instructions:
        messages = [{"role": "user", "content": "Begin."}]

    metrics_tracker = create_graph_scoped_tracker(config, context, graph_key)
    return invoke_openai(config, messages, tracker=metrics_tracker)


def run_brand_accuracy_judge(
    context: Context,
    prompt_value: str,
    response_value: str,
    graph_key: str,
    *,
    judge_eval_key: str = JUDGE_EVAL_KEY,
) -> Optional[dict[str, Any]]:
    if not prompt_value or not response_value:
        return None

    try:
        assert ai_client is not None
        judge_cfg = ai_client.judge_config(
            judge_eval_key,
            context,
            AIJudgeConfigDefault(enabled=False),
            {"prompt": prompt_value, "response": response_value},
        )
        if not judge_cfg.enabled or not judge_cfg.model or not judge_cfg.model.name:
            return None

        messages = build_openai_messages(
            instructions=None,
            config_messages=judge_cfg.messages,
            extra_user=f"Prompt: {prompt_value}\nResponse: {response_value}",
        )
        if not judge_cfg.messages:
            messages = [
                {
                    "role": "user",
                    "content": f"Prompt: {prompt_value}\nResponse: {response_value}",
                }
            ]

        metrics_tracker = create_graph_scoped_tracker(judge_cfg, context, graph_key)
        content, _meta = invoke_openai(judge_cfg, messages, tracker=metrics_tracker)
        if not content:
            return None

        parsed = safe_parse_json(content)
        judge_fields = extract_judge(parsed)
        if not judge_fields:
            return None

        normalized = normalize_brand_score(judge_fields.get("score"))
        reasoning = judge_fields.get("comment") or judge_fields.get("verdict") or ""
        if isinstance(reasoning, str):
            reasoning_text = reasoning
        else:
            reasoning_text = str(reasoning) if reasoning is not None else ""

        metric_key = judge_cfg.evaluation_metric_key or judge_eval_key
        metrics_tracker.track_judge_result(
            JudgeResult(
                judge_config_key=judge_eval_key,
                success=True,
                sampled=True,
                metric_key=metric_key,
                score=normalized,
                reasoning=reasoning_text,
            )
        )

        return {
            "metricKey": judge_eval_key,
            "score": normalized,
            "reasoning": reasoning_text,
        }
    except Exception as exc:  # noqa: BLE001
        add_log("warn", "[AI Config] Judge evaluation failed", {"message": str(exc)})
        return None


def flush_ld() -> None:
    if ld_client is not None:
        try:
            ld_client.flush()
            add_log("info", "[AI Config] LaunchDarkly flush complete")
        except Exception as exc:  # noqa: BLE001
            add_log("error", "[AI Config] LaunchDarkly flush failed", {"message": str(exc)})


# ---------------------------------------------------------------------------
# Route handlers
# ---------------------------------------------------------------------------


@app.get("/api/debug-logs")
def get_debug_logs() -> dict[str, list[dict[str, str]]]:
    with _log_lock:
        return {"logs": list(_debug_logs)}


@app.post("/api/ai-config")
def post_ai_config(body: AiConfigRequest) -> dict[str, Any]:
    req_type = body.type
    if req_type not in ("prompt", "judge", "ait-prompt", "ait-judge"):
        return {"error": "unknown_type"}

    if ai_client is None or ld_client is None:
        add_log("error", "[AI Config] Clients unavailable")
        return {"error": "config_unavailable"}

    variables = body.input or {}
    context = build_ld_context(body.context)

    try:
        if req_type == "prompt":
            result = handle_prompt(context, variables)
        elif req_type == "judge":
            result = handle_judge(context, variables)
        elif req_type == "ait-prompt":
            result = handle_ait_prompt(context, variables)
        else:
            result = handle_ait_judge(context, variables)
        flush_ld()
        return result
    except ValueError as exc:
        code = str(exc)
        if code in {
            "config_disabled",
            "model_unavailable",
            "provider_unavailable",
            "invalid_prompt",
            "invalid_judge",
        }:
            add_log("warn", f"[AI Config] {code}")
            flush_ld()
            return {"error": code}
        add_log("error", "[AI Config] Execution failed", {"message": code})
        flush_ld()
        return {"error": "config_error"}
    except Exception as exc:  # noqa: BLE001
        add_log("error", "[AI Config] Execution failed", {"message": str(exc)})
        flush_ld()
        return {"error": "config_error"}


def handle_prompt(context: Context, variables: dict[str, Any]) -> dict[str, Any]:
    add_log(
        "info",
        "[AI Config] Request received",
        {"type": "prompt", "configKey": PROMPT_GRAPH_KEY, "contextKey": context.key},
    )

    graph = load_graph(PROMPT_GRAPH_KEY, context)
    graph_tracker = graph.create_tracker()
    path: list[str] = []

    root_key = graph.root().get_key() if graph.root() else ROOT_PROMPT_AGENT
    path.append(root_key)

    content, meta = invoke_graph_agent(graph, root_key, context, variables)
    if not content:
        raise ValueError("invalid_prompt")

    prompt_judge = run_brand_accuracy_judge(
        context, content, content, PROMPT_GRAPH_KEY
    )
    final_prompt = content
    final_meta = meta
    prompt_fallback_used = False
    judge_threshold = get_handoff_threshold(graph, root_key, FALLBACK_PROMPT_AGENT)

    if (
        prompt_judge
        and isinstance(prompt_judge.get("score"), (int, float))
        and float(prompt_judge["score"]) < judge_threshold
    ):
        add_log(
            "info",
            "[AI Config] Prompt fallback triggered",
            {"configKey": PROMPT_GRAPH_KEY, "judgeScore": prompt_judge["score"]},
        )
        fallback_node = graph.get_node(FALLBACK_PROMPT_AGENT)
        if fallback_node is not None:
            graph_tracker.track_handoff_success(root_key, FALLBACK_PROMPT_AGENT)
            path.append(FALLBACK_PROMPT_AGENT)
            fb_content, fb_meta = invoke_graph_agent(
                graph, FALLBACK_PROMPT_AGENT, context, variables
            )
            if fb_content:
                final_prompt = fb_content
                final_meta = fb_meta
                prompt_fallback_used = True
                prompt_judge = run_brand_accuracy_judge(
                    context, final_prompt, final_prompt, PROMPT_GRAPH_KEY
                )

    graph_tracker.track_path(path)
    graph_tracker.track_invocation_success()
    if final_meta.get("usage"):
        usage = final_meta["usage"]
        graph_tracker.track_total_tokens(
            TokenUsage(
                input=usage.get("inputTokens", 0),
                output=usage.get("outputTokens", 0),
                total=usage.get("totalTokens", 0),
            )
        )

    response: dict[str, Any] = {
        "prompt": final_prompt,
        "meta": final_meta,
    }
    if prompt_judge:
        response["judge"] = prompt_judge
    if prompt_fallback_used:
        response["fallback"] = {"prompt": True}
    return response


def handle_judge(context: Context, variables: dict[str, Any]) -> dict[str, Any]:
    add_log(
        "info",
        "[AI Config] Request received",
        {"type": "judge", "configKey": SCORING_GRAPH_KEY, "contextKey": context.key},
    )

    prompt_value = variables.get("prompt") if isinstance(variables.get("prompt"), str) else ""
    response_value = (
        variables.get("response") if isinstance(variables.get("response"), str) else ""
    )

    graph = load_graph(SCORING_GRAPH_KEY, context)
    graph_tracker = graph.create_tracker()
    path: list[str] = []

    root_key = graph.root().get_key() if graph.root() else ROOT_SCORE_AGENT
    path.append(root_key)

    extra_user = None
    assert ai_client is not None
    root_cfg = ai_client.agent_config(
        root_key,
        context,
        AIAgentConfigDefault.disabled(),
        variables,
    )
    if not getattr(root_cfg, "messages", None) and (prompt_value or response_value):
        extra_user = f"Prompt: {prompt_value}\nResponse: {response_value}"

    content, meta = invoke_graph_agent(
        graph, root_key, context, variables, extra_user=extra_user
    )
    if not content:
        raise ValueError("invalid_judge")

    parsed = safe_parse_json(content)
    judge_fields = extract_judge(parsed)

    judge_display = run_brand_accuracy_judge(
        context, prompt_value, response_value, SCORING_GRAPH_KEY
    )
    judge_fallback_used = False
    judge_threshold = get_handoff_threshold(graph, root_key, FALLBACK_SCORE_AGENT)

    if (
        judge_display
        and isinstance(judge_display.get("score"), (int, float))
        and float(judge_display["score"]) < judge_threshold
    ):
        add_log(
            "info",
            "[AI Config] Judge fallback triggered",
            {"configKey": SCORING_GRAPH_KEY, "judgeScore": judge_display["score"]},
        )
        fallback_node = graph.get_node(FALLBACK_SCORE_AGENT)
        if fallback_node is not None:
            graph_tracker.track_handoff_success(root_key, FALLBACK_SCORE_AGENT)
            path.append(FALLBACK_SCORE_AGENT)
            fb_content, fb_meta = invoke_graph_agent(
                graph,
                FALLBACK_SCORE_AGENT,
                context,
                variables,
                extra_user=extra_user,
            )
            if fb_content:
                content = fb_content
                meta = fb_meta
                parsed = safe_parse_json(content)
                judge_fields = extract_judge(parsed)
                judge_fallback_used = True
                judge_display = run_brand_accuracy_judge(
                    context, prompt_value, response_value, SCORING_GRAPH_KEY
                )

    graph_tracker.track_path(path)
    graph_tracker.track_invocation_success()
    if meta.get("usage"):
        usage = meta["usage"]
        graph_tracker.track_total_tokens(
            TokenUsage(
                input=usage.get("inputTokens", 0),
                output=usage.get("outputTokens", 0),
                total=usage.get("totalTokens", 0),
            )
        )

    if judge_fields:
        result: dict[str, Any] = {**judge_fields, "meta": meta}
    else:
        result = {"verdict": content, "meta": meta}

    if judge_display:
        result["judge"] = judge_display
    if judge_fallback_used:
        result["fallback"] = {"judge": True}
    return result


def handle_ait_prompt(context: Context, variables: dict[str, Any]) -> dict[str, Any]:
    add_log(
        "info",
        "[AI Config] Request received",
        {
            "type": "ait-prompt",
            "configKey": AIT_PROMPT_GRAPH_KEY,
            "contextKey": context.key,
        },
    )

    graph = load_graph(AIT_PROMPT_GRAPH_KEY, context)
    graph_tracker = graph.create_tracker()
    path: list[str] = []

    root_key = AIT_ROOT_PROMPT_AGENT
    path.append(root_key)

    content, meta = invoke_graph_agent(graph, root_key, context, variables)
    if not content:
        raise ValueError("invalid_prompt")

    prompt_judge = run_brand_accuracy_judge(
        context,
        content,
        content,
        AIT_PROMPT_GRAPH_KEY,
        judge_eval_key=AIT_JUDGE_EVAL_KEY,
    )
    final_content = content
    final_meta = meta
    prompt_fallback_used = False
    judge_threshold = get_handoff_threshold(
        graph, root_key, AIT_FALLBACK_PROMPT_AGENT
    )

    if (
        prompt_judge
        and isinstance(prompt_judge.get("score"), (int, float))
        and float(prompt_judge["score"]) < judge_threshold
    ):
        add_log(
            "info",
            "[AI Config] AI-t Mile prompt fallback triggered",
            {"configKey": AIT_PROMPT_GRAPH_KEY, "judgeScore": prompt_judge["score"]},
        )
        fallback_node = graph.get_node(AIT_FALLBACK_PROMPT_AGENT)
        if fallback_node is not None:
            graph_tracker.track_handoff_success(root_key, AIT_FALLBACK_PROMPT_AGENT)
            path.append(AIT_FALLBACK_PROMPT_AGENT)
            fb_content, fb_meta = invoke_graph_agent(
                graph, AIT_FALLBACK_PROMPT_AGENT, context, variables
            )
            if fb_content:
                final_content = fb_content
                final_meta = fb_meta
                prompt_fallback_used = True
                prompt_judge = run_brand_accuracy_judge(
                    context,
                    final_content,
                    final_content,
                    AIT_PROMPT_GRAPH_KEY,
                    judge_eval_key=AIT_JUDGE_EVAL_KEY,
                )

    graph_tracker.track_path(path)
    graph_tracker.track_invocation_success()
    if final_meta.get("usage"):
        usage = final_meta["usage"]
        graph_tracker.track_total_tokens(
            TokenUsage(
                input=usage.get("inputTokens", 0),
                output=usage.get("outputTokens", 0),
                total=usage.get("totalTokens", 0),
            )
        )

    parsed = safe_parse_json(final_content)
    fields = extract_ait_prompt(parsed)
    if not fields:
        raise ValueError("invalid_prompt")

    response: dict[str, Any] = {
        "topic": fields["topic"],
        "bars": fields["bars"],
        "meta": final_meta,
    }
    if prompt_judge:
        response["judge"] = prompt_judge
    if prompt_fallback_used:
        response["fallback"] = {"prompt": True}
    return response


def handle_ait_judge(context: Context, variables: dict[str, Any]) -> dict[str, Any]:
    add_log(
        "info",
        "[AI Config] Request received",
        {
            "type": "ait-judge",
            "configKey": AIT_SCORING_GRAPH_KEY,
            "contextKey": context.key,
        },
    )

    topic_value = variables.get("topic") if isinstance(variables.get("topic"), str) else ""
    ai_bars_value = (
        variables.get("ai_bars") if isinstance(variables.get("ai_bars"), str) else ""
    )
    response_value = (
        variables.get("response") if isinstance(variables.get("response"), str) else ""
    )

    graph = load_graph(AIT_SCORING_GRAPH_KEY, context)
    graph_tracker = graph.create_tracker()
    path: list[str] = []

    root_key = graph.root().get_key() if graph.root() else AIT_ROOT_SCORE_AGENT
    path.append(root_key)

    extra_user = None
    assert ai_client is not None
    root_cfg = ai_client.agent_config(
        root_key,
        context,
        AIAgentConfigDefault.disabled(),
        variables,
    )
    if not getattr(root_cfg, "messages", None) and (
        topic_value or ai_bars_value or response_value
    ):
        extra_user = (
            f"Topic: {topic_value}\nAI bars: {ai_bars_value}\nHuman bars: {response_value}"
        )

    content, meta = invoke_graph_agent(
        graph, root_key, context, variables, extra_user=extra_user
    )
    if not content:
        raise ValueError("invalid_judge")

    parsed = safe_parse_json(content)
    score_fields = extract_ait_score(parsed)

    judge_prompt = extra_user or (
        f"Topic: {topic_value}\nAI bars: {ai_bars_value}\nHuman bars: {response_value}"
        if (topic_value or ai_bars_value or response_value)
        else content
    )
    judge_display = run_brand_accuracy_judge(
        context,
        judge_prompt,
        content,
        AIT_SCORING_GRAPH_KEY,
        judge_eval_key=AIT_JUDGE_EVAL_KEY,
    )
    judge_fallback_used = False
    judge_threshold = get_handoff_threshold(
        graph, root_key, AIT_FALLBACK_SCORE_AGENT
    )

    if (
        judge_display
        and isinstance(judge_display.get("score"), (int, float))
        and float(judge_display["score"]) < judge_threshold
    ):
        add_log(
            "info",
            "[AI Config] AI-t Mile judge fallback triggered",
            {"configKey": AIT_SCORING_GRAPH_KEY, "judgeScore": judge_display["score"]},
        )
        fallback_node = graph.get_node(AIT_FALLBACK_SCORE_AGENT)
        if fallback_node is not None:
            graph_tracker.track_handoff_success(root_key, AIT_FALLBACK_SCORE_AGENT)
            path.append(AIT_FALLBACK_SCORE_AGENT)
            fb_content, fb_meta = invoke_graph_agent(
                graph,
                AIT_FALLBACK_SCORE_AGENT,
                context,
                variables,
                extra_user=extra_user,
            )
            if fb_content:
                content = fb_content
                meta = fb_meta
                parsed = safe_parse_json(content)
                score_fields = extract_ait_score(parsed)
                judge_fallback_used = True
                judge_display = run_brand_accuracy_judge(
                    context,
                    judge_prompt,
                    content,
                    AIT_SCORING_GRAPH_KEY,
                    judge_eval_key=AIT_JUDGE_EVAL_KEY,
                )

    graph_tracker.track_path(path)
    graph_tracker.track_invocation_success()
    if meta.get("usage"):
        usage = meta["usage"]
        graph_tracker.track_total_tokens(
            TokenUsage(
                input=usage.get("inputTokens", 0),
                output=usage.get("outputTokens", 0),
                total=usage.get("totalTokens", 0),
            )
        )

    if score_fields:
        result: dict[str, Any] = {**score_fields, "meta": meta}
    else:
        result = {"verdict": content, "meta": meta}

    if judge_display:
        result["judge"] = judge_display
    if judge_fallback_used:
        result["fallback"] = {"judge": True}
    return result


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
