import { BedrockRuntimeClient, ConverseCommand } from '@aws-sdk/client-bedrock-runtime'
import { init, type LDClient } from '@launchdarkly/node-server-sdk'
import {
  initAi,
  type LDAIClient,
  type LDAIMetrics,
  type JudgeResponse
} from '@launchdarkly/server-sdk-ai'

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
let bedrockClient: BedrockRuntimeClient | null = null
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
    const region = process.env.AWS_REGION ?? process.env.AWS_DEFAULT_REGION
    if (!region) {
      throw new Error('missing_aws_region')
    }
    ldClient = init(sdkKey)
    await ldClient.waitForInitialization()
    aiClient = initAi(ldClient)
    bedrockClient = new BedrockRuntimeClient({ region })
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
    comment?: unknown
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
      verdict: value.verdict,
      comment: value.comment
    }
  }
  const nested = value.output ?? value.result
  if (nested && typeof nested === 'object') {
    const nestedValue = nested as {
      score?: unknown
      label?: unknown
      verdict?: unknown
      comment?: unknown
    }
    return {
      score: nestedValue.score,
      label: nestedValue.label,
      verdict: nestedValue.verdict,
      comment: nestedValue.comment
    }
  }
  return null
}

const stripJsonCodeFence = (value: string) => {
  const trimmed = value.trim()
  if (!trimmed.startsWith('```')) return trimmed
  const lines = trimmed.split('\n')
  const startIndex = lines[0].startsWith('```') ? 1 : 0
  const endIndex =
    lines[lines.length - 1].startsWith('```') ? lines.length - 1 : lines.length
  return lines.slice(startIndex, endIndex).join('\n').trim()
}

const safeParseJson = (value: string) => {
  try {
    return JSON.parse(stripJsonCodeFence(value))
  } catch {
    return null
  }
}

const evaluateJudge = async ({
  promptValue,
  responseValue,
  ctx,
  judgeEvalKey,
  aiClient,
  bedrockClient
}: {
  promptValue: string
  responseValue: string
  ctx: AiContext
  judgeEvalKey: string
  aiClient: LDAIClient
  bedrockClient: BedrockRuntimeClient
}) => {
  if (!promptValue || !responseValue) return undefined
  try {
    const judgeConfig = await aiClient.judgeConfig(
      judgeEvalKey,
      ctx,
      { enabled: false },
      { prompt: promptValue, response: responseValue }
    )
    if (!judgeConfig.enabled || !judgeConfig.model?.name) return undefined

    const evalMessages = judgeConfig.messages ? [...judgeConfig.messages] : []
    if (!evalMessages.length) {
      evalMessages.push({
        role: 'user',
        content: `Prompt: ${promptValue}\nResponse: ${responseValue}`
      })
    }

    const { system: evalSystem, messages: evalBedrockMessages } =
      toBedrockMessages(evalMessages)
    const invokeEvalModel = () =>
      bedrockClient.send(
        new ConverseCommand({
          modelId: judgeConfig.model!.name,
          messages: evalBedrockMessages,
          system: evalSystem
        })
      )
    const evalCompletion = judgeConfig.tracker?.trackMetricsOf
      ? await judgeConfig.tracker.trackMetricsOf(
          mapBedrockMetrics,
          invokeEvalModel
        )
      : await invokeEvalModel()
    const evalContent =
      evalCompletion.output?.message?.content?.[0]?.text?.trim() ?? ''
    if (!evalContent) return undefined

    const evalParsed = safeParseJson(evalContent)
    const evalJudge = extractJudge(evalParsed)
    if (!evalJudge) return undefined

    const rawScore = typeof evalJudge.score === 'number' ? evalJudge.score : 0
    const normalizedScore = rawScore > 1 ? rawScore / 100 : rawScore
    const judgeResult: JudgeResponse = {
      judgeConfigKey: judgeEvalKey,
      evals: {
        [judgeEvalKey]: {
          score: normalizedScore,
          reasoning: evalJudge.comment ?? evalJudge.verdict ?? ''
        }
      },
      success: true
    }
    judgeConfig.tracker?.trackJudgeResponse(judgeResult)

    return {
      metricKey: judgeEvalKey,
      score: normalizedScore,
      reasoning: judgeResult.evals[judgeEvalKey]?.reasoning ?? ''
    }
  } catch (judgeError) {
    console.warn('[AI Config] Judge evaluation failed', {
      message:
        judgeError instanceof Error ? judgeError.message : String(judgeError)
    })
    return undefined
  }
}

type BedrockMessage = {
  role: 'user' | 'assistant'
  content: { text: string }[]
}

const toBedrockMessages = (messages: { role: string; content: string }[]) => {
  const system: { text: string }[] = []
  const bedrockMessages: BedrockMessage[] = []

  for (const message of messages) {
    if (message.role === 'system') {
      system.push({ text: message.content })
      continue
    }
    if (message.role === 'assistant' || message.role === 'user') {
      bedrockMessages.push({
        role: message.role,
        content: [{ text: message.content }]
      })
    }
  }

  return {
    system: system.length ? system : undefined,
    messages: bedrockMessages
  }
}

const mapBedrockMetrics = (response: {
  usage?: { inputTokens?: number; outputTokens?: number; totalTokens?: number }
}): LDAIMetrics => ({
  success: true,
  usage: {
    input: response.usage?.inputTokens ?? 0,
    output: response.usage?.outputTokens ?? 0,
    total: response.usage?.totalTokens ?? 0
  }
})

export default defineEventHandler(async (event) => {
  const body = (await readBody(event)) as AiConfigInput
  const type = body?.type
  if (type !== 'prompt' && type !== 'judge') {
    return { error: 'unknown_type' }
  }

  try {
    await ensureClients()
    if (!aiClient || !bedrockClient) {
      console.error('[AI Config] Clients unavailable')
      return { error: 'config_unavailable' }
    }

    const promptKey =
      process.env.LD_AI_CONFIG_PROMPT_KEY ?? 'talkin-ship-prompt'
    const judgeKey =
      process.env.LD_AI_CONFIG_JUDGE_KEY ?? 'talkin-ship-judge'
    const judgeEvalKey =
      process.env.LD_AI_CONFIG_JUDGE_EVAL_KEY ?? 'brand-accuracy'
    const configKey = type === 'prompt' ? promptKey : judgeKey
    const ctx = buildContext(body.context)
    console.info('[AI Config] Request received', {
      type,
      configKey,
      contextKey: ctx.key
    })

    const aiConfig = await aiClient.completionConfig(
      configKey,
      ctx,
      {},
      body.input ?? {}
    )

    if (!aiConfig.enabled) {
      console.warn('[AI Config] Config disabled', { configKey })
      return { error: 'config_disabled' }
    }

    if (!aiConfig.model?.name) {
      console.error('[AI Config] Model unavailable', { configKey })
      return { error: 'model_unavailable' }
    }

    console.info('[AI Config] Config details', {
      configKey,
      modelName: aiConfig.model?.name,
      hasMessages: Boolean(aiConfig.messages?.length),
      trackerKeys: aiConfig.tracker ? Object.keys(aiConfig.tracker) : []
    })

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

    const { system, messages: bedrockMessages } = toBedrockMessages(messages)

    console.info('[AI Config] Metrics tracker available', {
      available: Boolean(aiConfig.tracker?.trackMetricsOf)
    })

    const invokeModel = () =>
      bedrockClient!.send(
        new ConverseCommand({
          modelId: aiConfig.model!.name,
          messages: bedrockMessages,
          system
        })
      )

    const completion = aiConfig.tracker?.trackMetricsOf
      ? await aiConfig.tracker.trackMetricsOf(mapBedrockMetrics, invokeModel)
      : await invokeModel()
    if (ldClient) {
      try {
        await ldClient.flush()
        console.info('[AI Config] LaunchDarkly flush complete')
      } catch (flushError) {
        console.error('[AI Config] LaunchDarkly flush failed', {
          message:
            flushError instanceof Error ? flushError.message : String(flushError)
        })
      }
    }

    const content = completion.output?.message?.content?.[0]?.text?.trim()
    if (!content) {
      console.error('[AI Config] Empty model response', { configKey })
      return { error: type === 'prompt' ? 'invalid_prompt' : 'invalid_judge' }
    }
    console.info('[AI Config] Model response received', {
      configKey,
      responsePreview: content.slice(0, 200)
    })

    const meta = {
      stopReason: completion.stopReason,
      usage: completion.usage
    }

    if (type === 'prompt') {
      const promptJudge = await evaluateJudge({
        promptValue: content,
        responseValue: content,
        ctx,
        judgeEvalKey,
        aiClient,
        bedrockClient
      })
      return { prompt: content, meta, judge: promptJudge }
    }

    try {
      const parsed = safeParseJson(content)
      const judge = extractJudge(parsed)
      const promptValue =
        typeof body.input?.prompt === 'string' ? body.input.prompt : ''
      const responseValue =
        typeof body.input?.response === 'string' ? body.input.response : ''
      const judgeDisplay = await evaluateJudge({
        promptValue,
        responseValue,
        ctx,
        judgeEvalKey,
        aiClient,
        bedrockClient
      })

      return judge
        ? {
            ...judge,
            meta,
            judge: judgeDisplay
          }
        : { verdict: content, meta, judge: judgeDisplay }
    } catch {
      return { verdict: content, meta }
    }
  } catch (error) {
    console.error('[AI Config] Execution failed', {
      type,
      message: error instanceof Error ? error.message : String(error)
    })
    return { error: 'config_error' }
  }
})
