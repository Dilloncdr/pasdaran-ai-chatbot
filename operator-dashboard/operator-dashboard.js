// operator-dashboard.js  (PHP version)

// ====== API endpoints (PHP) ======
const GET_CHATS_URL      = "/chat-api/get-chats.php";
const CHAT_DETAILS_URL   = "/chat-api/get-chat-details.php";
const SEND_REPLY_URL     = "/chat-api/operator-reply.php";

let currentChat = null;
let typingEl = null;

// ---------- Helpers ----------

// Format date label for date dividers
function formatDateLabel(date) {
  const today = new Date();
  const todayKey = today.toISOString().slice(0, 10);

  const yest = new Date(today);
  yest.setDate(today.getDate() - 1);
  const yestKey = yest.toISOString().slice(0, 10);

  const key = date.toISOString().slice(0, 10);

  if (key === todayKey) return "امروز";
  if (key === yestKey) return "دیروز";

  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}/${m}/${d}`;
}

function showTypingIndicator(label = "کاربر در حال تایپ است...") {
  const chatBox = document.getElementById("chat-history");
  if (!chatBox) return;

  hideTypingIndicator();

  typingEl = document.createElement("div");
  typingEl.className = "chat-bubble typing-indicator";
  typingEl.innerHTML = `
    <div style="font-size:11px; opacity:0.7; margin-bottom:4px;">
      ${label}
    </div>
    <div class="typing-dots">
      <span></span><span></span><span></span>
    </div>
  `;
  chatBox.appendChild(typingEl);
  chatBox.scrollTop = chatBox.scrollHeight;
}

function hideTypingIndicator() {
  if (typingEl && typingEl.parentNode) {
    typingEl.parentNode.removeChild(typingEl);
  }
  typingEl = null;
}

// ---------- Load list of chats ----------
async function loadChats() {
  const list = document.getElementById("chat-list");
  if (!list) return;
  list.innerHTML = "<p class='info'>در حال بارگذاری گفتگوها...</p>";

  try {
    const res = await fetch(GET_CHATS_URL, { method: "GET" });
    if (!res.ok) throw new Error("HTTP " + res.status);

    const raw = await res.json();
    let chats = [];

    // PHP returns a simple array
    if (Array.isArray(raw)) chats = raw;
    else if (Array.isArray(raw.chats)) chats = raw.chats;
    else chats = [];

    // Sort newest first
    if (chats.length > 0) {
      chats = chats.sort((a, b) =>
        new Date(b.last_updated || b.last_timestamp) -
        new Date(a.last_updated || a.last_timestamp)
      );
    }

    list.innerHTML = "";

    if (!chats.length) {
      list.innerHTML = "<p class='empty'>هیچ گفتگویی در صف نیست.</p>";
      return;
    }

    chats.forEach(chat => {
      const btn = document.createElement("button");
      btn.className = "chat-item";

      const name  = chat.name  || "بدون نام";
      const phone = chat.phone || "";
      const last  = chat.last_message || chat.message || "";
      const time  = chat.last_timestamp || chat.last_updated || "";

      if (!chat.user_id) {
        console.warn("❗ chat object received WITHOUT user_id:", chat);
      }

      btn.innerHTML = `
        <div class="chat-list-title">
          <span>${name}</span>
          <span class="chat-list-phone">${phone}</span>
        </div>
        <div class="chat-list-snippet">${last}</div>
        <div class="chat-list-time">${time}</div>
      `;

      btn.addEventListener("click", () => openChat(chat));
      list.appendChild(btn);
    });
  } catch (err) {
    console.error("loadChats error", err);
    list.innerHTML = "<p class='error'>خطا در دریافت لیست گفتگوها</p>";
  }
}

// ---------- Open a single chat ----------
async function openChat(chat) {
  currentChat = chat;

  const detail   = document.getElementById("chat-detail");
  const chatBox  = document.getElementById("chat-history");

  const titleEl  = document.getElementById("current-user-title");
  const nameEl   = document.getElementById("user-name");
  const phoneEl  = document.getElementById("user-phone");
  const urlEl    = document.getElementById("user-url");

  if (!detail || !chatBox) return;

  detail.style.display = "flex";
  chatBox.innerHTML = "<p class='info'>در حال بارگذاری سابقه گفتگو...</p>";

  // mini profile
  const nm = chat.name || "کاربر";
  if (nameEl)  nameEl.textContent  = nm;
  if (phoneEl) phoneEl.textContent = chat.phone || "بدون شماره";

  if (urlEl) {
    const url = chat.page_url || "";
    if (url) {
      urlEl.textContent = url.replace(/^https?:\/\//, "");
      urlEl.href = url;
      urlEl.classList.remove("is-empty");
    } else {
      urlEl.textContent = "بدون صفحه";
      urlEl.removeAttribute("href");
      urlEl.classList.add("is-empty");
    }
  }

  if (titleEl) {
    const ph = chat.phone ? ` | ${chat.phone}` : "";
    titleEl.textContent = nm + ph;
  }

  hideTypingIndicator();

  if (!chat.user_id || chat.user_id.trim() === "") {
    chatBox.innerHTML = "<p class='error'>شناسه کاربر یافت نشد (user_id نامعتبر است)</p>";
    console.error("❗ Cannot load chat details: MISSING user_id in chat:", chat);
    return;
  }

  try {
    const url = `${CHAT_DETAILS_URL}?user_id=${encodeURIComponent(chat.user_id)}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("HTTP " + res.status);

    const raw = await res.json();
    const history = Array.isArray(raw?.conversation)
      ? raw.conversation
      : Array.isArray(raw)
      ? raw
      : [];

    chatBox.innerHTML = "";
    if (!history.length) {
      chatBox.innerHTML = "<p class='empty'>هیچ پیامی ثبت نشده است.</p>";
      return;
    }

    let lastDateKey = null;

    history.forEach(msg => {
      const ts = msg.timestamp;
      if (ts) {
        const d = new Date(ts.replace(" ", "T"));
        if (!isNaN(d)) {
          const key = d.toISOString().slice(0, 10);
          if (key !== lastDateKey) {
            lastDateKey = key;
            const divider = document.createElement("div");
            divider.className = "date-divider";
            divider.textContent = formatDateLabel(d);
            chatBox.appendChild(divider);
          }
        }
      }

      const div = document.createElement("div");
      const sender = msg.sender || "user";

      div.classList.add("chat-bubble");
      if (sender === "operator") div.classList.add("operator");
      else if (sender === "bot") div.classList.add("bot");
      else div.classList.add("user");

      const label =
        sender === "operator" ? "اپراتور" :
        sender === "bot"      ? "ربات" :
                                "کاربر";

      const time = msg.timestamp || "";

      div.innerHTML = `
        <div style="font-size:11px; opacity:0.7; margin-bottom:4px;">
          ${label} · ${time}
        </div>
        <div>${msg.message || ""}</div>
      `;
      chatBox.appendChild(div);
    });

    setTimeout(() => {
      chatBox.scrollTop = chatBox.scrollHeight;
    }, 50);
  } catch (err) {
    console.error("openChat error", err);
    chatBox.innerHTML = "<p class='error'>خطا در دریافت جزئیات گفتگو</p>";
  }
}

// ---------- Send operator reply ----------
async function sendOperatorReply() {
  if (!currentChat) return;

  const input   = document.getElementById("reply-input");
  const chatBox = document.getElementById("chat-history");
  if (!input || !chatBox) return;

  const text = input.value.trim();
  if (!text) return;

  const body = {
    user_id:  currentChat.user_id,
    name:     currentChat.name  || "",
    phone:    currentChat.phone || "",
    page_url: currentChat.page_url || "",
    message:  text,
  };

  input.value = "";
  input.disabled = true;

  try {
    const res = await fetch(SEND_REPLY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error("HTTP " + res.status);

    hideTypingIndicator();

    const div = document.createElement("div");
    div.classList.add("chat-bubble", "operator", "new-message");
    div.innerHTML = `
      <div style="font-size:11px; opacity:0.7; margin-bottom:4px;">
        اپراتور · هم‌اکنون
      </div>
      <div>${text}</div>
    `;
    chatBox.appendChild(div);

    setTimeout(() => {
      chatBox.scrollTop = chatBox.scrollHeight;
    }, 50);
  } catch (err) {
    console.error("sendOperatorReply error", err);
    alert("ارسال پیام ناموفق بود");
  } finally {
    input.disabled = false;
    input.focus();
  }
}

// ---------- Events ----------
const sendBtn    = document.getElementById("send-reply-btn");
const backBtn    = document.getElementById("back-to-list");
const replyInput = document.getElementById("reply-input");

if (sendBtn) {
  sendBtn.addEventListener("click", sendOperatorReply);
}

if (backBtn) {
  backBtn.addEventListener("click", () => {
    const detail = document.getElementById("chat-detail");
    if (detail) detail.style.display = "none";
    currentChat = null;
    loadChats();
  });
}

if (replyInput) {
  replyInput.addEventListener("keydown", e => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendOperatorReply();
    }
  });
}

// Initial load + auto-refresh of chat list
loadChats();
setInterval(loadChats, 15000);
