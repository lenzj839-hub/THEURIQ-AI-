
"use strict";

// ========================================
// THEURIQ-AI FRONTEND ENGINE
// ========================================

const API_BASE = "/api";

const elements = {
  sidebar: document.getElementById("sidebar"),
  menuToggle: document.getElementById("menuToggle"),
  newChat: document.getElementById("newChat"),
  messageInput: document.getElementById("messageInput"),
  sendButton: document.getElementById("sendButton"),
  conversation: document.getElementById("conversation"),
  welcomeArea: document.querySelector(".welcome-area"),
  pageTitle: document.getElementById("pageTitle"),
  backendStatus: document.getElementById("backendStatus"),
  contentArea: document.getElementById("contentArea")
};

let messages = [];
let activePanel = "chat";

// ========================================
// NOTIFICATION
// ========================================

function notify(message) {
  let notification = document.getElementById("notification");

  if (!notification) {
    notification = document.createElement("div");
    notification.id = "notification";

    Object.assign(notification.style, {
      position: "fixed",
      bottom: "25px",
      left: "50%",
      transform: "translateX(-50%)",
      background: "#24213a",
      color: "#ffffff",
      border: "1px solid #51457f",
      padding: "12px 18px",
      borderRadius: "10px",
      zIndex: "9999",
      fontSize: "13px",
      maxWidth: "90%",
      textAlign: "center"
    });

    document.body.appendChild(notification);
  }

  notification.textContent = message;
  notification.hidden = false;

  clearTimeout(notify.timer);

  notify.timer = setTimeout(() => {
    notification.hidden = true;
  }, 3000);
}

// ========================================
// NAVIGATION
// ========================================

function navigate(panel) {
  activePanel = panel;

  const titles = {
    chat: "AI Assistant",
    projects: "My Projects",
    developer: "Developer Studio",
    research: "Research Studio",
    creator: "Creator Studio",
    automation: "Automation Studio",
    history: "Recent Activity",
    settings: "Settings"
  };

  elements.pageTitle.textContent = titles[panel] || "Workspace";

  document.querySelectorAll(".nav-item").forEach(button => {
    button.classList.toggle(
      "active",
      button.dataset.panel === panel
    );
  });

  if (panel === "chat") {
    elements.welcomeArea.hidden = messages.length > 0;
    elements.conversation.hidden = messages.length === 0;
  } else {
    elements.welcomeArea.hidden = true;
    elements.conversation.hidden = false;

    elements.conversation.innerHTML = "";

    const section = document.createElement("div");
    section.className = "message assistant";

    const heading = document.createElement("strong");
    heading.className = "message-role";
    heading.textContent = "THEURIQ-AI WORKSPACE";

    const description = document.createElement("p");
    description.textContent =
      panel === "developer"
        ? "Developer Studio will provide code generation, project analysis, debugging and an integrated editor."
        : `${titles[panel]} is part of the THEURIQ-AI ecosystem. This module will be implemented in an upcoming development phase.`;

    section.append(heading, description);
    elements.conversation.appendChild(section);
  }

  if (window.innerWidth <= 700) {
    elements.sidebar.classList.remove("open");
  }
}

document.querySelectorAll("[data-panel]").forEach(button => {
  button.addEventListener("click", () => {
    navigate(button.dataset.panel);
  });
});

// ========================================
// MOBILE SIDEBAR
// ========================================

elements.menuToggle.addEventListener("click", () => {
  elements.sidebar.classList.toggle("open");
});

// ========================================
// CONVERSATION
// ========================================

function addMessage(role, content) {
  const message = document.createElement("div");
  message.className = `message ${role}`;

  const label = document.createElement("span");
  label.className = "message-role";
  label.textContent =
    role === "user" ? "YOU" : "THEURIQ-AI";

  const body = document.createElement("div");
  body.textContent = content;

  message.append(label, body);
  elements.conversation.appendChild(message);

  elements.conversation.scrollTop =
    elements.conversation.scrollHeight;
}

// ========================================
// SEND MESSAGE
// ========================================

async function sendMessage() {
  const prompt = elements.messageInput.value.trim();

  if (!prompt) return;

  if (activePanel !== "chat") {
    navigate("chat");
  }

  messages.push({
    role: "user",
    content: prompt
  });

  elements.welcomeArea.hidden = true;
  elements.conversation.hidden = false;

  addMessage("user", prompt);

  elements.messageInput.value = "";
  elements.sendButton.disabled = true;

  try {
    const response = await fetch(`${API_BASE}/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        message: prompt
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Request failed");
    }

    const answer = data.reply || "No response received.";

    messages.push({
      role: "assistant",
      content: answer
    });

    addMessage("assistant", answer);

  } catch (error) {
    console.error("THEURIQ error:", error);

    addMessage(
      "assistant",
      "The AI service is not connected yet. Our backend and AI integration will be configured in the next development phases."
    );

  } finally {
    elements.sendButton.disabled = false;
    elements.messageInput.focus();
  }
}

elements.sendButton.addEventListener("click", sendMessage);

elements.messageInput.addEventListener("keydown", event => {
  if (
    event.key === "Enter" &&
    !event.shiftKey
  ) {
    event.preventDefault();
    sendMessage();
  }
});

// ========================================
// NEW CONVERSATION
// ========================================

elements.newChat.addEventListener("click", () => {
  messages = [];

  elements.conversation.innerHTML = "";
  elements.conversation.hidden = true;
  elements.welcomeArea.hidden = false;
  elements.messageInput.value = "";

  navigate("chat");
  notify("New conversation started.");
});

// ========================================
// QUICK PROMPTS
// ========================================

document.querySelectorAll("[data-prompt]").forEach(button => {
  button.addEventListener("click", () => {
    navigate("chat");
    elements.messageInput.value = button.dataset.prompt;
    elements.messageInput.focus();
  });
});

// ========================================
// ATTACHMENT PLACEHOLDER
// ========================================

document.getElementById("attachButton").addEventListener(
  "click",
  () => {
    notify("File attachments will be available in a future update.");
  }
);

// ========================================
// SETTINGS BUTTON
// ========================================

document.getElementById("settingsButton").addEventListener(
  "click",
  () => navigate("settings")
);

// ========================================
// BACKEND HEALTH CHECK
// ========================================

async function checkBackend() {
  try {
    const response = await fetch(`${API_BASE}/health`);
    const data = await response.json();

    if (!response.ok || !data.ok) {
      throw new Error("Backend unavailable");
    }

    elements.backendStatus.textContent = "Online";
    elements.backendStatus.style.color = "#40d69b";

  } catch (error) {
    elements.backendStatus.textContent = "Offline";
    elements.backendStatus.style.color = "#ff7474";

    console.error("Backend health check failed:", error);
  }
}

// ========================================
// INITIALIZE
// ========================================

async function initialize() {
  await checkBackend();

  console.log("THEURIQ-AI frontend initialized.");
}

initialize();
