"use strict";
require("dotenv").config();
const express = require("express");
const helmet = require("helmet");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");

const { executeRequest } = require("./src/engine/orchestrator");

const app = express();
const PORT = process.env.PORT || 3000;
const ROOT_DIR = __dirname;
const PUBLIC_DIR = path.join(ROOT_DIR, "public");
const DATA_DIR = path.join(ROOT_DIR, "data");
const SESSIONS_FILE = path.join(DATA_DIR, "sessions.json");
const INDEX_FILE = path.join(PUBLIC_DIR, "index.html");
const APP_VERSION = "3.0.0 - ULTRA 10000X";

// ========================================
// SETUP DATA FOLDER
// ========================================
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

// ========================================
// ULTRA MEMORY - PERSISTENT, NEVER FORGETS
// ========================================
let sessions = new Map();
const MAX_HISTORY = 40;
const MAX_SESSIONS = 1000;
const MAX_CODE_LENGTH = 15000;

// Load from disk on start
function loadSessions() {
  try {
    if (fs.existsSync(SESSIONS_FILE)) {
      const raw = JSON.parse(fs.readFileSync(SESSIONS_FILE, "utf8"));
      for (const [k, v] of Object.entries(raw)) sessions.set(k, v);
      console.log(`[MEMORY] Loaded ${sessions.size} sessions from disk`);
    }
  } catch (e) { console.warn("[MEMORY] Could not load sessions:", e.message); }
}
function saveSessions() {
  try {
    const obj = {};
    for (const [k, v] of sessions.entries()) obj[k] = v;
    fs.writeFileSync(SESSIONS_FILE, JSON.stringify(obj, null, 2));
  } catch (e) { console.warn("Save failed:", e.message); }
}
loadSessions();
setInterval(saveSessions, 30000); // Auto-save every 30s
process.on("SIGINT", () => { saveSessions(); process.exit(0); });

function getSession(sessionId) {
  if (!sessions.has(sessionId)) {
    if (sessions.size >= MAX_SESSIONS) {
      const first = sessions.keys().next().value;
      sessions.delete(first);
    }
    sessions.set(sessionId, {
      history: [],
      summary: "",
      project: {
        name: "",
        language: "Python",
        goal: "Learn coding from zero, build real apps",
        files: {}, // { "app.py": "code..." }
        lastCode: "",
        lastError: "",
        level: "beginner",
        lessonsCompleted: [],
        streak: 0
      },
      stats: { totalMessages: 0, totalCodeBlocks: 0, lastActive: Date.now(), createdAt: Date.now() },
      preferences: { languageStyle: "simple english + sheng", wantsFullCode: true }
    });
  }
  const s = sessions.get(sessionId);
  s.stats.lastActive = Date.now();
  return s;
}

// ========================================
// SMART DETECTORS - MAKES IT ACCURATE
// ========================================
function detectLanguage(text) {
  const t = text.toLowerCase();
  if (text.includes("def ") && text.includes("print(")) return "Python";
  if (text.includes("console.log") || text.includes("function ") && text.includes("{")) return "JavaScript";
  if (text.includes("<html") || text.includes("<div")) return "HTML/CSS/JS";
  if (text.includes("public class") || text.includes("System.out")) return "Java";
  if (text.includes("#include") || text.includes("int main")) return "C++";
  if (text.includes("SELECT") && text.includes("FROM")) return "SQL";
  if (t.includes("python")) return "Python";
  if (t.includes("javascript") || t.includes("js")) return "JavaScript";
  if (t.includes("html")) return "HTML";
  return null;
}
function detectError(text) {
  const errors = ["Traceback", "Error:", "TypeError", "SyntaxError", "ReferenceError", "NameError", "Cannot read", "is not defined", "failed", "Exception", "at line"];
  return errors.some(e => text.includes(e));
}
function extractCodeBlocks(text) {
  const blocks = [];
  const re = /```(?:\w+)?\n([\s\S]*?)```/g;
  let m;
  while ((m = re.exec(text)) !== null) blocks.push(m[1]);
  return blocks;
}
function isContinue(text) {
  const t = text.trim().toLowerCase();
  return ["continue", "continue...", "continue pls", "go on", "endelea", "continue bro", "next"].includes(t);
}
function summarizeHistory(history) {
  if (history.length < 10) return "";
  const last = history.slice(-6).map(h => `${h.role}: ${h.content.slice(0, 200)}`).join("\n");
  return `[SUMMARY OF EARLIER CHAT - DON'T FORGET]\nUser is learning coding from zero in Kenya. Project in progress. Recent context:\n${last}\n[END SUMMARY]\n`;
}

// ========================================
// THE BRAIN v3 - 10000X PROMPTS
// ========================================
const BASE_IDENTITY = `You are THEURIQ-AI v3 ULTRA, the most powerful, accurate, tireless coding teacher in the world.
You were built for ONE user: a beginner in Kenya, Mwingi, learning coding from ZERO, who wants to build real apps.
You NEVER get tired. You NEVER say "I can't". You NEVER give up on the user.
You NEVER ask "what is your skill level?" - You KNOW: level = 0, beginner, needs simple English.
You NEVER give 10 options. You pick the BEST ONE and commit to it.
If you don't know something, you say "I don't know, let me think..." and then give the closest correct answer. NEVER invent fake functions, fake libraries, fake prices, fake dates.
You speak like a smart Kenyan big brother: simple English, a little Sheng, encouraging, direct. No corporate English. No "As an AI language model".
You remember EVERYTHING: project name, language, last code, last error.`;

const SYSTEM_PROMPTS = {
  chat: BASE_IDENTITY + `
MODE: CHAT / GENERAL
RULES:
1. Answer in max 8 short lines unless user asks for long.
2. Always end with: "Your next step is: [ONE task]"
3. If user is confused, simplify, don't add more theory.
4. Use Kenya examples: M-Pesa, mama mboga, boda, school, church.
5. Never ask more than 1 question.`,

  developer: BASE_IDENTITY + `
MODE: DEVELOPER - TIRELESS CODING PARTNER - THIS IS YOUR MAIN MODE
ULTRA RULES - YOU MUST OBEY 100%:
1. If user says "I don't know", YOU CHOOSE the project. Example: "Let's build a Calculator in Python. Here is Lesson 1."
2. ALWAYS give FULL WORKING CODE that runs as-is. No pseudocode. No "...rest of code". No "TODO: implement".
3. After code, explain in EXACTLY 3 bullet points what the code does. Simple words.
4. If user pastes an ERROR: Step 1: Say in 1 line what broke. Step 2: Give FULL FIXED CODE. Step 3: Say "Copy this, run again".
5. If code is long (>80 lines): Split into Part 1, Part 2. End Part 1 with "Type CONTINUE". When user says CONTINUE, continue EXACTLY where you stopped, don't repeat.
6. Use clean code: good variable names, comments in simple English.
7. NEVER suggest 10 languages. Stay on user's language. If project is Python, stay Python.
8. If user asks "make it more powerful", ADD features: save to file, validation, better UI, error handling. Don't just say "I made it powerful".
9. ALWAYS test mentally: Does this code run? If not, fix it before sending.
10. For web apps: Give 3 files separately: index.html, style.css, script.js. All complete.
11. For Python: Give 1 file, complete, with if __name__ == "__main__".
12. Accuracy: Never invent a library. If you use "requests", "flask", "express", they must be real.`,

  learning: BASE_IDENTITY + `
MODE: LEARNING / TEACHER
RULES:
1. Teach ONE concept per message. Not 10.
2. Format: [Lesson X: Title] -> [What it is in 2 lines] -> [Example Code] -> [Your Exercise] -> [Quiz: 1 question]
3. If user gets it wrong, don't shame. Say "Nice try, here's the fix" and explain.
4. Track progress: "You have finished 3/10 lessons in Python Basics".
5. Never jump to advanced if basics not done.`,

  research: BASE_IDENTITY + `
MODE: RESEARCH - ACCURACY IS EVERYTHING
RULES:
1. If you are <95% sure, say "I'm not 100% sure, but..."
2. For Kenya topics (KCSE, M-Pesa, Safaricom, KPLC), use Kenya context and Kenya prices in KES.
3. Separate FACT vs OPINION. Say "Fact:" and "My opinion:".
4. Don't hallucinate links. If you don't have a real link, don't give a fake one.
5. Give sources if you know them, otherwise say "from my knowledge".`,

  creator: BASE_IDENTITY + `
MODE: CREATOR
RULES: Give 1 BEST idea, fully developed, not 10 shallow ideas. Give name, how it works, who it helps, how to build it in 3 steps. Be specific to Kenya.`,

  automation: BASE_IDENTITY + `
MODE: AUTOMATION
RULES: Give full commands that work on Windows + Linux. Warn if command deletes files. Give full script, not steps only. Test mentally before sending.`
};

// ========================================
// EXPRESS SETUP
// ========================================
if (typeof executeRequest !== "function") throw new Error("Orchestrator not configured");
app.disable("x-powered-by");
app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));
app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true, limit: "5mb" }));
app.use(express.static(PUBLIC_DIR, { index: false, etag: true, maxAge: "1h" }));

// Rate limit
const rateMap = new Map();
app.use("/api/chat", (req, res, next) => {
  const ip = req.ip || "unknown";
  const now = Date.now();
  const arr = (rateMap.get(ip) || []).filter(t => now - t < 60000);
  if (arr.length > 40) return res.status(429).json({ ok: false, error: "Pole bro, umetuma sana. Ngoja 1 min." });
  arr.push(now); rateMap.set(ip, arr); next();
});

app.get("/api/health", (req, res) => {
  res.set("Cache-Control", "no-store");
  res.json({ ok: true, app: "THEURIQ-AI", version: APP_VERSION, status: "running ULTRA", frontend: fs.existsSync(INDEX_FILE), sessions: sessions.size, uptime: Math.floor(process.uptime()), timestamp: new Date().toISOString() });
});
app.get("/api/diagnostics", (req, res) => {
  res.json({ ok: true, version: APP_VERSION, node: process.version, sessions: sessions.size, totalMessages: [...sessions.values()].reduce((a, s) => a + s.stats.totalMessages, 0), memory: process.memoryUsage() });
});
app.get("/api", (req, res) => {
  res.json({ ok: true, name: "THEURIQ-AI", version: APP_VERSION, description: "Tireless Coding Partner - 10000x Powerful", endpoints: { health: "/
