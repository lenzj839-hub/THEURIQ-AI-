
"use strict";

// ================================================
// THEURIQ-AI — COMPLETE FRONTEND JAVASCRIPT
// ================================================

document.addEventListener("DOMContentLoaded", () => {

  // ==============================================
  // CONFIGURATION
  // ==============================================

  const API_BASE = "/api";

  const elements = {
    messageInput: document.getElementById("messageInput"),
    sendButton: document.getElementById("sendButton"),
    attachButton: document.getElementById("attachButton"),
    welcomeArea: document.getElementById("welcomeArea"),
    conversation: document.getElementById("conversation"),
    notification: document.getElementById("notification"),
    menuToggle: document.getElementById("menuToggle")
  };

  let messages = [];
  let isSending = false;

  // ==============================================
  // NOTIFICATIONS
  // ==============================================

  function showToast(message) {

    if (!elements.notification) {
      console.log(message);
      return;
    }

    elements.notification.textContent = message;
    elements.notification.hidden = false;

    clearTimeout(showToast.timer);

    showToast.timer = setTimeout(() => {
      elements.notification.hidden = true;
    }, 3000);
  }

  // ==============================================
  // SCREEN MANAGEMENT
  // ==============================================

  function showWelcome() {

    if (elements.welcomeArea) {
      elements.welcomeArea.style.display = "block";
      elements.welcomeArea.hidden = false;
    }

    if (elements.conversation) {
      elements.conversation.style.display = "none";
      elements.conversation.hidden = true;
    }
  }

  function showConversation() {

    if (elements.welcomeArea) {
      elements.welcomeArea.style.display = "none";
      elements.welcomeArea.hidden = true;
    }

    if (elements.conversation) {
      elements.conversation.style.display = "flex";
      elements.conversation.hidden = false;
    }
  }

  // ==============================================
  // MESSAGE DISPLAY
  // ==============================================

  function addMessage(content, role = "user") {

    if (!elements.conversation) return null;

    showConversation();

    const message = document.createElement("div");

    message.className =
      role === "user" ? "message user" : "message assistant";

    const label = document.createElement("span");

    label.className = "message-role";

    label.textContent =
      role === "user" ? "YOU" : "THEURIQ-AI";

    const body = document.createElement("div");

    body.className = "message-content";
    body.textContent = content;

    message.append(label, body);

    elements.conversation.appendChild(message);

    window.scrollTo({
      top: document.body.scrollHeight,
      behavior: "smooth"
    });

    return body;
  }

  // ==============================================
  // API RESPONSE HANDLING
  // ==============================================

  async function readResponse(response) {

    const raw = await response.text();

    let data = {};

    try {
      data = raw ? JSON.parse(raw) : {};
    } catch {
      throw new Error(
        "The server returned an invalid response. Check your backend."
      );
    }

    if (!response.ok) {

      throw new Error(
        data.error ||
        data.message ||
        `Server error: ${response.status}`
      );
    }

    return data;
  }

  // ==============================================
  // SEND MESSAGE TO REAL AI BACKEND
  // ==============================================

  async function sendMessage() {

    if (!elements.messageInput || isSending) return;

    const prompt = elements.messageInput.value.trim();

    if (!prompt) {
      showToast("Please enter a message first.");
      return;
    }

    messages.push({
      role: "user",
      content: prompt
    });

    addMessage(prompt, "user");

    elements.messageInput.value = "";
    elements.messageInput.style.height = "auto";

    isSending = true;

    if (elements.sendButton) {
      elements.sendButton.disabled = true;
      elements.sendButton.textContent = "...";
    }

    const thinking = addMessage(
      "THEURIQ-AI is thinking...",
      "assistant"
    );

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

      const data = await readResponse(response);

      const answer =
        data.reply ||
        data.message ||
        data.response;

      if (!answer) {
        throw new Error("The AI returned an empty response.");
      }

      if (thinking) {
        thinking.textContent = answer;
      }

      messages.push({
        role: "assistant",
        content: answer
      });

    } catch (error) {

      console.error("THEURIQ-AI error:", error);

      const errorMessage =
        "I couldn't complete your request. " +
        error.message;

      if (thinking) {
        thinking.textContent = errorMessage;
      }

      messages.push({
        role: "assistant",
        content: errorMessage
      });

      showToast("AI request failed. Check your connection.");

    } finally {

      isSending = false;

      if (elements.sendButton) {
        elements.sendButton.disabled = false;
        elements.sendButton.textContent = "↑";
      }

      if (elements.messageInput) {
        elements.messageInput.focus();
      }

    }
  }

  // ==============================================
  // SEND BUTTON
  // ==============================================

  if (elements.sendButton) {

    elements.sendButton.addEventListener(
      "click",
      sendMessage
    );

  }

  // ==============================================
  // ENTER TO SEND
  // ==============================================

  if (elements.messageInput) {

    elements.messageInput.addEventListener(
      "keydown",
      event => {

        if (
          event.key === "Enter" &&
          !event.shiftKey
        ) {

          event.preventDefault();
          sendMessage();

        }

      }
    );

    // Automatically expand textarea

    elements.messageInput.addEventListener(
      "input",
      () => {

        elements.messageInput.style.height = "auto";

        elements.messageInput.style.height =
          elements.messageInput.scrollHeight + "px";

      }
    );

  }

  // ==============================================
  // EXPLORE SHORTCUTS
  // ==============================================

  document.querySelectorAll(".capability-card").forEach(card => {

    card.addEventListener("click", () => {

      const prompt = card.getAttribute("data-prompt");

      if (!prompt || !elements.messageInput) return;

      showWelcome();

      elements.messageInput.value = prompt;
      elements.messageInput.focus();

      showToast("Your prompt is ready. Press send.");

    });

  });

  // ==============================================
  // FILE ATTACHMENT SELECTION
  // ==============================================

  const fileInput = document.createElement("input");

  fileInput.type = "file";
  fileInput.accept = "image/*,.pdf,.txt,.doc,.docx";
  fileInput.hidden = true;

  document.body.appendChild(fileInput);

  if (elements.attachButton) {

    elements.attachButton.addEventListener("click", () => {
      fileInput.click();
    });

  }

  fileInput.addEventListener("change", () => {

    const file = fileInput.files[0];

    if (!file) return;

    showToast(
      `Selected: ${file.name}. Upload processing is not implemented yet.`
    );

    fileInput.value = "";

  });

  // ==============================================
  // BOTTOM NAVIGATION
  // ==============================================

  function navigate(panel) {

    document.querySelectorAll(".bottom-nav-item").forEach(button => {

      button.classList.toggle(
        "active",
        button.dataset.panel === panel
      );

    });

    switch (panel) {

      case "chat":

        if (messages.length === 0) {
          showWelcome();
        } else {
          showConversation();
        }

        break;

      case "projects":

        showToast("My Projects is coming in a future update.");
        break;

      case "history":

        showToast("Conversation history is not implemented yet.");
        break;

      case "settings":

        showToast("Settings is coming in a future update.");
        break;

      default:

        showToast("This section is not available yet.");

    }
  }

  document.querySelectorAll(".bottom-nav-item").forEach(button => {

    button.addEventListener("click", () => {

      navigate(button.dataset.panel);

    });

  });

  // ==============================================
  // HAMBURGER MENU
  // ==============================================

  const menu = document.createElement("div");

  menu.id = "theuriqMenu";

  menu.style.cssText = `
    position:fixed;
    top:75px;
    right:16px;
    width:230px;
    padding:12px;
    background:#191824;
    border:1px solid rgba(255,255,255,.12);
    border-radius:16px;
    box-shadow:0 15px 40px rgba(0,0,0,.5);
    z-index:99999;
    display:none;
  `;

  const menuItems = [
    ["＋", "New conversation", "new"],
    ["◈", "AI Assistant", "chat"],
    ["▣", "My Projects", "projects"],
    ["◷", "Recent History", "history"],
    ["⚙", "Settings", "settings"]
  ];

  menuItems.forEach(([icon, title, action]) => {

    const button = document.createElement("button");

    button.type = "button";
    button.textContent = `${icon}   ${title}`;

    button.style.cssText = `
      display:block;
      width:100%;
      padding:14px;
      margin:3px 0;
      background:transparent;
      color:white;
      border:0;
      border-radius:9px;
      text-align:left;
      font-size:14px;
      cursor:pointer;
    `;

    button.addEventListener("click", () => {

      menu.style.display = "none";

      if (action === "new") {
        startNewConversation();
      } else {
        navigate(action);
      }

    });

    menu.appendChild(button);

  });

  document.body.appendChild(menu);

  if (elements.menuToggle) {

    elements.menuToggle.addEventListener("click", event => {

      event.stopPropagation();

      menu.style.display =
        menu.style.display === "none" ? "block" : "none";

    });

  }

  document.addEventListener("click", event => {

    if (
      !menu.contains(event.target) &&
      !event.target.closest("#menuToggle")
    ) {

      menu.style.display = "none";

    }

  });

  // ==============================================
  // NEW CONVERSATION
  // ==============================================

  function startNewConversation() {

    if (isSending) {
      showToast("Please wait for the current response.");
      return;
    }

    messages = [];

    if (elements.conversation) {
      elements.conversation.replaceChildren();
    }

    showWelcome();

    if (elements.messageInput) {
      elements.messageInput.value = "";
    }

    document.querySelectorAll(".bottom-nav-item").forEach(button => {

      button.classList.toggle(
        "active",
        button.dataset.panel === "chat"
      );

    });

    showToast("New conversation started.");

  }

  // ==============================================
  // BACKEND CONNECTION CHECK
  // ==============================================

  async function checkBackend() {

    try {

      const response = await fetch(`${API_BASE}/health`);

      const data = await readResponse(response);

      console.log(
        "THEURIQ-AI backend:",
        data.ok ? "Online" : "Not confirmed"
      );

    } catch (error) {

      console.error(
        "Backend connection check failed:",
        error
      );

    }

  }

  // ==============================================
  // INITIALIZE
  // ==============================================

  showWelcome();

  checkBackend();

  console.log("THEURIQ-AI initialized successfully.");

});
