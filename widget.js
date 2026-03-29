(function () {
  "use strict";

  var API_URL = window.DATAFORGE_SUPPORT_URL;
  if (!API_URL) {
    console.error("DATAFORGE_SUPPORT_URL is not set");
    return;
  }
  API_URL = API_URL.replace(/\/+$/, "");

  var messages = [];
  var isOpen = false;
  var isLoading = false;

  // --- Styles ---
  var style = document.createElement("style");
  style.textContent =
    "#df-chat-bubble{position:fixed;bottom:24px;right:24px;width:56px;height:56px;border-radius:50%;background:#2563eb;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 16px rgba(0,0,0,.4);z-index:99999;transition:transform .2s}" +
    "#df-chat-bubble:hover{transform:scale(1.08)}" +
    "#df-chat-bubble svg{width:28px;height:28px;fill:#e2e8f0}" +
    "#df-chat-panel{position:fixed;bottom:92px;right:24px;width:360px;height:480px;background:#0a1628;border:1px solid #1e3a5f;border-radius:12px;display:none;flex-direction:column;z-index:99999;box-shadow:0 8px 32px rgba(0,0,0,.5);font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#e2e8f0;font-size:14px;overflow:hidden}" +
    "#df-chat-panel.df-open{display:flex}" +
    "#df-chat-header{display:flex;align-items:center;gap:10px;padding:14px 16px;background:#0d1f3c;border-bottom:1px solid #1e3a5f;flex-shrink:0}" +
    "#df-chat-header .df-logo{width:28px;height:28px;border-radius:6px;background:#1e3a5f;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:13px;color:#2563eb}" +
    "#df-chat-header .df-title{font-weight:600;font-size:15px}" +
    "#df-chat-messages{flex:1;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:10px}" +
    "#df-chat-messages::-webkit-scrollbar{width:6px}" +
    "#df-chat-messages::-webkit-scrollbar-thumb{background:#1e3a5f;border-radius:3px}" +
    ".df-msg{max-width:82%;padding:10px 14px;border-radius:12px;line-height:1.45;word-wrap:break-word;white-space:pre-wrap}" +
    ".df-msg-user{align-self:flex-end;background:#2563eb;color:#fff;border-bottom-right-radius:4px}" +
    ".df-msg-bot{align-self:flex-start;background:#162240;border:1px solid #1e3a5f;border-bottom-left-radius:4px}" +
    ".df-typing{align-self:flex-start;display:flex;gap:5px;padding:12px 18px;background:#162240;border:1px solid #1e3a5f;border-radius:12px;border-bottom-left-radius:4px}" +
    ".df-typing span{width:7px;height:7px;border-radius:50%;background:#4b7bdb;animation:df-bounce 1.2s infinite}" +
    ".df-typing span:nth-child(2){animation-delay:.2s}" +
    ".df-typing span:nth-child(3){animation-delay:.4s}" +
    "@keyframes df-bounce{0%,60%,100%{transform:translateY(0);opacity:.4}30%{transform:translateY(-6px);opacity:1}}" +
    ".df-escalate-btn{display:block;width:100%;margin-top:8px;padding:10px;border:1px solid #2563eb;border-radius:8px;background:transparent;color:#2563eb;font-size:13px;font-weight:600;text-align:center;text-decoration:none;cursor:pointer;font-family:inherit;transition:background .15s}" +
    ".df-escalate-btn:hover{background:rgba(37,99,235,.12)}" +
    "#df-chat-input-bar{display:flex;gap:8px;padding:12px;border-top:1px solid #1e3a5f;background:#0d1f3c;flex-shrink:0}" +
    "#df-chat-input{flex:1;padding:9px 12px;border:1px solid #1e3a5f;border-radius:8px;background:#0a1628;color:#e2e8f0;font-size:14px;font-family:inherit;outline:none;resize:none}" +
    "#df-chat-input::placeholder{color:#5a6f8a}" +
    "#df-chat-input:focus{border-color:#2563eb}" +
    "#df-chat-send{padding:9px 16px;border:none;border-radius:8px;background:#2563eb;color:#fff;font-size:14px;font-weight:600;cursor:pointer;font-family:inherit;flex-shrink:0}" +
    "#df-chat-send:disabled{opacity:.45;cursor:default}" +
    "#df-chat-send:hover:not(:disabled){background:#3b7cf5}";
  document.head.appendChild(style);

  // --- Bubble ---
  var bubble = document.createElement("button");
  bubble.id = "df-chat-bubble";
  bubble.setAttribute("aria-label", "Open support chat");
  bubble.innerHTML =
    '<svg viewBox="0 0 24 24"><path d="M11.07 12.85c.77-1.39 2.25-2.21 3.11-3.44.91-1.29.4-3.7-2.18-3.7-1.69 0-2.52 1.28-2.87 2.34L7.44 7.27C8.21 4.82 10.19 3.5 12 3.5c2.92 0 5.1 1.86 5.1 4.55 0 1.83-1.21 3.22-2.25 4.2-.75.71-1.55 1.33-1.78 2.6V15H11v-.15h.07zM12 19.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z"/></svg>';
  document.body.appendChild(bubble);

  // --- Panel ---
  var panel = document.createElement("div");
  panel.id = "df-chat-panel";
  panel.innerHTML =
    '<div id="df-chat-header">' +
    '<div class="df-logo">DF</div>' +
    '<div class="df-title">SAIP Support</div>' +
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
    if (isOpen) inputEl.focus();
  });

  // --- Render helpers ---
  function appendMessage(role, text) {
    var div = document.createElement("div");
    div.className = "df-msg " + (role === "user" ? "df-msg-user" : "df-msg-bot");
    div.textContent = text;
    messagesEl.appendChild(div);
    messagesEl.scrollTop = messagesEl.scrollHeight;
    return div;
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

  function buildMailtoBody() {
    var userMsgs = messages.filter(function (m) {
      return m.role === "user";
    });
    var last3 = userMsgs.slice(-3);
    var lines = last3.map(function (m, i) {
      return "Message " + (i + 1) + ": " + m.content;
    });
    return "SAIP Support Request\n\nConversation context:\n" + lines.join("\n");
  }

  function showEscalateButton() {
    var wrapper = document.createElement("div");
    wrapper.style.cssText = "align-self:stretch;padding:0 2px";
    var a = document.createElement("a");
    a.className = "df-escalate-btn";
    a.href =
      "mailto:support@dataforgesystems.io?subject=" +
      encodeURIComponent("SAIP Support Request") +
      "&body=" +
      encodeURIComponent(buildMailtoBody());
    a.textContent = "Email Support Team";
    wrapper.appendChild(a);
    messagesEl.appendChild(wrapper);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  // --- Send ---
  function send() {
    var text = inputEl.value.trim();
    if (!text || isLoading) return;

    messages.push({ role: "user", content: text });
    appendMessage("user", text);
    inputEl.value = "";

    isLoading = true;
    sendBtn.disabled = true;
    showTyping();

    var xhr = new XMLHttpRequest();
    xhr.open("POST", API_URL + "/chat");
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.onload = function () {
      hideTyping();
      isLoading = false;
      sendBtn.disabled = false;

      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          var data = JSON.parse(xhr.responseText);
          var reply = data.response || "";
          messages.push({ role: "assistant", content: reply });
          appendMessage("assistant", reply);
          if (data.escalate) {
            showEscalateButton();
          }
        } catch (e) {
          appendMessage("assistant", "Sorry, something went wrong.");
        }
      } else {
        appendMessage("assistant", "Sorry, something went wrong. Please try again.");
      }
      inputEl.focus();
    };
    xhr.onerror = function () {
      hideTyping();
      isLoading = false;
      sendBtn.disabled = false;
      appendMessage("assistant", "Unable to reach support. Please try again later.");
      inputEl.focus();
    };
    xhr.send(JSON.stringify({ messages: messages }));
  }

  sendBtn.addEventListener("click", send);
  inputEl.addEventListener("keydown", function (e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  });
})();
