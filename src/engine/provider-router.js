
/**
 * THEURIQ-AI
 * AI Provider Router
 *
 * Connects the Intelligence Engine to AI providers.
 * API keys remain on the backend.
 */

const PROVIDERS = {
  groq: {
    name: "Groq",
    baseURL: "https://api.groq.com/openai/v1",
    apiKey: () => process.env.GROQ_API_KEY,
    model: () => process.env.GROQ_MODEL
  },

  openai: {
    name: "OpenAI",
    baseURL: "https://api.openai.com/v1",
    apiKey: () => process.env.OPENAI_API_KEY,
    model: () => process.env.OPENAI_MODEL
  }
};

/**
 * Resolve the provider and model.
 */
function resolveProvider(requestedProvider, requestedModel) {
  const providerId =
    requestedProvider ||
    process.env.DEFAULT_AI_PROVIDER ||
    "groq";

  const provider = PROVIDERS[providerId];

  if (!provider) {
    throw new Error(
      `Unsupported AI provider: ${providerId}`
    );
  }

  const apiKey = provider.apiKey();

  if (!apiKey) {
    throw new Error(
      `${provider.name} API key is not configured.`
    );
  }

  const model =
    requestedModel ||
    provider.model() ||
    process.env.DEFAULT_AI_MODEL;

  if (!model) {
    throw new Error(
      `No AI model configured for ${provider.name}.`
    );
  }

  return {
    providerId,
    provider,
    apiKey,
    model
  };
}

/**
 * Send a request to an AI provider.
 */
async function generateResponse({
  messages,
  provider: requestedProvider,
  model: requestedModel,
  temperature = 0.7,
  maxTokens = 2048
}) {
  if (!Array.isArray(messages) || messages.length === 0) {
    throw new Error("Messages are required.");
  }

  for (const message of messages) {
    if (
      !message ||
      !["system", "user", "assistant"].includes(message.role) ||
      typeof message.content !== "string"
    ) {
      throw new Error("Invalid message format.");
    }
  }

  const {
    providerId,
    provider,
    apiKey,
    model
  } = resolveProvider(
    requestedProvider,
    requestedModel
  );

  const response = await fetch(
    `${provider.baseURL}/chat/completions`,
    {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model,
        messages,
        temperature,
        max_tokens: maxTokens
      }),
      signal: AbortSignal.timeout(60000)
    }
  );

  const result = await response.json().catch(() => null);

  if (!response.ok) {
    const reason =
      result?.error?.message ||
      `Provider returned HTTP ${response.status}`;

    throw new Error(`${provider.name}: ${reason}`);
  }

  const content = result?.choices?.[0]?.message?.content;

  if (typeof content !== "string" || !content.trim()) {
    throw new Error(
      `${provider.name} returned an empty response.`
    );
  }

  return {
    ok: true,
    content,
    provider: providerId,
    model,
    usage: result.usage || null
  };
}

/**
 * Show supported providers.
 * Never expose API keys.
 */
function getAvailableProviders() {
  return Object.entries(PROVIDERS).map(
    ([id, provider]) => ({
      id,
      name: provider.name,
      configured: Boolean(provider.apiKey())
    })
  );
}

module.exports = {
  generateResponse,
  resolveProvider,
  getAvailableProviders
};
