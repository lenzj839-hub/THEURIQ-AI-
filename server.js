
"use strict";

require("dotenv").config();

const express = require("express");
const helmet = require("helmet");
const path = require("path");
const fs = require("fs");

const { executeRequest } = require("./src/engine/orchestrator");

const app = express();
const PORT = process.env.PORT || 3000;

const ROOT_DIR = __dirname;
const PUBLIC_DIR = path.join(ROOT_DIR, "public");
const INDEX_FILE = path.join(PUBLIC_DIR, "index.html");

const APP_VERSION = "1.1.0";

// ========================================
// STARTUP VALIDATION
// ========================================

if (typeof executeRequest !== "function") {
  throw new Error("AI orchestrator is not configured correctly.");
}

// ========================================
// SECURITY
// ========================================

app.disable("x-powered-by");

app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false
  })
);

// ========================================
// REQUEST MIDDLEWARE
// ========================================

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({
  extended: true,
  limit: "1mb"
}));

// ========================================
// FRONTEND STATIC FILES
// ========================================

app.use(
  express.static(PUBLIC_DIR, {
    index: false,
    etag: true,
    maxAge: "1h"
  })
);

// ========================================
// HEALTH CHECK
// ========================================

app.get("/api/health", (req, res) => {
  res.set("Cache-Control", "no-store");

  res.status(200).json({
    ok: true,
    app: "THEURIQ-AI",
    status: "running",
    version: APP_VERSION,
    frontend: fs.existsSync(INDEX_FILE),
    aiEngine: "initialized",
    timestamp: new Date().toISOString()
  });
});

app.get("/health", (req, res) => {
  res.redirect(307, "/api/health");
});

// ========================================
// DIAGNOSTICS
// ========================================

app.get("/api/diagnostics", (req, res) => {
  res.set("Cache-Control", "no-store");

  res.json({
    ok: true,
    app: "THEURIQ-AI",
    version: APP_VERSION,
    nodeVersion: process.version,
    environment: process.env.NODE_ENV || "development",
    frontendExists: fs.existsSync(INDEX_FILE),
    orchestratorLoaded: typeof executeRequest === "function",
    uptimeSeconds: Math.floor(process.uptime())
  });
});

// ========================================
// API INFORMATION
// ========================================

app.get("/api", (req, res) => {
  res.json({
    ok: true,
    name: "THEURIQ-AI",
    description: "Personal Intelligence Studio",
    version: APP_VERSION,
    endpoints: {
      health: "/api/health",
      diagnostics: "/api/diagnostics",
      chat: "POST /api/chat"
    },
    modules: [
      "chat",
      "developer",
      "research",
      "creator",
      "learning",
      "automation"
    ]
  });
});

// ========================================
// AI CHAT
// ========================================

app.post("/api/chat", async (req, res) => {
  try {
    const {
      message,
      module = "chat",
      provider,
      model
    } = req.body || {};

    if (
      typeof message !== "string" ||
      !message.trim()
    ) {
      return res.status(400).json({
        ok: false,
        error: "Please provide a valid message."
      });
    }

    if (message.length > 20000) {
      return res.status(413).json({
        ok: false,
        error: "Message exceeds the 20,000 character limit."
      });
    }

    const allowedModules = [
      "chat",
      "developer",
      "research",
      "creator",
      "learning",
      "automation"
    ];

    if (!allowedModules.includes(module)) {
      return res.status(400).json({
        ok: false,
        error: "Invalid engine module."
      });
    }

    if (
      provider !== undefined &&
      !["groq", "openai"].includes(provider)
    ) {
      return res.status(400).json({
        ok: false,
        error: "Unsupported AI provider."
      });
    }

    const result = await executeRequest(
      message.trim(),
      {
        module,
        provider,
        model
      }
    );

    return res.status(200).json(result);

  } catch (error) {
    console.error("AI CHAT ERROR:", error);

    return res.status(503).json({
      ok: false,
      error: "THEURIQ-AI could not complete your request.",
      details: error.message
    });
  }
});

// ========================================
// FRONTEND
// ========================================

app.get("/", (req, res) => {
  res.set("Cache-Control", "no-store");

  if (!fs.existsSync(INDEX_FILE)) {
    return res.status(500).send(
      "THEURIQ-AI frontend missing: public/index.html"
    );
  }

  return res.sendFile(INDEX_FILE);
});

// ========================================
// UNKNOWN API ROUTES
// ========================================

app.use("/api", (req, res) => {
  res.status(404).json({
    ok: false,
    error: "API endpoint not found."
  });
});

// ========================================
// UNKNOWN PAGE ROUTES
// ========================================

app.use((req, res) => {
  res.status(404).send("Page not found.");
});

// ========================================
// ERROR HANDLER
// ========================================

app.use((err, req, res, next) => {
  console.error("SERVER ERROR:", err);

  if (res.headersSent) {
    return next(err);
  }

  res.status(err.status || 500).json({
    ok: false,
    error: "Internal server error."
  });
});

// ========================================
// START SERVER
// ========================================

app.listen(PORT, "0.0.0.0", () => {
  console.log("--------------------------------");
  console.log("THEURIQ-AI STARTED");
  console.log("--------------------------------");
  console.log("Port:", PORT);
  console.log("Version:", APP_VERSION);
  console.log("Node:", process.version);
  console.log("Root:", ROOT_DIR);
  console.log("Frontend:", INDEX_FILE);
  console.log("Frontend exists:", fs.existsSync(INDEX_FILE));
  console.log("AI engine: loaded");
  console.log("--------------------------------");
});
