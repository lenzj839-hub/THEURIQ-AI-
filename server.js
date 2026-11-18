
require("dotenv").config();

const express = require("express");
const helmet = require("helmet");
const path = require("path");

const {
  executeRequest
} = require("./src/engine/orchestrator");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet());
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, "public")));

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    ok: true,
    app: "THEURIQ-AI",
    status: "running",
    intelligenceEngine: "initialized",
    version: "1.0.0"
  });
});

// API information
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

// Main AI chat endpoint
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

    if (
      module !== undefined &&
      ![
        "chat",
        "developer",
        "research",
        "creator",
        "learning",
        "automation"
      ].includes(module)
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
      { module, provider, model }
    );

    res.json(result);

  } catch (error) {
    console.error("AI request failed:", error.message);

    res.status(503).json({
      ok: false,
      error: "THEURIQ-AI could not complete this request.",
      details: error.message
    });
  }
});

// Frontend
app.get("/", (req, res) => {
  res.sendFile(
    path.join(__dirname, "public", "index.html")
  );
});

// Unknown API endpoint
app.use("/api", (req, res) => {
  res.status(404).json({
    ok: false,
    error: "API endpoint not found."
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error("Server error:", err.message);

  res.status(500).json({
    ok: false,
    error: "Internal server error."
  });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(
    `THEURIQ-AI running on port ${PORT}`
  );
});
