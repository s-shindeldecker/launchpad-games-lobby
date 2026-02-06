import { init, type LDClient } from '@launchdarkly/node-server-sdk'
import { initAi, type LDAIClient } from '@launchdarkly/server-sdk-ai'
import OpenAI from 'openai'

type AiConfigInput = {
  type: 'prompt' | 'judge'
  input?: Record<string, unknown>
  context?: Record<string, unknown>
}

type AiContext = {
  kind: 'user'
  key: string
  anonymous?: boolean
  name?: string
  state?: string
  owned_platforms?: string[]
  region?: string
  plan?: string
  device?: string
  platform?: string
}

let ldClient: LDClient | null = null
let aiClient: LDAIClient | null = null
let openaiClient: OpenAI | null = null
let initPromise: Promise<void> | null = null

const ensureClients = async () => {
  if (initPromise) {
    await initPromise
    return
  }
  initPromise = (async () => {
    const sdkKey = process.env.LAUNCHDARKLY_SDK_KEY
    if (!sdkKey) {
      throw new Error('missing_launchdarkly_sdk_key')
    }
    ldClient = init(sdkKey)
    await ldClient.waitForInitialization()
    aiClient = initAi(ldClient)
    openaiClient = new OpenAI()
  })()
  await initPromise
}

const buildContext = (payload?: Record<string, unknown>): AiContext => {
  const keyValue = payload?.key
  const key =
    typeof keyValue === 'string' && keyValue.trim().length
      ? keyValue
      : 'demo-user'
  return {
    kind: 'user',
    key,
    anonymous: payload?.anonymous === true,
    name: typeof payload?.name === 'string' ? payload.name : undefined,
    state: typeof payload?.state === 'string' ? payload.state : undefined,
    owned_platforms: Array.isArray(payload?.owned_platforms)
      ? (payload?.owned_platforms as string[])
      : undefined,
    region: typeof payload?.region === 'string' ? payload.region : undefined,
    plan: typeof payload?.plan === 'string' ? payload.plan : undefined,
    device: typeof payload?.device === 'string' ? payload.device : undefined,
    platform:
      typeof payload?.platform === 'string' ? payload.platform : undefined
  }
}

const extractPrompt = (payload: unknown) => {
  if (typeof payload === 'string') return payload
  if (!payload || typeof payload !== 'object') return null
  const value = payload as { prompt?: unknown; output?: unknown; result?: unknown }
  if (typeof value.prompt === 'string') return value.prompt
  if (
    value.output &&
    typeof value.output === 'object' &&
    'prompt' in (value.output as Record<string, unknown>)
  ) {
    const outputPrompt = (value.output as { prompt?: unknown }).prompt
    if (typeof outputPrompt === 'string') return outputPrompt
  }
  if (
    value.result &&
    typeof value.result === 'object' &&
    'prompt' in (value.result as Record<string, unknown>)
  ) {
    const resultPrompt = (value.result as { prompt?: unknown }).prompt
    if (typeof resultPrompt === 'string') return resultPrompt
  }
  return null
}

const extractJudge = (payload: unknown) => {
  if (!payload || typeof payload !== 'object') return null
  const value = payload as {
    score?: unknown
    label?: unknown
    verdict?: unknown
    output?: unknown
    result?: unknown
  }
  if (
    typeof value.score === 'number' ||
    typeof value.label === 'string' ||
    typeof value.verdict === 'string'
  ) {
    return {
      score: value.score,
      label: value.label,
      verdict: value.verdict
    }
  }
  const nested = value.output ?? value.result
  if (nested && typeof nested === 'object') {
    const nestedValue = nested as {
      score?: unknown
      label?: unknown
      verdict?: unknown
    }
    return {
      score: nestedValue.score,
      label: nestedValue.label,
      verdict: nestedValue.verdict
    }
  }
  return null
}

export default defineEventHandler(async (event) => {
  const body = (await readBody(event)) as AiConfigInput
  const type = body?.type
  if (type !== 'prompt' && type !== 'judge') {
    return { error: 'unknown_type' }
  }

  try {
    await ensureClients()
    if (!aiClient || !openaiClient) {
      return { error: 'config_unavailable' }
    }

    const promptKey =
      process.env.LD_AI_CONFIG_PROMPT_KEY ?? 'talkin-ship-prompt'
    const judgeKey =
      process.env.LD_AI_CONFIG_JUDGE_KEY ?? 'talkin-ship-judge'
    const configKey = type === 'prompt' ? promptKey : judgeKey
    const ctx = buildContext(body.context)

    const aiConfig = await aiClient.completionConfig(
      configKey,
      ctx,
      {},
      body.input ?? {}
    )

    if (!aiConfig.enabled) {
      return { error: 'config_disabled' }
    }

    if (!aiConfig.model?.name) {
      return { error: 'model_unavailable' }
    }

    const messages = aiConfig.messages ? [...aiConfig.messages] : []
    if (!messages.length && type === 'judge') {
      const promptValue =
        typeof body.input?.prompt === 'string' ? body.input.prompt : ''
      const responseValue =
        typeof body.input?.response === 'string' ? body.input.response : ''
      if (promptValue || responseValue) {
        messages.push({
          role: 'user',
          content: `Prompt: ${promptValue}\nResponse: ${responseValue}`
        })
      }
    }

    const completion = await aiConfig.tracker.trackOpenAIMetrics(() =>
      openaiClient!.chat.completions.create({
        model: aiConfig.model!.name,
        messages
      })
    )

    const content = completion.choices?.[0]?.message?.content?.trim()
    if (!content) {
      return { error: type === 'prompt' ? 'invalid_prompt' : 'invalid_judge' }
    }

    if (type === 'prompt') {
      return { prompt: content }
    }

    try {
      const parsed = JSON.parse(content)
      const judge = extractJudge(parsed)
      return judge ?? { verdict: content }
    } catch {
      return { verdict: content }
    }
  } catch (error) {
    return { error: 'config_error' }
  }
})
