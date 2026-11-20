
"use strict";

// ================================================
// THEURIQ-AI — FRONTEND ENGINE
// ================================================

document.addEventListener("DOMContentLoaded", () => {

  const API_BASE = "/api";

  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => document.querySelectorAll(selector);

  const elements = {
    messageInput: $("#messageInput"),
    sendButton: $("#sendButton"),
    attachButton: $("#attachButton"),
    welcomeArea: $("#welcomeArea"),
    conversation: $("#conversation"),
    notification: $("#notification"),
    menuToggle: $("#menuToggle"),
    menuOverlay: $("#menuOverlay"),
    otherPanel: $("#otherPanel")
  };

  let messages = [];
  let isSending = false;
  let activePanel = "chat";

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
      elements.welcomeArea.hidden = false;
      elements.welcomeArea.style.display = "";
    }

    if (elements.conversation) {
      elements.conversation.hidden = true;
      elements.conversation.style.display = "none";
    }
  }

  function showConversation() {
    if (elements.welcomeArea) {
      elements.welcomeArea.hidden = true;
      elements.welcomeArea.style.display = "none";
    }

    if (elements.conversation) {
      elements.conversation.hidden = false;
      elements.conversation.style.display = "flex";
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

    message.scrollIntoView({
      behavior: "smooth",
      block: "end"
    });

    return body;
  }

  // ==============================================
  // SERVER RESPONSE
  // ==============================================

  async function readResponse(response) {
    const raw = await response.text();

    let data;

    try {
      data = raw ? JSON.parse(raw) : {};
    } catch {
      throw new Error(
        "Invalid server response. Check your backend."
      );
    }

    if (!response.ok) {
      throw new Error(
        data.error ||
        data.message ||
        `Server error ${response.status}`
      );
    }

    return data;
  }

  // ==============================================
  // AI CHAT
  // ==============================================

  async function sendMessage() {
    if (!elements.messageInput || isSending) return;

    const prompt = elements.messageInput.value.trim();

    if (!prompt) {
      showToast("Enter a message first.");
      return;
    }

    if (!elements.conversation) {
      showToast("Chat interface is missing.");
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
        data.response ||
        data.reply ||
        data.message ||
        data.text ||
        data.answer;

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
      console.error("THEURIQ-AI:", error);

      const message =
        "I couldn't complete your request. " +
        error.message;

      if (thinking) {
        thinking.textContent = message;
      }

      messages.push({
        role: "assistant",
        content: message
      });

      showToast("AI request failed.");
    } finally {
      isSending = false;

      if (elements.sendButton) {
        elements.sendButton.disabled = false;
        elements.sendButton.textContent = "↑";
      }

      elements.messageInput.focus();
    }
  }

  // ==============================================
  // INPUT EVENTS
  // ==============================================

  if (elements.sendButton) {
    elements.sendButton.addEventListener(
      "click",
      sendMessage
    );
  }

  if (elements.messageInput) {
    elements.messageInput.addEventListener(
      "keydown",
      (event) => {
        if (
          event.key === "Enter" &&
          !event.shiftKey
        ) {
          event.preventDefault();
          sendMessage();
        }
      }
    );

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
  // NEW CONVERSATION
  // ==============================================

  function startNewConversation() {
    if (isSending) {
      showToast("Wait for the current response.");
      return;
    }

    messages = [];

    if (elements.conversation) {
      elements.conversation.replaceChildren();
    }

    if (elements.messageInput) {
      elements.messageInput.value = "";
    }

    showWelcome();
    navigate("chat");

    showToast("New conversation started.");
  }

  // ==============================================
  // NAVIGATION PANELS
  // ==============================================

  function navigate(panel) {
    activePanel = panel;

    $$(".bottom-nav-item").forEach((button) => {
      button.classList.toggle(
        "active",
        button.dataset.panel === panel
      );
    });

    if (panel === "chat") {
      if (elements.otherPanel) {
        elements.otherPanel.hidden = true;
      }

      if (messages.length === 0) {
        showWelcome();
      } else {
        showConversation();
      }

      return;
    }

    if (elements.welcomeArea) {
      elements.welcomeArea.hidden = true;
      elements.welcomeArea.style.display = "none";
    }

    if (elements.conversation) {
      elements.conversation.hidden = true;
      elements.conversation.style.display = "none";
    }

    const titles = {
      projects: "My Projects",
      history: "Recent History",
      settings: "Settings"
    };

    const descriptions = {
      projects: "Your workspace for creating and managing projects.",
      history: "Your recent conversations will appear here.",
      settings: "Manage your THEURIQ-AI preferences."
    };

    if (elements.otherPanel) {
      elements.otherPanel.hidden = false;
      elements.otherPanel.style.display = "block";

      elements.otherPanel.replaceChildren();

      const heading = document.createElement("h2");
      heading.textContent = titles[panel] || "Workspace";

      const description = document.createElement("p");
      description.textContent =
        descriptions[panel] || "This section is unavailable.";

      elements.otherPanel.append(heading, description);
    } else {
      showToast(
        `${titles[panel] || "Section"} panel is unavailable in this HTML.`
      );
    }
  }

  $$(".bottom-nav-item").forEach((button) => {
    button.addEventListener("click", () => {
      navigate(button.dataset.panel);
    });
  });

  // ==============================================
  // CAPABILITY CARDS
  // ==============================================

  $$(".capability-card").forEach((card) => {
    card.addEventListener("click", () => {
      const prompt = card.dataset.prompt;

      if (!prompt || !elements.messageInput) return;

      navigate("chat");

      elements.messageInput.value = prompt;
      elements.messageInput.focus();

      showToast("Prompt ready. Press send.");
    });
  });

  // ==============================================
  // FILE ATTACHMENTS
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
      `Selected: ${file.name}. File processing is not connected yet.`
    );

    fileInput.value = "";
  });

  // ==============================================
  // HAMBURGER MENU
  // ==============================================

  if (elements.menuToggle) {
    elements.menuToggle.addEventListener("click", () => {
      if (elements.menuOverlay) {
        elements.menuOverlay.classList.toggle("active");
        elements.menuOverlay.hidden =
          !elements.menuOverlay.hidden;
      } else {
        showToast("Menu overlay is missing from the HTML.");
      }
    });
  }

  if (elements.menuOverlay) {
    elements.menuOverlay.addEventListener("click", (event) => {
      if (
        event.target === elements.menuOverlay ||
        event.target.closest("[data-close-menu]")
      ) {
        elements.menuOverlay.classList.remove("active");
        elements.menuOverlay.hidden = true;
      }

      const item = event.target.closest("[data-panel]");

      if (item) {
        navigate(item.dataset.panel);
        elements.menuOverlay.classList.remove("active");
        elements.menuOverlay.hidden = true;
      }
    });
  }

  // ==============================================
  // BACKEND CONNECTION
  // ==============================================

  async function checkBackend() {
    try {
      const response = await fetch(`${API_BASE}/health`);
      const data = await readResponse(response);

      console.log(
        "THEURIQ-AI backend:",
        data.ok ? "Online" : "Response received"
      );
    } catch (error) {
      console.error("Backend connection failed:", error);
    }
  }

  // ==============================================
  // INITIALIZATION
  // ==============================================

  if (elements.otherPanel) {
    elements.otherPanel.hidden = true;
  }

  showWelcome();
  checkBackend();

  console.log("THEURIQ-AI frontend initialized.");

});
