
"use strict";

/**
 * ============================================================
 * THEURIQ-AI — INTELLIGENCE BRAIN
 * Version: 4.0.0
 *
 * Responsibilities:
 * - Understand user intentions
 * - Detect task categories
 * - Select intelligence modules
 * - Identify learning and development requests
 * - Create structured execution plans
 * - Detect conversation commands
 * ============================================================
 */

// ============================================================
// CORE CONFIGURATION
// ============================================================

const ENGINE_NAME = "THEURIQ Intelligence Engine";
const BRAIN_VERSION = "4.0.0";

// ============================================================
// INTELLIGENCE MODULES
// ============================================================

const MODULES = {
  chat: {
    name: "Chat Engine",
    description: "General conversations, reasoning and assistance.",
    capabilities: [
      "conversation",
      "explanations",
      "problem solving",
      "recommendations"
    ]
  },

  developer: {
    name: "Developer Engine",
    description: "Software development, coding, debugging and architecture.",
    capabilities: [
      "code generation",
      "debugging",
      "software architecture",
      "application development",
      "code review",
      "API development"
    ]
  },

  learning: {
    name: "Learning Engine",
    description: "Structured teaching, explanations, exercises and assessment.",
    capabilities: [
      "teaching",
      "lessons",
      "exercises",
      "quizzes",
      "learning roadmaps",
      "progressive instruction"
    ]
  },

  research: {
    name: "Research Engine",
    description: "Research, investigation, analysis and comparisons.",
    capabilities: [
      "research",
      "analysis",
      "fact checking",
      "comparisons",
      "information organization"
    ]
  },

  creator: {
    name: "Creator Engine",
    description: "Creative work, writing, content and design planning.",
    capabilities: [
      "writing",
      "content creation",
      "branding",
      "creative concepts",
      "marketing ideas"
    ]
  },

  automation: {
    name: "Automation Engine",
    description: "Automation planning, integrations and workflow design.",
    capabilities: [
      "workflow design",
      "task automation",
      "integrations",
      "scripts",
      "scheduled processes"
    ]
  }
};

// ============================================================
// INTENT PATTERNS
// ============================================================

const INTENT_PATTERNS = {
  learning: [
    /\bteach me\b/i,
    /\bteach\b/i,
    /\blearn\b/i,
    /\blearning\b/i,
    /\blesson\b/i,
    /\bstudy\b/i,
    /\bexplain to me\b/i,
    /\bquiz me\b/i,
    /\btest me\b/i,
    /\bhow do i understand\b/i,
    /\bfrom zero\b/i,
    /\bfrom scratch\b/i,
    /\bbeginner course\b/i
  ],

  developer: [
    /\bcode\b/i,
    /\bcoding\b/i,
    /\bprogramming\b/i,
    /\bprogram\b/i,
    /\bdeveloper\b/i,
    /\bdebug\b/i,
    /\bdebugging\b/i,
    /\bbug\b/i,
    /\berror\b/i,
    /\bwebsite\b/i,
    /\bweb app\b/i,
    /\bapplication\b/i,
    /\bsoftware\b/i,
    /\bjavascript\b/i,
    /\bpython\b/i,
    /\bhtml\b/i,
    /\bcss\b/i,
    /\bdatabase\b/i,
    /\bapi\b/i,
    /\bgithub\b/i,
    /\brender\b/i,
    /\bnode\.?js\b/i,
    /\bbackend\b/i,
    /\bfrontend\b/i,
    /\bserver\b/i,
    /\bbuild an app\b/i
  ],

  research: [
    /\bresearch\b/i,
    /\binvestigate\b/i,
    /\bcompare\b/i,
    /\blatest\b/i,
    /\bcurrent information\b/i,
    /\bsources\b/i,
    /\banalyze\b/i,
    /\banalysis\b/i,
    /\bfact check\b/i,
    /\bstatistics\b/i,
    /\bfind information\b/i
  ],

  creator: [
    /\bwrite\b/i,
    /\bwriting\b/i,
    /\barticle\b/i,
    /\bstory\b/i,
    /\bbrand\b/i,
    /\blog[o]?\b/i,
    /\bmarketing\b/i,
    /\bcontent\b/i,
    /\bcaption\b/i,
    /\bcreative\b/i,
    /\bdesign concept\b/i,
    /\bbusiness idea\b/i,
    /\bproduct idea\b/i,
    /\bdescription\b/i
  ],

  automation: [
    /\bautomate\b/i,
    /\bautomation\b/i,
    /\bworkflow\b/i,
    /\bintegrate\b/i,
    /\bscheduled task\b/i,
    /\brepetitive task\b/i,
    /\bautomated system\b/i,
    /\bcron\b/i
  ]
};

// ============================================================
// LANGUAGE AND TECHNOLOGY DETECTION
// ============================================================

const TECHNOLOGIES = [
  { name: "JavaScript", patterns: [/\bjavascript\b/i, /\bjs\b/i, /console\.log/i] },
  { name: "Python", patterns: [/\bpython\b/i, /\bdef\s+\w+/i, /\bprint\s*\(/i] },
  { name: "HTML", patterns: [/\bhtml\b/i, /<html/i, /<div/i] },
  { name: "CSS", patterns: [/\bcss\b/i, /@media/i, /\bflexbox\b/i] },
  { name: "Java", patterns: [/\bjava\b/i, /public\s+class/i] },
  { name: "C++", patterns: [/\bc\+\+\b/i, /#include\s*</i] },
  { name: "SQL", patterns: [/\bsql\b/i, /\bselect\b.*\bfrom\b/i] },
  { name: "TypeScript", patterns: [/\btypescript\b/i, /\bts\b/i] },
  { name: "PHP", patterns: [/\bphp\b/i, /<\?php/i] },
  { name: "React", patterns: [/\breact\b/i, /\bjsx\b/i] },
  { name: "Node.js", patterns: [/\bnode\.?js\b/i, /\bexpress\b/i] },
  { name: "Flutter", patterns: [/\bflutter\b/i, /\bdart\b/i] },
  { name: "Kotlin", patterns: [/\bkotlin\b/i] },
  { name: "Swift", patterns: [/\bswift\b/i] }
];

function detectTechnology(message) {
  if (typeof message !== "string") {
    return null;
  }

  for (const technology of TECHNOLOGIES) {
    if (
      technology.patterns.some(pattern => pattern.test(message))
    ) {
      return technology.name;
    }
  }

  return null;
}

// ============================================================
// ERROR DETECTION
// ============================================================

const ERROR_PATTERNS = [
  /\btraceback\b/i,
  /\bsyntaxerror\b/i,
  /\btypeerror\b/i,
  /\breferenceerror\b/i,
  /\bnameerror\b/i,
  /\bexception\b/i,
  /\bfailed\b/i,
  /\bcannot read\b/i,
  /\bis not defined\b/i,
  /\bmodule not found\b/i,
  /\bcommand not found\b/i,
  /\b404\b/i,
  /\b500\b/i,
  /\berror:/i
];

function detectError(message) {
  if (typeof message !== "string") {
    return false;
  }

  return ERROR_PATTERNS.some(pattern => pattern.test(message));
}

// ============================================================
// CODE DETECTION
// ============================================================

function detectCode(message) {
  if (typeof message !== "string") {
    return false;
  }

  return (
    /```[\s\S]*?```/.test(message) ||
    /function\s+\w+\s*\(/.test(message) ||
    /const\s+\w+\s*=/.test(message) ||
    /def\s+\w+\s*\(/.test(message) ||
    /class\s+\w+/.test(message) ||
    /<html[\s>]/i.test(message)
  );
}

// ============================================================
// CONVERSATION COMMAND DETECTION
// ============================================================

function detectCommand(message) {
  const text = String(message || "")
    .trim()
    .toLowerCase();

  if (!text) return "empty";

  const commands = {
    continue: [
      "continue",
      "continue pls",
      "go on",
      "next",
      "endelea",
      "proceed",
      "keep going"
    ],

    repeat: [
      "repeat",
      "explain again",
      "say that again",
      "start again"
    ],

    simplify: [
      "simplify",
      "make it simple",
      "explain simply",
      "i don't understand",
      "i dont understand",
      "i am confused"
    ],

    test: [
      "test me",
      "quiz me",
      "give me a test",
      "give me questions"
    ],

    help: [
      "help",
      "help me",
      "i need help"
    ]
  };

  for (const [command, phrases] of Object.entries(commands)) {
    if (phrases.includes(text)) {
      return command;
    }
  }

  return "normal";
}

// ============================================================
// INTENT SCORING
// ============================================================

function scoreIntent(message) {
  const scores = {
    chat: 0,
    developer: 0,
    learning: 0,
    research: 0,
    creator: 0,
    automation: 0
  };

  for (const [module, patterns] of Object.entries(INTENT_PATTERNS)) {
    for (const pattern of patterns) {
      if (pattern.test(message)) {
        scores[module] += 1;
      }
    }
  }

  if (detectError(message)) {
    scores.developer += 3;
  }

  if (detectCode(message)) {
    scores.developer += 2;
  }

  if (detectTechnology(message)) {
    scores.developer += 1;
  }

  return scores;
}

// ============================================================
// REQUEST UNDERSTANDING
// ============================================================

function understandRequest(message) {
  if (typeof message !== "string" || !message.trim()) {
    return "chat";
  }

  const text = message.trim();

  const scores = scoreIntent(text);

  const entries = Object.entries(scores)
    .filter(([module]) => module !== "chat")
    .sort((a, b) => b[1] - a[1]);

  if (!entries.length || entries[0][1] === 0) {
    return "chat";
  }

  const highestScore = entries[0][1];

  const winners = entries.filter(
    entry => entry[1] === highestScore
  );

  // Teaching should take priority when the user
  // explicitly requests a lesson or explanation.
  if (
    /\b(teach me|lesson|learn|quiz me|test me|study)\b/i.test(text)
  ) {
    return "learning";
  }

  // When the request concerns a coding error,
  // debugging should take priority.
  if (detectError(text) || detectCode(text)) {
    return "developer";
  }

  // Ambiguous requests use the strongest matching module.
  return winners[0][0];
}

// ============================================================
// REQUEST CLASSIFICATION
// ============================================================

function classifyRequest(message) {
  const moduleId = understandRequest(message);

  return {
    module: moduleId,
    moduleName: MODULES[moduleId].name,
    technology: detectTechnology(message),
    hasCode: detectCode(message),
    hasError: detectError(message),
    command: detectCommand(message),
    scores: scoreIntent(message)
  };
}

// ============================================================
// LEARNING REQUEST DETECTION
// ============================================================

function detectLearningStage(message, project = {}) {
  const text = String(message || "").toLowerCase();

  if (
    /\bfrom zero\b|\bfrom scratch\b|\bi know nothing\b|\bi don't know anything\b|\babsolute beginner\b/.test(text)
  ) {
    return "foundations";
  }

  if (
    /\badvanced\b|\bexpert\b|\bprofessional level\b/.test(text)
  ) {
    return "advanced";
  }

  if (
    /\bbeginner\b|\bstarting\b|\bnew to programming\b/.test(text)
  ) {
    return "beginner";
  }

  if (project.level) {
    return project.level;
  }

  return "beginner";
}

// ============================================================
// TASK PLANNING
// ============================================================

function createPlan(message, preferredModule = null) {
  if (typeof message !== "string" || !message.trim()) {
    throw new Error("A valid message is required.");
  }

  const cleanedMessage = message.trim();

  const validPreferredModule =
    preferredModule && MODULES[preferredModule]
      ? preferredModule
      : null;

  const classification = classifyRequest(cleanedMessage);

  const moduleId =
    validPreferredModule || classification.module;

  const moduleInfo = MODULES[moduleId];

  const plan = {
    engine: ENGINE_NAME,
    version: BRAIN_VERSION,

    module: moduleId,
    moduleName: moduleInfo.name,
    moduleDescription: moduleInfo.description,

    task: cleanedMessage,

    classification: {
      technology: classification.technology,
      hasCode: classification.hasCode,
      hasError: classification.hasError,
      command: classification.command
    },

    learning: {
      applicable: moduleId === "learning",
      stage: detectLearningStage(cleanedMessage)
    },

    capabilities: moduleInfo.capabilities,

    status: "planned",

    createdAt: new Date().toISOString()
  };

  return plan;
}

// ============================================================
// MAIN INTELLIGENCE ENTRY POINT
// ============================================================

async function processRequest(message, options = {}) {
  const plan = createPlan(
    message,
    options.module || null
  );

  return {
    ok: true,
    engine: ENGINE_NAME,
    version: BRAIN_VERSION,
    plan,
    response: null,
    notice: "Request successfully understood and classified. AI provider execution is handled by the orchestrator."
  };
}

// ============================================================
// ENGINE CAPABILITIES
// ============================================================

function getCapabilities() {
  return {
    engine: ENGINE_NAME,
    version: BRAIN_VERSION,

    modules: Object.entries(MODULES).map(([id, module]) => ({
      id,
      name: module.name,
      description: module.description,
      capabilities: module.capabilities
    })),

    detection: {
      intentDetection: true,
      technologyDetection: true,
      codeDetection: true,
      errorDetection: true,
      commandDetection: true,
      learningStageDetection: true
    }
  };
}

// ============================================================
// EXPORTS
// ============================================================

module.exports = {
  ENGINE_NAME,
  BRAIN_VERSION,
  MODULES,

  understandRequest,
  classifyRequest,
  detectTechnology,
  detectError,
  detectCode,
  detectCommand,
  detectLearningStage,

  createPlan,
  processRequest,
  getCapabilities
};
