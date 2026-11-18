
/**
 * THEURIQ-AI
 * Intelligence Orchestrator
 *
 * Coordinates task understanding, planning
 * and AI provider execution.
 */

const { createPlan, MODULES } = require("./brain");

const {
  generateResponse
} = require("./provider-router");

const SYSTEM_PROMPT = `
You are THEURIQ-AI, a powerful and versatile
personal AI intelligence platform.

Your purpose is to help users think, create,
research, learn, solve problems and develop
software.

IDENTITY:
- Your name is THEURIQ-AI.
- You are professional, intelligent and helpful.
- Explain complicated ideas clearly.
- Be honest about uncertainty and limitations.
- Never claim to have performed actions you
  have not actually performed.

SOFTWARE DEVELOPMENT:
- Generate complete, usable code when requested.
- Explain where files belong.
- Preserve existing project architecture.
- Never pretend code has been tested when it
  has not been executed.
- Explain important security considerations.

GENERAL BEHAVIOUR:
- Understand the user's actual intention.
- Give practical and accurate answers.
- Avoid unnecessary repetition.
- Ask for clarification when essential details
  are missing.
- Never reveal private API keys or secrets.

You are the intelligence behind THEURIQ-AI.
`;

async function executeRequest(message, options = {}) {
  if (
    typeof message !== "string" ||
    !message.trim()
  ) {
    throw new Error("A valid message is required.");
  }

  const plan = createPlan(
    message,
    options.module || null
  );

  const moduleInfo = MODULES[plan.module];

  const messages = [
    {
      role: "system",
      content:
        SYSTEM_PROMPT +
        "\n\nCURRENT ENGINE: " +
        moduleInfo.name +
        "\nENGINE PURPOSE: " +
        moduleInfo.description
    },
    {
      role: "user",
      content: message.trim()
    }
  ];

  const result = await generateResponse({
    messages,
    provider: options.provider,
    model: options.model
  });

  return {
    ok: true,
    engine: "THEURIQ Intelligence Engine",
    module: plan.module,
    moduleName: plan.moduleName,
    response: result.content,
    provider: result.provider,
    model: result.model,
    usage: result.usage
  };
}

module.exports = {
  executeRequest
};
