
/**
 * THEURIQ-AI
 * Intelligence Engine
 *
 * Central coordinator for AI operations.
 */

const ENGINE_NAME = "THEURIQ Intelligence Engine";

const MODULES = {
  chat: {
    name: "Chat Engine",
    description: "General conversations and reasoning"
  },
  developer: {
    name: "Developer Engine",
    description: "Software development and debugging"
  },
  research: {
    name: "Research Engine",
    description: "Research and information gathering"
  },
  creator: {
    name: "Creator Engine",
    description: "Writing and creative tasks"
  },
  learning: {
    name: "Learning Engine",
    description: "Teaching and explanations"
  },
  automation: {
    name: "Automation Engine",
    description: "Workflow and automation planning"
  }
};

/**
 * Understand the user's request.
 */
function understandRequest(message) {
  const text = message.toLowerCase();

  if (
    /code|program|javascript|python|html|css|bug|debug|error|website|app|software|api/.test(text)
  ) {
    return "developer";
  }

  if (
    /research|investigate|latest|current|sources|find information/.test(text)
  ) {
    return "research";
  }

  if (
    /image|picture|illustration|design|logo|artwork/.test(text)
  ) {
    return "creator";
  }

  if (
    /teach|explain|learn|lesson|study|understand/.test(text)
  ) {
    return "learning";
  }

  if (
    /automate|automation|workflow|schedule|integrate/.test(text)
  ) {
    return "automation";
  }

  return "chat";
}

/**
 * Create an execution plan.
 */
function createPlan(message, preferredModule = null) {
  if (typeof message !== "string" || !message.trim()) {
    throw new Error("A valid message is required.");
  }

  const moduleId =
    preferredModule && MODULES[preferredModule]
      ? preferredModule
      : understandRequest(message);

  return {
    engine: ENGINE_NAME,
    module: moduleId,
    moduleName: MODULES[moduleId].name,
    task: message.trim(),
    status: "planned",
    provider: null,
    model: null,
    createdAt: new Date().toISOString()
  };
}

/**
 * Main intelligence entry point.
 */
async function processRequest(message, options = {}) {
  const plan = createPlan(
    message,
    options.module || null
  );

  return {
    ok: true,
    engine: ENGINE_NAME,
    plan,
    response: null,
    notice: "Task understood. AI provider execution is not connected yet."
  };
}

module.exports = {
  processRequest,
  understandRequest,
  createPlan,
  MODULES
};
