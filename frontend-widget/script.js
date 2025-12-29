﻿﻿// --- Selectors ---
const chatToggle = document.getElementById("chat-toggle");
const connectOperatorBtn = document.getElementById("connect-operator-btn");
const chatWidget = document.getElementById("chat-widget");
const options = document.querySelectorAll(".chat-option");
const backButtons = document.querySelectorAll(".back-btn");

// ===== Endpoints =====
// AI stays on n8n:
const N8N_CHATBOT_URL = "https://omidsj6643.app.n8n.cloud/webhook-test/chatbot-search";
const N8N_FOLLOWUP_URL = "https://omidsj6643.app.n8n.cloud/webhook-test/406d85f6-e60e-4d13-87f6-5eb78a6f8c4d";
const N8N_ORDER_TRACKING_URL = "https://omidsj6643.app.n8n.cloud/webhook-test/fd0a3bb6-99c0-4505-a780-2f5ff2145771";


// Everything related to human operator chat uses PHP now:
const CHAT_API_BASE          = "/chat-api";
const PHP_SEND_MESSAGE_URL   = `${CHAT_API_BASE}/send-message.php`;
const PHP_CHAT_DETAILS_URL   = `${CHAT_API_BASE}/get-chat-details.php`;
let chatMode = "ai"; // ai | operator


function resetOperatorMode() {
  inOperatorMode = false;
  handoffRequested = false;
  window._lastOperatorCount = 0;

  appendMessage("bot", "در صورت نیاز، می‌توانم دوباره کمکتان کنم 😊");
  logToChatApi("bot", "بازگشت به حالت هوش مصنوعی");
}



// In-memory chat history to send to operator
const chatHistory = [];
let inOperatorMode = false;          // true => we’re in human handoff mode
let handoffRequested = false;        // user asked for operator



// --- Toggle chat window ---
chatToggle.addEventListener("click", () => {
  chatWidget.classList.toggle("hidden");
  const isOpen = !chatWidget.classList.contains("hidden");

  if (!chatWidget.classList.contains("hidden")) {
  showScreen("menu-main");
}


  // when chat closes → AI comes back
  if (!isOpen) {
    resetOperatorMode();
  }
});



// --- Smooth, layout-safe transition ---
const chatBody = document.getElementById("chat-body");

function showScreen(screenId) {
  if (!chatBody) return;
  chatBody.classList.add("fading");

  setTimeout(() => {
    document.querySelectorAll(".chat-screen").forEach(s => s.classList.remove("active"));
    const target = document.getElementById(screenId);
    if (target) target.classList.add("active");

    const hb = document.getElementById("header-back");
    const connectBtn = document.getElementById("connect-operator-btn");

    // Header controls should exist ONLY in operator chat
    if (hb) {
      hb.style.display = screenId === "menu-operator" ? "inline-flex" : "none";
    }

    if (connectBtn) {
      connectBtn.style.display = screenId === "menu-operator" ? "inline-flex" : "none";
    }




    setTimeout(() => chatBody.classList.remove("fading"), 40);
  }, 120);
}

// ================================
// Header Back Button (TOP)
// ================================
const headerBackBtn = document.getElementById("header-back");

if (headerBackBtn) {
  headerBackBtn.addEventListener("click", () => {
    const activeScreen = document.querySelector(".chat-screen.active");
    if (!activeScreen) return;

    const parentId = activeScreen.getAttribute("data-parent");

    // If no parent → go to main menu
    showScreen(parentId || "menu-main");
  });
}


// --- Handle Menu Buttons ---
options.forEach(btn => {
  btn.addEventListener("click", () => {
    const target = btn.getAttribute("data-target");
    if (target) showScreen(target);
  });
});

backButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    const currentScreen = btn.closest(".chat-screen");
    const parentId = currentScreen?.getAttribute("data-parent");
    showScreen(parentId || "menu-main");
  });
});



// ================================
// Connect to Operator button logic
// ================================
// Global delegated handler for Connect to Operator
document.addEventListener("click", (e) => {
  const btn = e.target.closest("#connect-operator-btn");
  if (!btn) return;

  if (inOperatorMode) return;

  showScreen("menu-operator");
  requestHumanHandoff();
});


// --- FAQ Logic ---
const faqButtons = document.querySelectorAll(".faq-btn");
const faqResponseContainer = document.getElementById("faq-response");

faqButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    const answerType = btn.getAttribute("data-answer");
    let responseHTML = "";

    switch (answerType) {
      case "delivery":
        responseHTML = `
          <div class="faq-box">
            <p>اگر ساکن تهران هستید، می‌توانید از گزینه <strong>ارسال با پیک</strong> استفاده کنید.</p>
            <p>در این روش، سفارش شما حداکثر تا دو ساعت پس از ثبت سفارش در ساعات کاری شهر کتاب به پیک تحویل داده می‌شود و در همان روز به دست شما خواهد رسید.</p>
            <p>سفارش پستی شما نیز تا دو روز کاری بعد از ثبت سفارش به اداره پست تحویل داده می‌شوند تا در اسرع وقت به دستتان برسند.</p>
          </div>`;
        break;
      case "tracking":
        responseHTML = `
          <div class="faq-box">
            <p>برای پیگیری سفارش، به بخش <strong>پیگیری سفارش</strong> مراجعه کرده و شماره سفارش خود را وارد کنید.</p>
            <p>اگر کد رهگیری ۲۴ رقمی برای شما ارسال شده می‌توانید از 
            <a href="https://tracking.post.ir/" target="_blank" style="color:#0066cc; font-weight:bold;">سامانه رهگیری پست</a>
            وضعیت بسته خود را رهگیری کنید.</p>
            <p>همچنین می‌توانید از طریق شماره <strong>۰۲۱-۲۲۵۴۹۵۵۶ (داخلی ۴)</strong> با پشتیبانی سایت در ارتباط باشید.</p>
          </div>`;
        break;
      case "shipping":
        responseHTML = `
          <div class="faq-box">
            <p>هزینه ارسال با پیک بر اساس مسافت و تعرفه‌های پیک مشخص می‌شود.</p>
            <p>بعد از اعمال ۳۰ هزار تومان تخفیف در هزینه، مابقی هزینه ارسال با پیک به عهده مشتری است.</p>
          </div>`;
        break;
      case "contact":
        responseHTML = `
          <div class="faq-box">
            <p><strong>آدرس:</strong> خیابان پاسداران، بوستان دوم (اخوان)، پلاک ۹</p>
            <p><strong>ساعت کاری:</strong> همه‌روزه از ساعت ۹:۳۰ صبح تا ۱۰ شب</p>
            <p><strong>تلفن تماس:</strong> ۰۲۱-۲۲۵۴۹۵۵۶ (داخلی ۴)</p>
            <p><strong>ایمیل:</strong> <a href="mailto:Info@pasdaranbookcity.com">Info@pasdaranbookcity.com</a></p>
            <p><strong>اینستاگرام:</strong> <a href="https://www.instagram.com/pasdaran_bookcity/?hl=en" target="_blank">Pasdaran_Bookcity</a></p>
          </div>`;
        break;
      default:
        responseHTML = `<div class="faq-box"><p>پاسخی در دسترس نیست.</p></div>`;
        break;
    }

    if (faqResponseContainer) {
      faqResponseContainer.innerHTML = responseHTML;
      showScreen("faq-response");
    }
  });
});

// --- Order Tracking ---  (unchanged, still via n8n)
const orderButton = document.getElementById("check-order");
const orderInput = document.getElementById("order-number");
const orderResult = document.getElementById("order-result");

if (orderInput && orderButton && orderResult) {
  orderInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      orderButton.click();
    }
  });

  orderButton.addEventListener("click", async () => {
    const orderNumber = orderInput.value.trim();
    if (!orderNumber) {
      orderResult.style.display = "block";
      orderResult.innerHTML = "<p style='color:red;'>لطفاً شماره سفارش را وارد کنید.</p>";
      return;
    }

    orderButton.style.display = "none";
    orderResult.style.display = "block";
    orderResult.innerHTML = "<p>در حال بررسی وضعیت سفارش...</p>";

    try {
      const response = await fetch("https://pasdaranbc.app.n8n.cloud/webhook/order-status-checker", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order_number: orderNumber }),
      });

      if (!response.ok) throw new Error("خطا در اتصال به سرور");

      const data = await response.json();

      let message = "";
      if (data.message_fa) message = data.message_fa;
      else if (data.status) message = data.status;
      else if (data.message) message = data.message;
      else message = "وضعیت سفارش یافت نشد، لطفاً بعداً دوباره تلاش کنید.";

      if (message.includes("سامانه رهگیری پست")) {
        message = message.replace(
          /سامانه رهگیری پست/g,
          `<a href="https://tracking.post.ir/" target="_blank" style="color:#007bff; font-weight:bold; text-decoration:none;">سامانه رهگیری پست</a>`
        );
      }

      message = message.replace(
        /(\d{10,25})/g,
        `<span class="tracking-code" style="cursor:pointer; color:#3e5962; font-weight:bold;">$1</span>`
      );

      orderResult.innerHTML = `
        <div class="faq-box" style="margin-top:10px;">
          <p style="line-height:1.8; font-size:15px;">${message}</p>
        </div>
        <button id="retry-order" class="chat-option" style="background:#e8eef0;">بررسی مجدد</button>
      `;

      document.querySelectorAll(".tracking-code").forEach(el => {
        el.addEventListener("click", () => {
          navigator.clipboard.writeText(el.textContent.trim());
          const toast = document.createElement("div");
          toast.textContent = "کپی شد";
          toast.style.position = "absolute";
          toast.style.bottom = "10px";
          toast.style.left = "50%";
          toast.style.transform = "translateX(-50%)";
          toast.style.background = "#3e5962";
          toast.style.color = "white";
          toast.style.padding = "6px 14px";
          toast.style.borderRadius = "20px";
          toast.style.fontSize = "13px";
          toast.style.opacity = "1";
          toast.style.transition = "opacity 0.8s ease";
          document.body.appendChild(toast);
          setTimeout(() => (toast.style.opacity = "0"), 800);
          setTimeout(() => toast.remove(), 1500);
        });
      });

      const retryButton = document.getElementById("retry-order");
      if (retryButton) {
        retryButton.addEventListener("click", () => {
          orderButton.style.display = "block";
          orderResult.style.display = "none";
          orderInput.value = "";
        });
      }
    } catch (error) {
      console.error(error);
      orderResult.innerHTML = "<p style='color:red;'>خطا در بررسی سفارش. لطفاً دوباره تلاش کنید.</p>";
      orderButton.style.display = "block";
    }
  });
}

// --- Operator register form ---
const startChatBtn = document.getElementById("start-operator-chat");
if (startChatBtn) {
  startChatBtn.addEventListener("click", () => {
    const nameInput = document.getElementById("operator-name");
    const phoneInput = document.getElementById("operator-phone");
    if (!nameInput || !phoneInput) return;

    const name = nameInput.value.trim();
    const phone = phoneInput.value.trim();

    if (!name || !phone) {
      alert("لطفاً نام و شماره تماس را وارد کنید.");
      return;
    }

    localStorage.setItem("chat_user_name", name);
    localStorage.setItem("chat_user_phone", phone);

    const reg = document.getElementById("operator-register");
    const chatArea = document.getElementById("chat-area");
    if (reg) reg.style.display = "none";
    if (chatArea) chatArea.style.display = "block";

    // optional: log session start in n8n (kept for analytics)
    fetch(N8N_CHATBOT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: getOrCreateUserId(),
        name,
        phone,
        page_url: window.location.href,
        message: "شروع گفتگو با اپراتور",
        history: Array.isArray(chatHistory) ? chatHistory.slice(-50) : []
      }),
    }).catch(() => {});
  });

  const registerBox = document.getElementById("operator-register");
  if (registerBox) {
    registerBox.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        startChatBtn.click();
      }
    });
  }
}

// ================================
// 🤖 AI Chatbot (with human handoff)
// ================================
const chatContainer = document.getElementById("chat-container");
const sendMessageBtn = document.getElementById("sendMessage");
const userMessageInput = document.getElementById("userMessage");

function appendMessage(sender, text) {
  if (!chatContainer) return;
  const msgDiv = document.createElement("div");
  msgDiv.classList.add("message", sender);
  msgDiv.innerHTML = text;
  chatContainer.appendChild(msgDiv);
  chatContainer.scrollTop = chatContainer.scrollHeight;

  try {
    const stripped = (text || "").toString().replace(/<[^>]+>/g, "").trim();
    chatHistory.push({ role: sender, text: stripped, ts: Date.now() });
  } catch (_) {}
}

function getOrCreateUserId() {
  let id = localStorage.getItem("chat_user_id");
  if (!id) {
    id = (crypto && crypto.randomUUID)
      ? crypto.randomUUID()
      : String(Date.now()) + "-" + Math.random().toString(16).slice(2);
    localStorage.setItem("chat_user_id", id);
  }
  return id;
}

// 🔹 new: log to PHP backend
async function logToChatApi(sender, text) {
  const plain = (text || "").toString().replace(/<[^>]+>/g, "").trim();
  if (!plain) return;

  const payload = {
    user_id: getOrCreateUserId(),
    sender,
    message: plain,
    name:  localStorage.getItem("chat_user_name")  || "",
    phone: localStorage.getItem("chat_user_phone") || "",
    page_url: window.location.href,
  };

  try {
    await fetch(PHP_SEND_MESSAGE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch (err) {
    console.error("logToChatApi error", err);
  }
}

// === Helpful question card (like Melli bot) ===
function showHelpfulQuestion() {
  if (!chatContainer) return;
  const wrapper = document.createElement("div");
  wrapper.classList.add("message", "bot");
  wrapper.innerHTML = `
    <div class="feedback-card">
      <div>آیا این پاسخ برای شما مفید بود؟</div>
      <hr class="sep" />
      <div class="btn-row">
        <button class="feedback-btn primary" data-feedback="yes">بله، مفید بود</button>
        <button class="feedback-btn secondary" data-feedback="no">خیر، اتصال به کارشناس</button>
      </div>
    </div>
  `;
  chatContainer.appendChild(wrapper);
  chatContainer.scrollTop = chatContainer.scrollHeight;

  const yesBtn = wrapper.querySelector('[data-feedback="yes"]');
  const noBtn = wrapper.querySelector('[data-feedback="no"]');

  if (yesBtn) {
    yesBtn.addEventListener("click", () => {
      appendMessage("user", "بله، پاسخ مفید بود. ✅");
      logToChatApi("user", "بله، پاسخ مفید بود. ✅");
      wrapper.remove();
      sendFeedbackToN8n("yes");
    });
  }

  if (noBtn) {
    noBtn.addEventListener("click", () => {
      appendMessage("user", "خیر، لطفاً به کارشناس متصل شوم.");
      logToChatApi("user", "خیر، لطفاً به کارشناس متصل شوم.");
      wrapper.remove();
      requestHumanHandoff();
    });
  }
}

function sendFeedbackToN8n(value) {
  try {
    fetch(N8N_CHATBOT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: getOrCreateUserId(),
        name: localStorage.getItem("chat_user_name") || "کاربر",
        phone: localStorage.getItem("chat_user_phone") || "",
        order_number: localStorage.getItem("chat_order_number") || "",
        page_url: window.location.href,
        message: `بازخورد کاربر: ${value === "yes" ? "رضایت از پاسخ" : "نارضایتی از پاسخ"}`,
        feedback: value
      }),
    });
  } catch (_) {}
}

// === Human handoff ===
function requestHumanHandoff() {
  if (handoffRequested) return;
  handoffRequested = true;
  inOperatorMode = true;

  const systemMsg = "شما از این لحظه به کارشناسان پشتیبانی متصل هستید. لطفاً کمی منتظر بمانید تا همکاران ما پاسخ شما را ارسال کنند. 🙏";
  appendMessage("bot", systemMsg);
  logToChatApi("bot", systemMsg);

  const payload = {
    user_id: getOrCreateUserId(),
    name: localStorage.getItem("chat_user_name") || "کاربر",
    phone: localStorage.getItem("chat_user_phone") || "",
    order_number: localStorage.getItem("chat_order_number") || "",
    page_url: window.location.href,
    message: "کاربر درخواست اتصال به اپراتور داد.",
    handoff_request: true,
    history: Array.isArray(chatHistory) ? chatHistory.slice(-50) : []
  };

  // Log in n8n (optional) – this does NOT handle routing anymore,
  // routing is handled by PHP + operator dashboard.
  try {
    fetch(N8N_CHATBOT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch (err) {
    console.error("handoff error", err);
  }

  // Also log in PHP as a normal message
  logToChatApi("user", "کاربر درخواست اتصال به اپراتور داد.");

  if (connectOperatorBtn) {
  connectOperatorBtn.addEventListener("click", () => {
    if (inOperatorMode) return;

    requestHumanHandoff();
  });
}

}

// Easter-egg operator button (optional)
function showContactOperatorButton() {
  if (!chatContainer) return;
  const existing = document.getElementById("contact-operator-btn");
  if (existing) return;
  const wrapper = document.createElement("div");
  wrapper.classList.add("message", "bot");
  const btn = document.createElement("button");
  btn.id = "contact-operator-btn";
  btn.textContent = "اتصال به کارشناس";
  btn.className = "chat-option";
  btn.style.marginTop = "8px";
  btn.addEventListener("click", () => requestHumanHandoff());
  wrapper.appendChild(btn);
  chatContainer.appendChild(wrapper);
  chatContainer.scrollTop = chatContainer.scrollHeight;
}


function renderNoResultsBlock(replyText, ui) {
  if (!chatContainer) return;

  const bubble = document.createElement("div");
  bubble.className = "message bot";

  bubble.innerHTML = `
    <div class="bot-text">
      ${replyText}
    </div>

    <div class="bot-quick-actions">
      <button class="bot-quick-btn" data-action="supply">درخواست تامین</button>
      <button class="bot-quick-btn" data-action="similar">محصولات مشابه</button>
    </div>
  `;

  chatContainer.appendChild(bubble);
  chatContainer.scrollTop = chatContainer.scrollHeight;

  bubble.querySelector('[data-action="similar"]').onclick = async () => {
    appendMessage("user", "محصولات مشابه");
    logToChatApi("user", "محصولات مشابه");

    const reply = await postFollowup({
      choice: "similar",
      context: ui?.context || {}
    });

    if (reply) {
      appendMessage("bot", reply);
      logToChatApi("bot", reply);
    }
  };

  bubble.querySelector('[data-action="supply"]').onclick = () => {
    appendMessage("user", "درخواست تامین");
    logToChatApi("user", "درخواست تامین");
    showSupplyRequestForm(ui?.context || {});
  };
}



async function postFollowup(payload) {
  try {
    const res = await fetch(N8N_FOLLOWUP_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: getOrCreateUserId(),
        name: localStorage.getItem("chat_user_name") || "",
        phone: localStorage.getItem("chat_user_phone") || "",
        order_number: localStorage.getItem("chat_order_number") || "",
        page_url: window.location.href,
        ...payload
      })
    });

    const data = await res.json();
    return (
      data.reply ||
      data.output?.reply ||
      data.output?.content?.[0]?.text ||
      data.text ||
      ""
    );
  } catch (e) {
    console.error("postFollowup error:", e);
    return "❌ مشکلی در ارتباط با سرور پیش آمد. لطفاً دوباره تلاش کنید.";
  }
}

function showSupplyRequestForm(context) {
  if (!chatContainer) return;

  const productName =
    (typeof context?.original_query === "string" &&
    !context.original_query.includes("$json") &&
    !context.original_query.includes("{{"))
      ? context.original_query
      : "";


  const wrapper = document.createElement("div");
  wrapper.classList.add("message", "bot");


  wrapper.innerHTML = `
    <div style="color:#ffffff; font-size:14px; margin-bottom:10px;">
      لطفاً فرم زیر را تکمیل کنید
    </div>

    <label style="color:#ffffff;">نام / نام خانوادگی <span style="color:#ff6b6b">*</span></label>
    <input type="text" id="sr-name" placeholder="هوشنگ کمالی">

    <label style="color:#ffffff;">شماره تماس <span style="color:#ff6b6b">*</span></label>
    <input type="text" id="sr-phone" placeholder="09123456789">

    <label style="color:#ffffff;">نام کالا <span style="color:#ff6b6b">*</span></label>
    <input type="text" id="sr-product" value="${productName}" placeholder="کتاب بیگانه/خودکار استایل">

    <label style="color:#ffffff;">
      دسته‌بندی <span style="color:#ff6b6b">*</span>
    </label>

    <select id="sr-category"
    
      style="
        width:100%;
        padding:10px;
        border-radius:10px;
        border:none;
        background:#ffffff;
        color:#2f3b40;
        font-size:14px;
        appearance:none;
        -webkit-appearance:none;
      ">

      

      <option value="">انتخاب کنید</option>
      <option value="a">کتاب بزرگسال</option>
      <option value="s">لوازم‌التحریر / هنری</option>
      <option value="cbct">کتاب کودک و بازی فکری</option>
    </select>

    

    <label style="color:#ffffff;">
      ناشر / برند <span style="color:#b0b0b0;">(اختیاری)</span>
    </label>
    <input type="text" id="sr-publisher" placeholder="نشر نیلوفر/یوروپن">

    <label style="color:#ffffff;">
      نویسنده / مترجم <span style="color:#b0b0b0;">(اختیاری)</span>
    </label>
    <input type="text" id="sr-author">

    <button class="chat-option" id="sr-submit" style="margin-top:10px; background:#dfffea;">
      ثبت درخواست
    </button>

    <button class="chat-option" id="sr-cancel" style="margin-top:6px;">
      بازگشت
    </button>
  `;

  chatContainer.appendChild(wrapper);
  chatContainer.scrollTop = chatContainer.scrollHeight;

  wrapper.querySelector("#sr-cancel").onclick = () => wrapper.remove();

  wrapper.querySelector("#sr-submit").onclick = async () => {
    const name = wrapper.querySelector("#sr-name").value.trim();
    const phone = wrapper.querySelector("#sr-phone").value.trim();
    const product_name = wrapper.querySelector("#sr-product").value.trim();
    const category_code = wrapper.querySelector("#sr-category").value.trim();
    const publisher_brand = wrapper.querySelector("#sr-publisher").value.trim();
    const author_translator = wrapper.querySelector("#sr-author").value.trim();

    if (!name || !phone || !product_name || !category_code) {
      alert("لطفاً فیلدهای الزامی را پر کنید");
      return;
    }

    const reply = await postFollowup({
      choice: "supply_request",
      context,
      form: {
        name,
        phone,
        product_name,
        category_code,
        publisher_brand,
        author_translator
      }
    });

    wrapper.remove();
    appendMessage("bot", reply || "درخواست شما با موفقیت ثبت شد 🌿");
    logToChatApi("bot", reply || "درخواست شما با موفقیت ثبت شد 🌿");
  };
}

function showOrderTrackingForm() {
  if (!chatContainer) return;

  const preName = localStorage.getItem("chat_user_name") || "";
  const prePhone = localStorage.getItem("chat_user_phone") || "";
  const preOrder = localStorage.getItem("chat_order_number") || "";

  const wrapper = document.createElement("div");
  wrapper.classList.add("message", "bot");

  wrapper.innerHTML = `
    <div style="color:#ffffff; font-size:14px; margin-bottom:10px;">
      لطفا فرم زیر را براساس اطلاعات ثبت شده داخل سفارش خود پر کنید
    </div>

    <label style="color:#ffffff;">نام <span style="color:#ff6b6b">*</span></label>
    <input type="text" id="ot-name" value="">

    <label style="color:#ffffff;">شماره تماس <span style="color:#ff6b6b">*</span></label>
    <input type="text" id="ot-phone" placeholder="09123456789" value="">

    <label style="color:#ffffff;">شماره سفارش <span style="color:#ff6b6b">*</span></label>
    <input type="text" id="ot-order" placeholder="کد 6 رقمی ارسال شده بعد از ثبت سفارش" value="">

    <button class="chat-option" id="ot-submit" style="margin-top:10px; background:#dfffea;">
      پیگیری سفارش
    </button>
    <button class="chat-option" id="ot-cancel" style="margin-top:6px;">
      بازگشت
    </button>
  `;

  chatContainer.appendChild(wrapper);
  chatContainer.scrollTop = chatContainer.scrollHeight;

  const submit = async () => {
    const name = wrapper.querySelector("#ot-name").value.trim();
    const phone = wrapper.querySelector("#ot-phone").value.trim();
    const order_number = wrapper.querySelector("#ot-order").value.trim();

    if (!name || !phone || !order_number) {
      alert("لطفاً همه فیلدهای الزامی را پر کنید");
      return;
    }

    // save memory
    localStorage.setItem("chat_user_name", name);
    localStorage.setItem("chat_user_phone", phone);
    localStorage.setItem("chat_order_number", order_number);

    wrapper.remove();

    appendMessage("user", `پیگیری سفارش ${order_number}`);
    logToChatApi("user", `پیگیری سفارش ${order_number}`);

    try {
      const res = await fetch(N8N_ORDER_TRACKING_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          phone,
          order_number,
          user_id: getOrCreateUserId()
        })
      });

      const data = await res.json();

      if (data?.reply) {
        appendMessage("bot", data.reply);
        logToChatApi("bot", data.reply);
      } else {
        appendMessage("bot", "نتوانستم اطلاعات سفارش را پیدا کنم.");
      }
    } catch (e) {
      appendMessage("bot", "خطا در ارتباط با سرور. لطفاً دوباره تلاش کنید.");
    }
  };

  // button click
  wrapper.querySelector("#ot-submit").onclick = submit;

  // Enter key support
  wrapper.querySelectorAll("input").forEach(input => {
    input.addEventListener("keydown", e => {
      if (e.key === "Enter") submit();
    });
  });

  wrapper.querySelector("#ot-cancel").onclick = () => wrapper.remove();
}




// === Send message to n8n + log to PHP ===
async function sendToN8n(message) {
  if (!chatContainer || !userMessageInput) return;

  appendMessage("user", message);
  logToChatApi("user", message);
  userMessageInput.value = "";

  // Easter Eggs
  const normalized = message.trim().replace(/\s+/g, "").toLowerCase();
  if (normalized.includes("آرامه") || normalized.includes("arameh")) {
    const resp = "عشق منه 😍💕😭";
    appendMessage("bot", resp);
    logToChatApi("bot", resp);
    return;
  }
  if (normalized.includes("محمدجلیلی") || normalized.includes("jalili")) {
    const resp = "بدون هیچ دلیلی عشق منی جلیلی ✌️";
    appendMessage("bot", resp);
    logToChatApi("bot", resp);
    return;
  }

  // If already in operator mode → only log to backend / optional n8n log
  if (inOperatorMode) {
    try {
      await fetch(N8N_CHATBOT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: getOrCreateUserId(),
          name: localStorage.getItem("chat_user_name") || "کاربر",
          phone: localStorage.getItem("chat_user_phone") || "",
          order_number: localStorage.getItem("chat_order_number") || "",
          page_url: window.location.href,
          message,
          mode: "operator_chat"
        }),
      });
    } catch (err) {
      console.error("operator mode send error", err);
      appendMessage("bot", "❌ مشکلی در ارسال پیام به اپراتور پیش آمد.");
      logToChatApi("bot", "❌ مشکلی در ارسال پیام به اپراتور پیش آمد.");
    }
    return;
  }

  // Normal AI mode
  const typingDiv = document.createElement("div");
  typingDiv.classList.add("message", "bot");
  typingDiv.textContent = "در حال نوشتن...";
  chatContainer.appendChild(typingDiv);
  chatContainer.scrollTop = chatContainer.scrollHeight;

  try {
    const res = await fetch(N8N_CHATBOT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: getOrCreateUserId(),
        name: localStorage.getItem("chat_user_name") || "کاربر ناشناس",
        phone: localStorage.getItem("chat_user_phone") || "",
        order_number: localStorage.getItem("chat_order_number") || "",
        page_url: window.location.href,
        message
      }),
    });

    chatContainer.removeChild(typingDiv);
    if (!res.ok) throw new Error("خطا در ارتباط با سرور");

    // ===================== HANDLE N8N RESPONSE =====================
    const data = await res.json();

    // 🔹 NEW: no-results UI handling
    if (data?.ui?.type === "no_results_actions") {
      // IMPORTANT: do NOT append bubble separately
      renderNoResultsBlock(data.reply || "", data.ui);
      if (data.reply) logToChatApi("bot", data.reply);
      return;
    }


    if (data?.ui?.type === "order_tracking_form") {
      if (data.reply) {
        appendMessage("bot", data.reply);
        logToChatApi("bot", data.reply);
      }
      showOrderTrackingForm(data.ui?.context || {});
      return;
    }



    // 🔹 Normal reply
    const reply =
      data.reply ||
      data.output?.reply ||
      data.output?.content?.[0]?.text ||
      data.text ||
      "متأسفم، پاسخ مشخصی پیدا نکردم.";

    appendMessage("bot", reply);
    logToChatApi("bot", reply);


    if (data.needs_human_review || data.hand_off || data.handoff) {
      showHelpfulQuestion();
    }

  } catch (err) {
    console.error(err);
    try { chatContainer.removeChild(typingDiv); } catch (_) {}
    const errorText = "❌ مشکلی در ارتباط با سرور پیش آمد. لطفاً دوباره تلاش کنید.";
    appendMessage("bot", errorText);
    logToChatApi("bot", errorText);
  }
}
    
// ================================================
// 🔄 POLLING FOR OPERATOR REPLIES (EVERY 2 SECONDS)
// ================================================
window._lastOperatorCount = 0;

setInterval(async () => {
  if (!inOperatorMode) return;

  try {
    const res = await fetch(
      `${PHP_CHAT_DETAILS_URL}?user_id=${encodeURIComponent(getOrCreateUserId())}`
    );
    if (!res.ok) return;

    const raw = await res.json();
    const history = Array.isArray(raw?.conversation) ? raw.conversation : [];
    const operatorMessages = history.filter(m => m.sender === "operator");

    const prevCount = window._lastOperatorCount || 0;
    const newCount = operatorMessages.length;

    if (newCount > prevCount) {
      const newOnes = operatorMessages.slice(prevCount);

      newOnes.forEach(msg => {
        appendMessage("bot", msg.message || "");
      });

      window._lastOperatorCount = newCount;

      // ⏱ Resume AI after operator silence
      clearTimeout(window._operatorIdleTimer);
      window._operatorIdleTimer = setTimeout(() => {
        resetOperatorMode();
      }, 5 * 60 * 1000);
    }
  } catch (err) {
    console.error("Operator polling error:", err);
  }
}, 2000);


// ================================
// 📎 File upload + 🎙️ Voice recording + morph behavior
// (unchanged – purely UI on client)
// ================================
const uploadBtn = document.getElementById("uploadBtn");
const sendMessageIconBtn = document.getElementById("sendMessage");
const fileInput = document.getElementById("fileInput");
const voiceBtn = document.getElementById("voiceBtn");

if (userMessageInput && uploadBtn && voiceBtn && sendMessageIconBtn) {
  userMessageInput.addEventListener("input", () => {
    const hasText = userMessageInput.value.trim().length > 0;
    uploadBtn.style.display = hasText ? "none" : "inline-flex";
    voiceBtn.style.display = hasText ? "none" : "inline-flex";
    sendMessageIconBtn.style.display = hasText ? "inline-flex" : "none";
  });
}

if (uploadBtn && fileInput) {
  uploadBtn.addEventListener("click", () => fileInput.click());

  fileInput.addEventListener("change", () => {
    if (!fileInput.files || fileInput.files.length === 0) return;
    const file = fileInput.files[0];
    const url = URL.createObjectURL(file);
    const type = (file.type || "").toLowerCase();

    if (type.startsWith("image/")) {
      appendMessage("user", `<img src="${url}" alt="تصویر ارسال‌شده" />`);
      logToChatApi("user", "[تصویر ارسال شد]");
    } else if (type.startsWith("audio/")) {
      appendMessage("user", `<audio controls src="${url}" style="width:100%;"></audio>`);
      logToChatApi("user", "[فایل صوتی ارسال شد]");
    } else {
      appendMessage("user", `📎 فایل ارسال شد: <a href="${url}" download="${file.name}" style="color:#2b7;">${file.name}</a>`);
      logToChatApi("user", `[فایل ارسال شد: ${file.name}]`);
    }
    fileInput.value = "";
  });
}

let mediaRecorder;
let audioChunks = [];

if (voiceBtn) {
  voiceBtn.addEventListener("click", async () => {
    if (!mediaRecorder || mediaRecorder.state === "inactive") {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorder = new MediaRecorder(stream);
        audioChunks = [];
        mediaRecorder.start();
        voiceBtn.classList.add("recording");

        mediaRecorder.ondataavailable = (e) => audioChunks.push(e.data);
        mediaRecorder.onstop = () => {
          const blob = new Blob(audioChunks, { type: "audio/webm" });
          const audioUrl = URL.createObjectURL(blob);
          appendMessage("user", `<audio controls src="${audioUrl}" style="width:100%;"></audio>`);
          logToChatApi("user", "[پیام صوتی ارسال شد]");
          voiceBtn.classList.remove("recording");
        };
      } catch (err) {
        console.error("Microphone error:", err);
        const msg = "❌ نمی‌توان به میکروفون دسترسی پیدا کرد.";
        appendMessage("bot", msg);
        logToChatApi("bot", msg);
      }
    } else {
      mediaRecorder.stop();
    }
  });
}

if (sendMessageBtn && userMessageInput) {
  sendMessageBtn.addEventListener("click", () => {
    const msg = userMessageInput.value.trim();
    if (msg) sendToN8n(msg);
  });

  userMessageInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      const msg = userMessageInput.value.trim();
      if (msg) sendToN8n(msg);
    }
  });
}

(() => {
  try {
    const input = document.getElementById("userMessage");
    if (input && !input.placeholder) input.placeholder = "پرسیدن سؤال...";
  } catch (_) {}
})();

// ================================
// 📦 Stock Check + Product Request (UPDATED)
// ================================

const stockBtn = document.getElementById("check-stock-btn");
const stockInput = document.getElementById("product-query");
const stockResult = document.getElementById("stock-result");

const outButtons = document.getElementById("stock-out-buttons");
const stockRetryBtn = document.getElementById("stock-retry-btn");
const openRequestFormBtn = document.getElementById("open-request-form-btn");

const requestPanel = document.getElementById("stock-request-panel");
const reqName = document.getElementById("req-name");
const reqPhone = document.getElementById("req-phone");
const reqBook = document.getElementById("req-book-name");
const reqAuthor = document.getElementById("req-author");
const reqSubmit = document.getElementById("submit-request-btn");

let lastProductQuery = "";

// Enter key to search
stockInput.addEventListener("keydown", e => {
  if (e.key === "Enter") {
    e.preventDefault();
    stockBtn.click();
  }
});

function resetStockFlow() {
  stockResult.style.display = "none";
  outButtons.style.display = "none";
  requestPanel.style.display = "none";
  stockBtn.style.display = "block";
  stockInput.value = "";
}

if (stockRetryBtn) {
  stockRetryBtn.addEventListener("click", resetStockFlow);
}

if (stockBtn) {
  stockBtn.addEventListener("click", async () => {
    const query = stockInput.value.trim();
    if (!query) {
      stockResult.style.display = "block";
      stockResult.innerHTML = "<p style='color:red;'>لطفاً نام محصول را وارد کنید.</p>";
      return;
    }

    lastProductQuery = query;

    stockBtn.style.display = "none";
    stockResult.style.display = "block";
    stockResult.innerHTML = "<p>در حال بررسی موجودی...</p>";

    outButtons.style.display = "none";
    requestPanel.style.display = "none";

    try {
      const res = await fetch("https://omidsj6643.app.n8n.cloud/webhook-test/chatbot-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product_query: query })
      });

      const data = await res.json();

      if (data.reply) {
        stockResult.innerHTML = `<div class="faq-box">${data.reply}</div>`;
      }

      if (data.out_of_stock === true) {
        outButtons.style.display = "block";
      }

    } catch (err) {
      console.error(err);
      stockResult.innerHTML = "<p style='color:red;'>خطا در بررسی موجودی.</p>";
      outButtons.style.display = "block";
    }
  });
}

if (openRequestFormBtn) {
  openRequestFormBtn.addEventListener("click", () => {
    // hide previous UI
    stockResult.style.display = "none";
    outButtons.style.display = "none";

    // show the request form ONLY
    requestPanel.style.display = "block";
  });
}


if (reqSubmit) {
  reqSubmit.addEventListener("click", async () => {

    const name = reqName.value.trim();
    const phone = reqPhone.value.trim();
    const book = reqBook.value.trim();
    const author = reqAuthor.value.trim();

    if (!name || !phone || !book) {
      alert("لطفاً تمام فیلدهای الزامی را کامل کنید.");
      return;
    }

    if (!/^\d{11}$/.test(phone)) {
      alert("شماره تماس باید ۱۱ رقم باشد.");
      return;
    }

    reqSubmit.disabled = true;

    try {
      const res = await fetch("https://pasdaranbc.app.n8n.cloud/webhook/product-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "register_request",
          product_query: lastProductQuery,
          customer_name: name,
          customer_phone: phone,
          book_name: book,
          author_or_translator: author
        })
      });

      await res.json();

      requestPanel.style.display = "none";
      outButtons.style.display = "none";

      stockResult.style.display = "block";
      stockResult.innerHTML = `
        <div class="success-box">
          درخواست شما با موفقیت ثبت شد.  
          منتظر تماس همکاران ما باشید. 🌿
        </div>
      `;

    } catch (err) {
      console.error(err);
      alert("خطا در ثبت درخواست.");
    }

    reqSubmit.disabled = false;
  });
}

