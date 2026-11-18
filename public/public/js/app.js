// THEURIQ-AI - FULL WORKING JS
document.addEventListener('DOMContentLoaded', () => {
  const messageInput = document.getElementById('messageInput');
  const sendButton = document.getElementById('sendButton');
  const attachButton = document.getElementById('attachButton');
  const welcomeArea = document.getElementById('welcomeArea');
  const conversation = document.getElementById('conversation');
  const notification = document.getElementById('notification');
  const menuToggle = document.getElementById('menuToggle');

  let fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.hidden = true;
  fileInput.accept = 'image/*,.pdf,.txt,.doc,.docx';
  document.body.appendChild(fileInput);

  function showToast(msg) {
    if (!notification) return;
    notification.textContent = msg;
    notification.hidden = false;
    setTimeout(() => notification.hidden = true, 2500);
  }

  function showChat() {
    if (welcomeArea) welcomeArea.style.display = 'none';
    if (conversation) {
      conversation.hidden = false;
      conversation.style.display = 'flex';
    }
  }

  function addMessage(text, who = 'user') {
    showChat();
    const div = document.createElement('div');
    div.style.cssText = who === 'user'
      ? 'align-self:flex-end;background:#fff;color:#000;padding:12px 16px;border-radius:18px 18px 4px 18px;max-width:85%;font-size:15px;line-height:1.5;white-space:pre-wrap;word-break:break-word'
      : 'align-self:flex-start;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.12);color:#fff;padding:12px 16px;border-radius:18px 18px 18px 4px;max-width:85%;font-size:15px;line-height:1.5;white-space:pre-wrap;word-break:break-word';
    div.textContent = text;
    conversation.appendChild(div);
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    return div;
  }

  // 1. SEND BUTTON - INAFANYA KAZI SASA
  function sendMessage() {
    const text = messageInput.value.trim();
    if (!text) {
      showToast('Andika kitu kwanza');
      return;
    }
    addMessage(text, 'user');
    messageInput.value = '';
    messageInput.style.height = 'auto';

    // Fake AI reply - hadi u-connect backend
    const thinking = addMessage('THEURIQ inafikiria...', 'ai');
    setTimeout(() => {
      thinking.textContent = `Nimepokea: "${text}"\n\nNiko bado kwenye development mode. Backend iki-connect, nitakujibu hapa kama AI kamili. Lakini UI yako sasa inafanya kazi 100%!`;
    }, 900);
  }

  if (sendButton) sendButton.addEventListener('click', sendMessage);
  if (messageInput) {
    messageInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    });
    // Auto-grow textarea
    messageInput.addEventListener('input', () => {
      messageInput.style.height = 'auto';
      messageInput.style.height = messageInput.scrollHeight + 'px';
    });
  }

  // 2. EXPLORE BUTTONS - CODING, RESEARCH, etc.
  document.querySelectorAll('.capability-card').forEach(card => {
    card.addEventListener('click', () => {
      const prompt = card.getAttribute('data-prompt');
      messageInput.value = prompt;
      messageInput.focus();
      showToast('Prompt imewekwa - bonyeza Send');
    });
  });

  // 3. ATTACH BUTTON
  if (attachButton) attachButton.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', () => {
    if (fileInput.files.length > 0) {
      showToast('File imechaguliwa: ' + fileInput.files[0].name);
    }
  });

  // 4. BOTTOM NAV - CHAT / PROJECTS / HISTORY / SETTINGS
  document.querySelectorAll('.bottom-nav-item').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.bottom-nav-item').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const panel = btn.getAttribute('data-panel');

      if (panel === 'chat') {
        if (welcomeArea) welcomeArea.style.display = 'block';
        if (conversation) conversation.style.display = 'flex';
      } else if (panel === 'projects') {
        showToast('Projects - bado tunajenga, coming soon');
      } else if (panel === 'history') {
        showToast('History - hakuna chat bado');
      } else if (panel === 'settings') {
        showToast('Settings - coming soon');
      }
    });
  });

  // 5. MENU BUTTON (Hamburger juu)
  if (menuToggle) menuToggle.addEventListener('click', () => {
    showToast('THEURIQ-AI v1.0 - Built by John');
  });

  console.log('THEURIQ-AI JS Loaded OK');
});
