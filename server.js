
"use strict";

require("dotenv").config();

const express = require("express");
const helmet = require("helmet");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");

const { executeRequest } = require("./src/engine/orchestrator");

// ==================================================
// THEURIQ-AI SERVER
// ==================================================

const app = express();

const PORT = Number(process.env.PORT) || 3000;
const APP_NAME = "THEURIQ-AI";
const APP_VERSION = "4.0.0";

const ROOT_DIR = __dirname;
const PUBLIC_DIR = path.join(ROOT_DIR, "public");
const DATA_DIR = path.join(ROOT_DIR, "data");
const SESSIONS_FILE = path.join(DATA_DIR, "sessions.json");
const INDEX_FILE = path.join(PUBLIC_DIR, "index.html");

const MAX_SESSIONS = 1000;
const MAX_HISTORY = 50;
const MAX_MESSAGE_LENGTH = 30000;
const RATE_LIMIT = 40;
const RATE_WINDOW = 60 * 1000;

const ALLOWED_MODULES = [
  "chat",
  "developer",
  "learning",
  "research",
  "creator",
  "automation"
];

if (typeof executeRequest !== "function") {
  throw new Error("THEURIQ-AI orchestrator is not configured.");
}

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// ==================================================
// SECURITY AND EXPRESS CONFIGURATION
// ==================================================

app.disable("x-powered-by");

app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false
  })
);

app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true, limit: "2mb" }));

app.use(
  express.static(PUBLIC_DIR, {
    index: false,
    etag: true,
    maxAge: "1h"
  })
);

// ==================================================
// SESSION STORAGE
// ==================================================

const sessions = new Map();

function createSession() {
  const now = Date.now();

  return {
    history: [],
    summary: "",

    project: {
      name: "",
      language: "Python",
      goal: "Learn software development and build real applications",
      files: {},
      lastCode: "",
      lastError: "",
      level: "beginner",
      lessonsCompleted: [],
      currentLesson: 0
    },

    stats: {
      totalMessages: 0,
      totalCodeBlocks: 0,
      createdAt: now,
      lastActive: now
    },

    preferences: {
      languageStyle: "simple English",
      wantsFullCode: true,
      learningLevel: "beginner"
    }
  };
}

function loadSessions() {
  try {
    if (!fs.existsSync(SESSIONS_FILE)) {
      console.log("[MEMORY] No previous session file found.");
      return;
    }

    const raw = fs.readFileSync(SESSIONS_FILE, "utf8");
    const saved = JSON.parse(raw);

    if (!saved || typeof saved !== "object") {
      throw new Error("Invalid session data.");
    }

    for (const [id, session] of Object.entries(saved)) {
      if (
        /^[a-f0-9]{48}$/.test(id) &&
        session &&
        Array.isArray(session.history)
      ) {
        sessions.set(id, session);
      }
    }

    console.log(`[MEMORY] Loaded ${sessions.size} sessions.`);
  } catch (error) {
    console.error("[MEMORY] Loading failed:", error.message);
  }
}

function saveSessions() {
  try {
    const data = Object.fromEntries(sessions);

    const temporaryFile = SESSIONS_FILE + ".tmp";

    fs.writeFileSync(
      temporaryFile,
      JSON.stringify(data),
      "utf8"
    );

    fs.renameSync(temporaryFile, SESSIONS_FILE);

    return true;
  } catch (error) {
    console.error("[MEMORY] Saving failed:", error.message);
    return false;
  }
}

function getCookie(req, name) {
  const cookieHeader = req.headers.cookie || "";

  const cookies = cookieHeader.split(";");

  for (const cookie of cookies) {
    const separator = cookie.indexOf("=");

    if (separator === -1) continue;

    const key = cookie.slice(0, separator).trim();
    const value = cookie.slice(separator + 1).trim();

    if (key === name) {
      return decodeURIComponent(value);
    }
  }

  return null;
}

function getSessionId(req, res) {
  const suppliedId =
    req.body?.sessionId ||
    req.headers["x-session-id"] ||
    getCookie(req, "theuriq_sid");

  let sessionId = null;

  if (
    typeof suppliedId === "string" &&
    /^[a-f0-9]{48}$/.test(suppliedId)
  ) {
    sessionId = suppliedId;
  }

  if (!sessionId) {
    sessionId = crypto.randomBytes(24).toString("hex");
  }

  res.setHeader(
    "Set-Cookie",
    `theuriq_sid=${sessionId}; HttpOnly; SameSite=Lax; Path=/; Max-Age=2592000${
      process.env.NODE_ENV === "production" ? "; Secure" : ""
    }`
  );

  return sessionId;
}

function getSession(sessionId) {
  if (!sessions.has(sessionId)) {
    if (sessions.size >= MAX_SESSIONS) {
      let oldestId = null;
      let oldestTime = Infinity;

      for (const [id, session] of sessions.entries()) {
        const lastActive = session.stats?.lastActive || 0;

        if (lastActive < oldestTime) {
          oldestTime = lastActive;
          oldestId = id;
        }
      }

      if (oldestId) {
        sessions.delete(oldestId);
      }
    }

    sessions.set(sessionId, createSession());
  }

  const session = sessions.get(sessionId);

  if (!session.stats) {
    session.stats = {
      totalMessages: 0,
      totalCodeBlocks: 0,
      createdAt: Date.now(),
      lastActive: Date.now()
    };
  }

  if (!Array.isArray(session.history)) {
    session.history = [];
  }

  session.stats.lastActive = Date.now();

  return session;
}

loadSessions();

// Save session data periodically.
const saveInterval = setInterval(() => {
  saveSessions();
}, 30000);

if (typeof saveInterval.unref === "function") {
  saveInterval.unref();
}

// ==================================================
// REQUEST RATE LIMITING
// ==================================================

const rateLimits = new Map();

app.use("/api/chat", (req, res, next) => {
  const ip = req.ip || req.socket.remoteAddress || "unknown";
  const now = Date.now();

  const recentRequests = (rateLimits.get(ip) || []).filter(
    timestamp => now - timestamp < RATE_WINDOW
  );

  if (recentRequests.length >= RATE_LIMIT) {
    return res.status(429).json({
      ok: false,
      error: "Too many requests. Please wait one minute and try again."
    });
  }

  recentRequests.push(now);
  rateLimits.set(ip, recentRequests);

  next();
});

// Periodically remove old rate-limit entries.
const cleanupInterval = setInterval(() => {
  const now = Date.now();

  for (const [ip, timestamps] of rateLimits.entries()) {
    const recent = timestamps.filter(
      timestamp => now - timestamp < RATE_WINDOW
    );

    if (recent.length === 0) {
      rateLimits.delete(ip);
    } else {
      rateLimits.set(ip, recent);
    }
  }
}, 60000);

if (typeof cleanupInterval.unref === "function") {
  cleanupInterval.unref();
}

// ==================================================
// HEALTH AND DIAGNOSTICS
// ==================================================

app.get("/api/health", (req, res) => {
  res.set("Cache-Control", "no-store");

  res.json({
    ok: true,
    app: APP_NAME,
    version: APP_VERSION,
    status: "running",
    frontend: fs.existsSync(INDEX_FILE),
    orchestrator: typeof executeRequest === "function",
    sessions: sessions.size,
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString()
  });
});

app.get("/api/diagnostics", (req, res) => {
  let totalMessages = 0;

  for (const session of sessions.values()) {
    totalMessages += session.stats?.totalMessages || 0;
  }

  res.json({
    ok: true,
    app: APP_NAME,
    version: APP_VERSION,
    node: process.version,
    platform: process.platform,
    sessions: sessions.size,
    totalMessages,
    memory: process.memoryUsage(),
    uptime: Math.floor(process.uptime())
  });
});

app.get("/api", (req, res) => {
  res.json({
    ok: true,
    name: APP_NAME,
    version: APP_VERSION,
    description: "Personal AI Intelligence and Development Studio",
    endpoints: {
      health: "/api/health",
      diagnostics: "/api/diagnostics",
      chat: "/api/chat",
      session: "/api/session",
      history: "/api/history"
    }
  });
});

// ==================================================
// SESSION INFORMATION
// ==================================================

app.get("/api/session", (req, res) => {
  const sessionId = getSessionId(req, res);
  const session = getSession(sessionId);

  res.json({
    ok: true,
    sessionId,
    stats: session.stats,
    project: session.project,
    preferences: session.preferences
  });
});

app.get("/api/history", (req, res) => {
  const sessionId = getSessionId(req, res);
  const session = getSession(sessionId);

  res.json({
    ok: true,
    history: session.history,
    total: session.history.length
  });
});

app.delete("/api/session", (req, res) => {
  const sessionId = getSessionId(req, res);
  const session = getSession(sessionId);

  session.history = [];
  session.summary = "";

  saveSessions();

  res.json({
    ok: true,
    message: "Conversation history cleared."
  });
});

// ==================================================
// MAIN AI CHAT ENDPOINT
// ==================================================

app.post("/api/chat", async (req, res) => {
  try {
    const message = req.body?.message;

    if (typeof message !== "string" || !message.trim()) {
      return res.status(400).json({
        ok: false,
        error: "Please enter a message."
      });
    }

    if (message.length > MAX_MESSAGE_LENGTH) {
      return res.status(413).json({
        ok: false,
        error: "Your message is too long."
      });
    }

    const sessionId = getSessionId(req, res);
    const session = getSession(sessionId);

    const requestedModule = req.body?.module;

    const selectedModule = ALLOWED_MODULES.includes(requestedModule)
      ? requestedModule
      : undefined;

    const userMessage = message.trim();

    // Store the user's message.
    session.history.push({
      role: "user",
      content: userMessage,
      timestamp: Date.now()
    });

    session.stats.totalMessages += 1;

    // Keep history within the configured limit.
    if (session.history.length > MAX_HISTORY) {
      session.history = session.history.slice(-MAX_HISTORY);
    }

    // Save the latest project code and errors when detected.
    const codeBlocks = userMessage.match(/```[\s\S]*?```/g) || [];

    if (codeBlocks.length > 0) {
      session.stats.totalCodeBlocks += codeBlocks.length;
      session.project.lastCode = codeBlocks[codeBlocks.length - 1];
    }

    if (
      /error:|traceback|syntaxerror|typeerror|referenceerror|exception/i.test(
        userMessage
      )
    ) {
      session.project.lastError = userMessage.slice(0, 5000);
    }

    // Execute through the existing AI orchestrator.
    const result = await executeRequest(userMessage, {
      module: selectedModule,
      provider: req.body?.provider,
      model: req.body?.model
    });

    if (!result || typeof result.response !== "string") {
      throw new Error("The AI engine returned an invalid response.");
    }

    // Store the assistant's reply.
    session.history.push({
      role: "assistant",
      content: result.response,
      timestamp: Date.now()
    });

    if (session.history.length > MAX_HISTORY) {
      session.history = session.history.slice(-MAX_HISTORY);
    }

    session.stats.lastActive = Date.now();

    // Save immediately after a successful response.
    saveSessions();

    return res.json({
      ok: true,
      app: APP_NAME,
      version: APP_VERSION,
      sessionId,
      response: result.response,
      engine: result.engine,
      module: result.module,
      moduleName: result.moduleName,
      provider: result.provider,
      model: result.model,
      usage: result.usage
    });

  } catch (error) {
    console.error("[CHAT ERROR]", error);

    return res.status(500).json({
      ok: false,
      error: "THEURIQ-AI could not complete that request.",
      details:
        process.env.NODE_ENV === "development"
          ? error.message
          : undefined
    });
  }
});

// ==================================================
// FRONTEND ROUTE
// ==================================================

app.get("/", (req, res) => {
  if (!fs.existsSync(INDEX_FILE)) {
    return res.status(404).send(
      "THEURIQ-AI frontend index.html was not found."
    );
  }

  res.sendFile(INDEX_FILE);
});

// ==================================================
// API NOT FOUND
// ==================================================

app.use("/api", (req, res) => {
  res.status(404).json({
    ok: false,
    error: "API endpoint not found."
  });
});

// ==================================================
// GENERAL ERROR HANDLER
// ==================================================

app.use((error, req, res, next) => {
  console.error("[SERVER ERROR]", error);

  if (res.headersSent) {
    return next(error);
  }

  res.status(error.status || 500).json({
    ok: false,
    error:
      error.type === "entity.too.large"
        ? "Request body is too large."
        : "An internal server error occurred."
  });
});

// ==================================================
// START SERVER
// ==================================================

const server = app.listen(PORT, "0.0.0.0", () => {
  console.log("--------------------------------------");
  console.log(`${APP_NAME} v${APP_VERSION}`);
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(`Sessions loaded: ${sessions.size}`);
  console.log("--------------------------------------");
});

// ==================================================
// GRACEFUL SHUTDOWN
// ==================================================

function shutdown(signal) {
  console.log(`[SERVER] ${signal} received. Shutting down...`);

  clearInterval(saveInterval);
  clearInterval(cleanupInterval);

  saveSessions();

  server.close(() => {
    console.log("[SERVER] Shutdown complete.");
    process.exit(0);
  });

  setTimeout(() => {
    process.exit(1);
  }, 10000).unref();
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
