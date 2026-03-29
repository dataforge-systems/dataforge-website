(function () {
  "use strict";

  var API_URL =
    "https://dataforge-support-bot-production.up.railway.app/api/support/chat";
  var OPENING_MSG =
    "Hi! I'm the SAIP support assistant. Ask me anything about installation, activation, normalization, or exporting your data.";

  var history = [];
  var isOpen = false;
  var isLoading = false;
  var greeted = false;

  // --- Styles ---
  var style = document.createElement("style");
  style.textContent =
    "#df-chat-bubble{position:fixed;bottom:24px;right:24px;width:56px;height:56px;" +
    "border-radius:50%;background:#0c1a30;border:2px solid #1e3a5f;cursor:pointer;" +
    "display:flex;align-items:center;justify-content:center;" +
    "box-shadow:0 4px 16px rgba(0,0,0,.45);z-index:99999;transition:transform .2s}" +
    "#df-chat-bubble:hover{transform:scale(1.08)}" +
    "#df-chat-bubble svg{width:26px;height:26px;fill:#3f83f8}" +

    "#df-chat-panel{position:fixed;bottom:92px;right:24px;width:380px;max-height:520px;" +
    "background:#091222;border:1px solid #1e3a5f;border-radius:12px;display:none;" +
    "flex-direction:column;z-index:99999;box-shadow:0 8px 32px rgba(0,0,0,.55);" +
    "font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;" +
    "color:#f8fafc;font-size:14px;overflow:hidden}" +
    "#df-chat-panel.df-open{display:flex}" +

    "#df-chat-header{padding:16px 18px;background:#060d1a;border-bottom:1px solid rgba(255,255,255,.07);flex-shrink:0}" +
    "#df-chat-header .df-title{font-family:'Sora','Inter',sans-serif;font-weight:700;font-size:15px;margin-bottom:2px}" +
    "#df-chat-header .df-subtitle{font-size:12px;color:#94a3b8;font-weight:400}" +

    "#df-chat-messages{flex:1;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:10px}" +
    "#df-chat-messages::-webkit-scrollbar{width:5px}" +
    "#df-chat-messages::-webkit-scrollbar-thumb{background:#1e3a5f;border-radius:3px}" +

    ".df-msg{max-width:82%;padding:10px 14px;border-radius:12px;line-height:1.5;word-wrap:break-word;white-space:pre-wrap;font-size:13.5px}" +
    ".df-msg-user{align-self:flex-end;background:#1a56db;color:#fff;border-bottom-right-radius:4px}" +
    ".df-msg-bot{align-self:flex-start;background:#1e2d45;border-bottom-left-radius:4px;color:#e2e8f0}" +

    ".df-typing{align-self:flex-start;display:flex;gap:5px;padding:12px 18px;background:#1e2d45;border-radius:12px;border-bottom-left-radius:4px}" +
    ".df-typing span{width:7px;height:7px;border-radius:50%;background:#3f83f8;animation:df-bounce 1.2s infinite}" +
    ".df-typing span:nth-child(2){animation-delay:.2s}" +
    ".df-typing span:nth-child(3){animation-delay:.4s}" +
    "@keyframes df-bounce{0%,60%,100%{transform:translateY(0);opacity:.4}30%{transform:translateY(-6px);opacity:1}}" +

    ".df-escalate{align-self:flex-start;margin-top:2px;font-size:13px;color:#94a3b8}" +
    ".df-escalate a{color:#3f83f8;text-decoration:underline}" +
    ".df-escalate a:hover{color:#60a5fa}" +

    "#df-chat-input-bar{display:flex;gap:8px;padding:12px;border-top:1px solid rgba(255,255,255,.07);background:#060d1a;flex-shrink:0}" +
    "#df-chat-input{flex:1;padding:9px 12px;border:1px solid #1e2d45;border-radius:8px;background:#091222;color:#f8fafc;font-size:14px;font-family:inherit;outline:none}" +
    "#df-chat-input::placeholder{color:#475569}" +
    "#df-chat-input:focus{border-color:#1a56db}" +
    "#df-chat-send{padding:9px 16px;border:none;border-radius:8px;background:#1a56db;color:#fff;font-size:14px;font-weight:600;cursor:pointer;font-family:inherit;flex-shrink:0}" +
    "#df-chat-send:disabled{opacity:.4;cursor:default}" +
    "#df-chat-send:hover:not(:disabled){background:#3f83f8}";
  document.head.appendChild(style);

  // --- Bubble ---
  var bubble = document.createElement("button");
  bubble.id = "df-chat-bubble";
  bubble.setAttribute("aria-label", "Open support chat");
  bubble.innerHTML =
    '<svg viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H5.17L4 17.17V4h16v12z"/><path d="M7 9h2v2H7zm4 0h2v2h-2zm4 0h2v2h-2z"/></svg>';
  document.body.appendChild(bubble);

  // --- Panel ---
  var panel = document.createElement("div");
  panel.id = "df-chat-panel";
  panel.innerHTML =
    '<div id="df-chat-header">' +
    '<div class="df-title">SAIP Support</div>' +
    '<div class="df-subtitle">DataForge Systems</div>' +
    "</div>" +
    '<div id="df-chat-messages"></div>' +
    '<div id="df-chat-input-bar">' +
    '<input id="df-chat-input" type="text" placeholder="Ask a question\u2026" autocomplete="off">' +
    '<button id="df-chat-send">Send</button>' +
    "</div>";
  document.body.appendChild(panel);

  var messagesEl = panel.querySelector("#df-chat-messages");
  var inputEl = panel.querySelector("#df-chat-input");
  var sendBtn = panel.querySelector("#df-chat-send");

  // --- Toggle ---
  bubble.addEventListener("click", function () {
    isOpen = !isOpen;
    panel.classList.toggle("df-open", isOpen);
    if (isOpen) {
      if (!greeted) {
        greeted = true;
        appendMessage("bot", OPENING_MSG);
      }
      inputEl.focus();
    }
  });

  // --- Helpers ---
  function appendMessage(role, text) {
    var div = document.createElement("div");
    div.className = "df-msg " + (role === "user" ? "df-msg-user" : "df-msg-bot");
    div.textContent = text;
    messagesEl.appendChild(div);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function showEscalate() {
    var div = document.createElement("div");
    div.className = "df-escalate";
    div.innerHTML =
      'For account or billing help email: <a href="mailto:support@dataforgesystems.io">support@dataforgesystems.io</a>';
    messagesEl.appendChild(div);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function showTyping() {
    var div = document.createElement("div");
    div.className = "df-typing";
    div.id = "df-typing-indicator";
    div.innerHTML = "<span></span><span></span><span></span>";
    messagesEl.appendChild(div);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function hideTyping() {
    var el = document.getElementById("df-typing-indicator");
    if (el) el.remove();
  }

  function getRecentHistory() {
    return history.slice(-6);
  }

  // --- Send ---
  async function send() {
    var text = inputEl.value.trim();
    if (!text || isLoading) return;

    appendMessage("user", text);
    history.push({ role: "user", content: text });
    inputEl.value = "";

    isLoading = true;
    sendBtn.disabled = true;
    showTyping();

    try {
      var response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          conversation_history: getRecentHistory(),
        }),
      });
      var data = await response.json();
      hideTyping();

      var reply = data.reply || "Sorry, something went wrong.";
      history.push({ role: "assistant", content: reply });
      appendMessage("bot", reply);

      if (data.escalate) {
        showEscalate();
      }
    } catch (e) {
      hideTyping();
      appendMessage("bot", "Unable to reach support. Please try again later.");
    }

    isLoading = false;
    sendBtn.disabled = false;
    inputEl.focus();
  }

  sendBtn.addEventListener("click", send);
  inputEl.addEventListener("keydown", function (e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  });
})();
