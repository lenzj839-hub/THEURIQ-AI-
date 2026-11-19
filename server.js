
"use strict";

require("dotenv").config();

const express = require("express");
const helmet = require("helmet");
const path = require("path");
const fs = require("fs");

const {
  executeRequest
} = require("./src/engine/orchestrator");

const app = express();
const PORT = process.env.PORT || 3000;

const PUBLIC_DIR = path.join(__dirname, "public");
const INDEX_FILE = path.join(PUBLIC_DIR, "index.html");

// ========================================
// SECURITY AND MIDDLEWARE
// ========================================

app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false
  })
);

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

// ========================================
// FRONTEND STATIC FILES
// ========================================

app.use(express.static(PUBLIC_DIR));

// ========================================
// HEALTH CHECKS
// ========================================

app.get("/api/health", (req, res) => {
  res.json({
    ok: true,
    app: "THEURIQ-AI",
    status: "running",
    intelligenceEngine: "initialized",
    frontend: fs.existsSync(INDEX_FILE),
    version: "1.0.0"
  });
});

app.get("/health", (req, res) => {
  res.json({
    ok: true,
    app: "THEURIQ-AI",
    status: "running",
    intelligenceEngine: "initialized",
    frontend: fs.existsSync(INDEX_FILE),
    version: "1.0.0"
  });
});

// ========================================
// API INFORMATION
// ========================================

app.get("/api", (req, res) => {
  res.json({
    name: "THEURIQ-AI",
    status: "online",
    intelligence: "THEURIQ Intelligence Engine",
    features: [
      "AI Assistant",
      "Developer Studio",
      "Research Studio",
      "Creator Studio",
      "Learning Studio",
      "Automation Studio",
      "Project Intelligence"
    ]
  });
});

// ========================================
// MAIN AI CHAT ENDPOINT
// ========================================

app.post("/api/chat", async (req, res) => {
  try {
    const {
      message,
      module,
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
        error: "Message is too long."
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

    if (
      module !== undefined &&
      !allowedModules.includes(module)
    ) {
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
      message,
      {
        module,
        provider,
        model
      }
    );

    return res.json(result);

  } catch (error) {
    console.error(
      "AI request failed:",
      error.message
    );

    return res.status(503).json({
      ok: false,
      error: "THEURIQ-AI could not complete this request.",
      details: error.message
    });
  }
});

// ========================================
// FRONTEND ROUTE
// ========================================

app.get("/", (req, res) => {
  if (!fs.existsSync(INDEX_FILE)) {
    return res.status(500).send(
      "Frontend file missing: public/index.html"
    );
  }

  res.sendFile(INDEX_FILE);
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
// ERROR HANDLER
// ========================================

app.use((err, req, res, next) => {
  console.error("Server error:", err);

  res.status(500).json({
    ok: false,
    error: "Internal server error."
  });
});

// ========================================
// START SERVER
// ========================================

app.listen(PORT, "0.0.0.0", () => {
  console.log(
    `THEURIQ-AI running on port ${PORT}`
  );

  console.log(
    `Frontend file: ${INDEX_FILE}`
  );

  console.log(
    `Frontend exists: ${fs.existsSync(INDEX_FILE)}`
  );
});
