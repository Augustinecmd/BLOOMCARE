/**
 * BloomCare Pharmacy - AI Assistant ("BloomCare AI") Client Module
 *
 * Provides a modern floating chat widget, tool-backed medicine searches,
 * interactive product cards, direct cart actions, real-time order tracking,
 * clinical safety notices, and pharmacist escalation.
 */

import { addToCart, showToast } from "./app.js";

const STORAGE_KEY = "bloomcare_ai_chat_history_v1";
let _chatbotInstance = null;

export function openBloomCareChatbot() {
  if (_chatbotInstance) {
    _chatbotInstance.open();
  } else if (typeof document !== "undefined") {
    const win = document.getElementById("bloomcare-ai-window");
    const fab = document.getElementById("bloomcare-ai-fab");
    if (win) win.classList.remove("hidden");
    if (fab) fab.classList.add("active");
  }
}

export function closeBloomCareChatbot() {
  if (_chatbotInstance) {
    _chatbotInstance.close();
  } else if (typeof document !== "undefined") {
    const win = document.getElementById("bloomcare-ai-window");
    const fab = document.getElementById("bloomcare-ai-fab");
    if (win) win.classList.add("hidden");
    if (fab) fab.classList.remove("active");
  }
}

export function sendMessageToBloomCareAI(text) {
  if (_chatbotInstance) {
    return _chatbotInstance.sendMessage(text);
  }
  return Promise.resolve(null);
}

export function initBloomCareChatbot(options = {}) {
  const getAppProducts = options.getProducts || (() => window.STATE?.products || []);
  const getAppOrders = options.getOrders || (() => window.STATE?.orders || []);
  const getCurrentUser = options.getCurrentUser || (() => window.STATE?.currentUser || null);
  const getAppCart = options.getCart || (() => window.STATE?.cart || []);
  const openProductDetails = options.openProductDetails || ((id) => {
    if (typeof window.openProductDetailsModal === "function") {
      window.openProductDetailsModal(id);
    } else {
      const btn = document.querySelector(`[data-product-id="${id}"]`);
      btn?.click();
    }
  });
  const openOrderTracking = options.openOrderTracking || ((orderId) => {
    if (typeof window.openOrderTrackingModal === "function") {
      window.openOrderTrackingModal(orderId);
    }
  });

  // Check if widget already mounted
  if (document.getElementById("bloomcare-ai-widget-root")) return;

  // Mount HTML structure
  const root = document.createElement("div");
  root.id = "bloomcare-ai-widget-root";
  root.innerHTML = `
    <!-- Floating Trigger Button -->
    <button type="button" class="bloomcare-ai-fab" id="bloomcare-ai-fab" aria-label="Open BloomCare AI Assistant" title="Chat with BloomCare AI">
      <span class="ai-fab-pulse"></span>
      <div class="ai-fab-icon-wrap">
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
        </svg>
      </div>
      <div class="ai-fab-text-wrap">
        <span class="ai-fab-title">BloomCare AI</span>
        <span class="ai-fab-badge">Online</span>
      </div>
    </button>

    <!-- Floating Chat Window -->
    <aside class="bloomcare-ai-window hidden" id="bloomcare-ai-window" role="dialog" aria-labelledby="ai-header-title" aria-modal="true">
      <!-- Header -->
      <header class="ai-window-header">
        <div class="ai-header-left">
          <div class="ai-header-avatar-box">
            <img src="bloomcare-logo.png" alt="BloomCare Pharmacy" class="ai-header-logo" />
            <span class="ai-online-status-dot"></span>
          </div>
          <div class="ai-header-meta">
            <div class="ai-header-title-row">
              <strong id="ai-header-title" class="ai-header-name">BloomCare AI</strong>
              <span class="ai-role-tag">Pharmacy Assistant</span>
            </div>
            <span class="ai-header-status-text">● Online &bull; Licensed Dispensary</span>
          </div>
        </div>
        <div class="ai-header-actions">
          <button type="button" class="ai-h-btn" id="ai-clear-chat-btn" title="Clear Conversation" aria-label="Clear Conversation">🧹</button>
          <button type="button" class="ai-h-btn" id="ai-minimize-btn" title="Minimize Chat" aria-label="Minimize Chat">&minus;</button>
          <button type="button" class="ai-h-btn ai-close-btn" id="ai-close-btn" title="Close Chat" aria-label="Close Chat">&times;</button>
        </div>
      </header>

      <!-- Quick Action Navigation Strip -->
      <nav class="ai-quick-strip" aria-label="Chatbot Quick Topics">
        <button type="button" class="ai-quick-pill" data-ai-action="Find a medicine">🔎 Find Products</button>
        <button type="button" class="ai-quick-pill" data-ai-action="Show my cart">🛒 My Cart</button>
        <button type="button" class="ai-quick-pill" data-ai-action="Where is my order?">📦 Track Order</button>
        <button type="button" class="ai-quick-pill" data-ai-action="How do I upload a prescription?">💊 Rx Help</button>
        <button type="button" class="ai-quick-pill" data-ai-action="How much is delivery?">🚚 Delivery</button>
        <button type="button" class="ai-quick-pill" data-ai-action="Talk to a pharmacist">👨‍⚕️ Pharmacist</button>
      </nav>

      <!-- Chat Messages Scroll Area -->
      <div class="ai-messages-pane" id="ai-messages-pane" role="log" aria-live="polite">
        <!-- Messages dynamically rendered here -->
      </div>

      <!-- Typing Indicator -->
      <div class="ai-typing-indicator hidden" id="ai-typing-indicator" aria-hidden="true">
        <span class="ai-typing-dot"></span>
        <span class="ai-typing-dot"></span>
        <span class="ai-typing-dot"></span>
        <small class="ai-typing-label">BloomCare AI is typing...</small>
      </div>

      <!-- Footer Form -->
      <footer class="ai-window-footer">
        <form class="ai-input-form" id="ai-input-form">
          <input 
            type="text" 
            id="ai-user-input" 
            class="ai-input-field" 
            placeholder="Ask about medicines, orders, prices..." 
            autocomplete="off"
            aria-label="Message BloomCare AI"
          />
          <button type="submit" class="ai-send-btn" id="ai-send-btn" aria-label="Send Message" title="Send">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <line x1="22" y1="2" x2="11" y2="13"></line>
              <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
            </svg>
          </button>
        </form>
        <div class="ai-disclaimer-strip">
          <span>🌿 Informational assistant. For acute medical emergencies, call 999 or visit hospital immediately.</span>
        </div>
      </footer>
    </aside>
  `;

  document.body.appendChild(root);

  // References
  const fab = document.getElementById("bloomcare-ai-fab");
  const win = document.getElementById("bloomcare-ai-window");
  const closeBtn = document.getElementById("ai-close-btn");
  const minimizeBtn = document.getElementById("ai-minimize-btn");
  const clearBtn = document.getElementById("ai-clear-chat-btn");
  const form = document.getElementById("ai-input-form");
  const input = document.getElementById("ai-user-input");
  const messagesPane = document.getElementById("ai-messages-pane");
  const typingIndicator = document.getElementById("ai-typing-indicator");

  // State
  let messages = loadHistory();
  let isOpen = false;
  let isSending = false;

  // Render initial history or welcome message
  if (messages.length === 0) {
    appendWelcomeMessage();
  } else {
    renderAllMessages();
  }

  // Event Listeners
  fab.addEventListener("click", toggleChatWindow);
  closeBtn.addEventListener("click", () => setOpen(false));
  minimizeBtn.addEventListener("click", () => setOpen(false));
  clearBtn.addEventListener("click", clearConversation);

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const text = input.value.trim();
    if (!text || isSending) return;
    input.value = "";
    sendMessage(text);
  });

  // Delegate quick action pills and suggested chips
  document.addEventListener("click", (e) => {
    // Quick action strip pills
    const pill = e.target.closest("[data-ai-action]");
    if (pill) {
      e.preventDefault();
      const actionText = pill.dataset.aiAction;
      if (actionText) {
        if (!isOpen) setOpen(true);
        sendMessage(actionText);
      }
      return;
    }

    // Suggested question chips inside bubbles
    const chip = e.target.closest(".ai-suggested-chip");
    if (chip) {
      e.preventDefault();
      const query = chip.dataset.query || chip.textContent;
      if (query) sendMessage(query);
      return;
    }

    // Interactive product card buttons inside chat
    const addCartBtn = e.target.closest(".ai-card-add-btn");
    if (addCartBtn) {
      e.preventDefault();
      const prodId = addCartBtn.dataset.productId;
      const qty = parseInt(addCartBtn.dataset.qty || "1", 10);
      if (prodId) {
        const added = addToCart(prodId, qty);
        if (added) {
          addCartBtn.textContent = "✓ Added!";
          addCartBtn.classList.add("added");
          showToast(`Added to your cart!`, "success");
          setTimeout(() => {
            addCartBtn.textContent = "Add to Cart";
            addCartBtn.classList.remove("added");
          }, 2500);
        }
      }
      return;
    }

    const viewProdBtn = e.target.closest(".ai-card-view-btn");
    if (viewProdBtn) {
      e.preventDefault();
      const prodId = viewProdBtn.dataset.productId;
      if (prodId) {
        openProductDetails(prodId);
      }
      return;
    }

    // Order tracking card button
    const trackOrderBtn = e.target.closest(".ai-btn-track-order");
    if (trackOrderBtn) {
      e.preventDefault();
      const orderId = trackOrderBtn.dataset.orderId;
      if (orderId) {
        openOrderTracking(orderId);
      }
      return;
    }

    // Navigation triggers (prescriptions, consultations, cart, checkout)
    const navBtn = e.target.closest("[data-ai-nav]");
    if (navBtn) {
      e.preventDefault();
      const route = navBtn.dataset.aiNav;
      if (route === "view_cart") {
        document.getElementById("open-cart-btn")?.click();
      } else if (typeof window.navigateTo === "function") {
        window.navigateTo(route);
      }
      return;
    }
  });

  function toggleChatWindow() {
    setOpen(!isOpen);
  }

  function setOpen(open) {
    isOpen = open;
    win.classList.toggle("hidden", !isOpen);
    fab.classList.toggle("active", isOpen);
    if (isOpen) {
      scrollToBottom();
      setTimeout(() => input.focus(), 200);
    }
  }

  function appendWelcomeMessage() {
    const currentUser = getCurrentUser();
    const name = currentUser?.displayName || currentUser?.name || "";
    const greeting = name ? `Hello ${escapeHtml(name)} 👋` : `Hello 👋`;

    const welcomeMsg = {
      id: "welcome-" + Date.now(),
      sender: "ai",
      text: `${greeting} I'm **BloomCare AI**, your licensed pharmacy assistant.\n\nI can help you find authentic medications, check stock and prices, explain our prescription review process, or track your delivery across Mbarara City.\n\nHow can I help you today?`,
      timestamp: Date.now(),
      suggestedQuestions: [
        "Find a medicine",
        "Recommend a product",
        "Where is my order?",
        "How do I upload a prescription?",
        "Talk to a pharmacist"
      ]
    };
    messages = [welcomeMsg];
    saveHistory(messages);
    renderAllMessages();
  }

  function clearConversation() {
    if (confirm("Are you sure you want to clear your conversation with BloomCare AI?")) {
      messages = [];
      localStorage.removeItem(STORAGE_KEY);
      appendWelcomeMessage();
    }
  }

  async function sendMessage(userText) {
    if (!userText.trim()) return;

    // 1. Append user message
    const userMsg = {
      id: "user-" + Date.now(),
      sender: "user",
      text: userText,
      timestamp: Date.now()
    };
    messages.push(userMsg);
    saveHistory(messages);
    renderMessage(userMsg);
    scrollToBottom();

    // 2. Show typing indicator
    isSending = true;
    typingIndicator.classList.remove("hidden");
    scrollToBottom();

    try {
      // 3. Call secure backend endpoint
      const apiHost = getApiBaseUrl();
      const payload = {
        message: userText,
        history: messages.slice(-10),
        products: getAppProducts().slice(0, 80),
        orders: getAppOrders(),
        currentUser: getCurrentUser(),
        cart: getAppCart()
      };

      let aiResponse = null;

      try {
        const res = await fetch(`${apiHost}/api/ai/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        if (res.ok) {
          const data = await res.json();
          if (data && data.success) {
            aiResponse = data;
          }
        }
      } catch (networkErr) {
        console.warn("[BloomCare AI] Remote API unreachable, invoking client-side safety & catalog engine:", networkErr?.message);
      }

      // 4. If backend was unreachable or errored, use client-side safety & catalog fallback
      if (!aiResponse) {
        aiResponse = executeClientFallback(userText, payload.products, payload.orders, payload.currentUser, payload.cart);
      }

      // 5. Append Assistant Response
      const assistantMsg = {
        id: "ai-" + Date.now(),
        sender: "ai",
        text: aiResponse.text || "I'm here to assist you with BloomCare Pharmacy.",
        products: aiResponse.products || [],
        quickActions: aiResponse.quickActions || [],
        isSafetyAlert: Boolean(aiResponse.isSafetyAlert),
        timestamp: Date.now()
      };

      messages.push(assistantMsg);
      saveHistory(messages);
      renderMessage(assistantMsg);
    } catch (err) {
      console.error("[BloomCare AI] Chatbot processing error:", err);
      const errorMsg = {
        id: "error-" + Date.now(),
        sender: "ai",
        text: "BloomCare AI is temporarily experiencing connection difficulty.\n\nOur team is available immediately on our Care Desk:",
        quickActions: [
          { label: "💬 WhatsApp Support", action: "whatsapp", value: "https://wa.me/256750210886" },
          { label: "📞 Call +256 700 000 000", action: "call_phone", value: "+256700000000" }
        ],
        timestamp: Date.now()
      };
      messages.push(errorMsg);
      saveHistory(messages);
      renderMessage(errorMsg);
    } finally {
      isSending = false;
      typingIndicator.classList.add("hidden");
      scrollToBottom();
    }
  }

  function getApiBaseUrl() {
    if (typeof window !== "undefined" && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")) {
      return "http://127.0.0.1:8787";
    }
    return "";
  }

  function renderAllMessages() {
    messagesPane.innerHTML = "";
    messages.forEach(renderMessage);
    scrollToBottom();
  }

  function renderMessage(msg) {
    const isUser = msg.sender === "user";
    const bubble = document.createElement("div");
    bubble.className = `ai-msg-row ${isUser ? "ai-msg-user" : "ai-msg-assistant"}`;
    bubble.id = msg.id;

    let timeStr = "";
    if (msg.timestamp) {
      const d = new Date(msg.timestamp);
      timeStr = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    }

    let innerHtml = `
      <div class="ai-msg-bubble ${msg.isSafetyAlert ? "ai-safety-alert" : ""}">
        ${!isUser ? `
          <div class="ai-bubble-header">
            <span class="ai-bubble-badge">🌿 BloomCare AI</span>
          </div>
        ` : ""}
        <div class="ai-bubble-text">${formatMarkdownLite(msg.text)}</div>
        
        <!-- Interactive Product Cards Grid inside message -->
        ${(msg.products && msg.products.length > 0) ? `
          <div class="ai-products-grid">
            ${msg.products.map(renderProductCardHtml).join("")}
          </div>
        ` : ""}

        <!-- Quick Action Buttons inside message -->
        ${(msg.quickActions && msg.quickActions.length > 0) ? `
          <div class="ai-bubble-actions">
            ${msg.quickActions.map(renderActionBtnHtml).join("")}
          </div>
        ` : ""}

        <!-- Suggested Follow-up Question Chips -->
        ${(msg.suggestedQuestions && msg.suggestedQuestions.length > 0) ? `
          <div class="ai-suggested-chips-wrap">
            <span class="ai-chips-label">Suggested:</span>
            <div class="ai-chips-list">
              ${msg.suggestedQuestions.map(q => `<button type="button" class="ai-suggested-chip" data-query="${escapeHtml(q)}">${escapeHtml(q)}</button>`).join("")}
            </div>
          </div>
        ` : ""}

        <div class="ai-msg-timestamp">${timeStr}</div>
      </div>
    `;

    bubble.innerHTML = innerHtml;
    messagesPane.appendChild(bubble);
  }

  function renderProductCardHtml(p) {
    if (!p) return "";
    const inStock = intVal(p.stockQuantity) > 0;
    const priceStr = formatUGX(p.price);
    const imgUrl = p.imageUrl || p.image || "bloomcare-logo.svg";

    return `
      <div class="ai-product-card" data-card-prod-id="${escapeHtml(p.id)}">
        <div class="ai-card-thumb-wrap">
          <img 
            src="${escapeHtml(imgUrl)}" 
            alt="${escapeHtml(p.name)}" 
            class="ai-card-thumb-img" 
            onerror="this.src='bloomcare-logo.svg'"
          />
          ${p.requiresPrescription ? `<span class="ai-rx-badge" title="Prescription Required">Rx</span>` : ""}
        </div>
        <div class="ai-card-details">
          <strong class="ai-card-name" title="${escapeHtml(p.name)}">${escapeHtml(p.name)}</strong>
          <div class="ai-card-meta-row">
            <span class="ai-card-price">${priceStr}</span>
            <span class="ai-stock-pill ${inStock ? 'in-stock' : 'out-of-stock'}">
              ${inStock ? `✓ ${p.stockQuantity} in stock` : 'Out of stock'}
            </span>
          </div>
          <div class="ai-card-actions-row">
            <button type="button" class="btn btn-outline btn-xs ai-card-view-btn" data-product-id="${escapeHtml(p.id)}">
              View
            </button>
            <button 
              type="button" 
              class="btn btn-primary btn-xs ai-card-add-btn" 
              data-product-id="${escapeHtml(p.id)}"
              data-qty="1"
              ${!inStock ? "disabled" : ""}
            >
              ${inStock ? "Add to Cart" : "Unavailable"}
            </button>
          </div>
        </div>
      </div>
    `;
  }

  function renderActionBtnHtml(act) {
    if (!act) return "";
    const label = escapeHtml(act.label || "Action");
    const action = act.action;
    const val = act.value;

    if (action === "whatsapp") {
      return `
        <a href="${escapeHtml(val || 'https://wa.me/256750210886')}" target="_blank" rel="noopener noreferrer" class="btn btn-sm btn-whatsapp ai-action-link">
          <span>💬</span>
          <span>${label}</span>
        </a>
      `;
    }

    if (action === "call_phone") {
      return `
        <a href="tel:${escapeHtml(val || '+256700000000')}" class="btn btn-sm btn-call ai-action-link">
          <span>📞</span>
          <span>${label}</span>
        </a>
      `;
    }

    if (action === "track_order") {
      return `
        <button type="button" class="btn btn-primary btn-sm ai-btn-track-order" data-order-id="${escapeHtml(val || '')}">
          <span>📍</span>
          <span>${label}</span>
        </button>
      `;
    }

    if (action === "view_cart") {
      return `
        <button type="button" class="btn btn-outline btn-sm" data-ai-nav="view_cart">
          <span>🛒</span>
          <span>${label}</span>
        </button>
      `;
    }

    if (action === "navigate") {
      return `
        <button type="button" class="btn btn-outline btn-sm" data-ai-nav="${escapeHtml(val || 'medicines')}">
          <span>${label}</span>
        </button>
      `;
    }

    if (action === "suggest") {
      return `
        <button type="button" class="ai-suggested-chip" data-query="${escapeHtml(val || label)}">
          <span>${label}</span>
        </button>
      `;
    }

    return `
      <button type="button" class="btn btn-secondary btn-sm" data-ai-action="${escapeHtml(val || label)}">
        <span>${label}</span>
      </button>
    `;
  }

  function scrollToBottom() {
    requestAnimationFrame(() => {
      messagesPane.scrollTop = messagesPane.scrollHeight;
    });
  }

  function loadHistory() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = jsonParseSafe(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.slice(-30);
        }
      }
    } catch (_) {}
    return [];
  }

  function saveHistory(hist) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(hist.slice(-30)));
    } catch (_) {}
  }

  // -------------------------------------------------------------
  // CLIENT-SIDE DETERMINISTIC FALLBACK (For offline / keyless safety)
  // -------------------------------------------------------------
  function executeClientFallback(text, products, orders, currentUser, cart) {
    const lower = text.toLowerCase();
    const userId = currentUser?.uid || currentUser?.email || "";

    // Emergency red-flag
    if (/\b(chest\s+pain|heart\s+attack|shortness\s+of\s+breath|can'?t\s+breathe|severe\s+difficulty\s+breathing|stroke|suicid|kill\s+myself|overdose|poison)\b/i.test(text)) {
      return {
        text: "⚠️ **MEDICAL EMERGENCY ALERT**\n\nThe symptoms you described may indicate an urgent medical emergency. **BloomCare AI is an informational pharmacy assistant and cannot diagnose conditions.**\n\n🚨 **Please seek immediate emergency hospital care at Mbarara Regional Referral Hospital or contact urgent services immediately.**",
        products: [],
        isSafetyAlert: true,
        quickActions: [
          { label: "📞 Call Dispensary", action: "call_phone", value: "+256700000000" },
          { label: "💬 WhatsApp Care Desk", action: "whatsapp", value: "https://wa.me/256750210886?text=URGENT%20Medical%20Emergency%20Inquiry" }
        ]
      };
    }

    // Prescription bypass guardrail
    if (/\b(without\s+(a\s+)?prescription|bypass\s+prescription|skip\s+prescription|no\s+doctor\s+note|fake\s+prescription)\b/i.test(text)) {
      return {
        text: "🛡️ **Prescription Verification Policy**\n\nUnder Uganda National Drug Authority (NDA) regulations, prescription medications strictly require clinical verification by a registered pharmacist.\n\nYou can upload your doctor's prescription during checkout or consult our pharmacist directly.",
        products: [],
        quickActions: [
          { label: "💊 Upload Prescription", action: "navigate", value: "prescriptions" },
          { label: "🩺 Consult Pharmacist", action: "navigate", value: "consultations" }
        ]
      };
    }

    // Order tracking
    if (lower.includes("order") && (lower.includes("where") || lower.includes("track") || lower.includes("status"))) {
      if (!userId) {
        return {
          text: "Please log in to your BloomCare account to view and track your orders.",
          products: [],
          quickActions: [{ label: "🔑 Log In", action: "navigate", value: "auth" }]
        };
      }
      const myOrders = (orders || []).filter(o => (o.customerId === userId || o.customerEmail === userId));
      if (myOrders.length === 0) {
        return {
          text: "You do not have any active orders right now. Would you like to explore our medicine catalog?",
          products: [],
          quickActions: [{ label: "💊 Browse Medicines", action: "navigate", value: "medicines" }]
        };
      }
      const latest = myOrders[0];
      const oNum = latest.orderNumber || latest.id;
      return {
        text: `I found your latest order **#${oNum}**!\n\n• **Status:** ${latest.orderStatus || 'Confirmed'}\n• **Total:** ${formatUGX(latest.total)}\n• **Packaging:** Official BloomCare tamper-evident paper bag`,
        products: [],
        quickActions: [
          { label: `📍 Track Order #${oNum}`, action: "track_order", value: oNum },
          { label: "📦 View All Orders", action: "navigate", value: "orders" }
        ]
      };
    }

    // Delivery query
    if (lower.includes("delivery") && (lower.includes("fee") || lower.includes("cost") || lower.includes("how much") || lower.includes("fast"))) {
      return {
        text: "🚚 **BloomCare Express Delivery Information**\n\n• **Delivery Fee:** UGX 5,000 flat rate across Mbarara City.\n• **Delivery Time:** Express 10–15 minutes.\n• **Packaging:** Official tamper-evident branded paper bag.\n• **Cold-Chain:** Handled under validated 2°C – 8°C standards where required.",
        products: [],
        quickActions: [
          { label: "💊 Order Medicines", action: "navigate", value: "medicines" }
        ]
      };
    }

    // Product search
    const tokens = lower.split(/\s+/).filter(w => w.length > 2 && !["what", "have", "with", "from", "show", "tell", "much", "does", "this", "that"].includes(w));
    const matched = (products || []).filter(p => {
      if (!p || p.status === "inactive" || p.deleted) return false;
      const name = (p.name || "").toLowerCase();
      const generic = (p.genericName || "").toLowerCase();
      const cat = (p.category || "").toLowerCase();
      return tokens.some(t => name.includes(t) || generic.includes(t) || cat.includes(t));
    }).slice(0, 4);

    if (matched.length > 0) {
      return {
        text: `Here are authentic BloomCare dispensary products matching your query:`,
        products: matched,
        quickActions: [
          { label: "🛒 View Cart", action: "view_cart" },
          { label: "💊 View Full Catalog", action: "navigate", value: "medicines" }
        ]
      };
    }

    // Default friendly assistant response
    return {
      text: "I'm **BloomCare AI**, your pharmacy assistant. I can help you search medicines, check stock and prices, explain prescriptions, or track your orders.\n\nWhat can I assist you with?",
      products: (products || []).filter(p => (p.name || "").toLowerCase().includes("paracetamol")).slice(0, 2),
      quickActions: [
        { label: "🔎 Find a Medicine", action: "suggest", value: "Find a medicine" },
        { label: "⭐ Recommended Products", action: "suggest", value: "Recommend products for me" },
        { label: "📦 Track Order", action: "suggest", value: "Where is my order?" },
        { label: "👨‍⚕️ Speak to Pharmacist", action: "suggest", value: "Talk to a pharmacist" }
      ]
    };
  }

  _chatbotInstance = {
    open: () => setOpen(true),
    close: () => setOpen(false),
    sendMessage: (txt) => sendMessage(txt)
  };
}

// -------------------------------------------------------------
// FORMATTING UTILITIES
// -------------------------------------------------------------
function formatMarkdownLite(str) {
  if (!str) return "";
  let out = escapeHtml(str);
  // Bold **text**
  out = out.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  // Italic *text*
  out = out.replace(/\*(.+?)\*/g, "<em>$1</em>");
  // Newlines to <br />
  out = out.replace(/\n/g, "<br />");
  return out;
}

function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatUGX(val) {
  const num = Math.round(Number(val) || 0);
  return `UGX ${num.toLocaleString("en-UG")}`;
}

function intVal(val) {
  const n = parseInt(val, 10);
  return isNaN(n) ? 0 : n;
}

function jsonParseSafe(raw) {
  try {
    return JSON.parse(raw);
  } catch (_) {
    return null;
  }
}
