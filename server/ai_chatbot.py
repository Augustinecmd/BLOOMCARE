"""BloomCare Pharmacy Management System - AI Assistant & Chatbot Engine.

Provides secure, tool-based, medically safe conversational intelligence for BloomCare customers.
Supports Gemini API, OpenAI API, and an offline deterministic clinical NLP fallback engine.
"""
from __future__ import annotations

import json
import os
import re
import time
import urllib.request
import urllib.error
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

DATA_DIR = Path(__file__).parent / "data"
KNOWLEDGE_FILE = DATA_DIR / "ai_knowledge.json"
ANALYTICS_FILE = DATA_DIR / "ai_analytics.json"
DELIVERIES_FILE = DATA_DIR / "deliveries.json"
ASSIGNMENTS_FILE = DATA_DIR / "delivery_assignments.json"

EMERGENCY_PATTERNS = [
    re.compile(r"\b(chest\s+pain|heart\s+attack|shortness\s+of\s+breath|can'?t\s+breathe|severe\s+difficulty\s+breathing)\b", re.I),
    re.compile(r"\b(stroke|face\s+droop|slurred\s+speech|sudden\s+paralysis|sudden\s+numbness)\b", re.I),
    re.compile(r"\b(suicid|kill\s+myself|end\s+my\s+life|self[- ]harm)\b", re.I),
    re.compile(r"\b(overdose|swallowed\s+poison|poisoning|bleeding\s+uncontrollably)\b", re.I),
    re.compile(r"\b(anaphylaxis|throat\s+closing|severe\s+allergic\s+reaction)\b", re.I),
]

PRESCRIPTION_BYPASS_PATTERNS = [
    re.compile(r"\b(without\s+(a\s+)?prescription|bypass\s+prescription|skip\s+prescription|no\s+doctor\s+note|fake\s+prescription)\b", re.I),
]


def load_knowledge_base() -> Dict[str, Any]:
    if not KNOWLEDGE_FILE.exists():
        return {}
    try:
        with open(KNOWLEDGE_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return {}


def load_analytics() -> Dict[str, Any]:
    if not ANALYTICS_FILE.exists():
        return {
            "totalConversations": 0,
            "todayConversations": 0,
            "lastResetDate": datetime.now().strftime("%Y-%m-%d"),
            "productSearches": 0,
            "successfulRecommendations": 0,
            "cartAdditions": 0,
            "escalationsToPharmacists": 0,
            "unansweredQuestions": 0,
            "topAskedQuestions": {},
            "recentEvents": [],
        }
    try:
        with open(ANALYTICS_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return {}


def save_analytics(data: Dict[str, Any]) -> None:
    try:
        with open(ANALYTICS_FILE, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2)
    except Exception:
        pass


def record_analytics_event(event_type: str, query: str = "", details: Optional[Dict[str, Any]] = None) -> None:
    analytics = load_analytics()
    today = datetime.now().strftime("%Y-%m-%d")
    if analytics.get("lastResetDate") != today:
        analytics["todayConversations"] = 0
        analytics["lastResetDate"] = today

    if event_type == "conversation":
        analytics["totalConversations"] = analytics.get("totalConversations", 0) + 1
        analytics["todayConversations"] = analytics.get("todayConversations", 0) + 1
    elif event_type == "search":
        analytics["productSearches"] = analytics.get("productSearches", 0) + 1
    elif event_type == "recommendation":
        analytics["successfulRecommendations"] = analytics.get("successfulRecommendations", 0) + 1
    elif event_type == "cart_add":
        analytics["cartAdditions"] = analytics.get("cartAdditions", 0) + 1
    elif event_type == "escalation":
        analytics["escalationsToPharmacists"] = analytics.get("escalationsToPharmacists", 0) + 1
    elif event_type == "unanswered":
        analytics["unansweredQuestions"] = analytics.get("unansweredQuestions", 0) + 1

    if query:
        clean_q = query.strip()[:60].lower()
        top_qs = analytics.setdefault("topAskedQuestions", {})
        top_qs[clean_q] = top_qs.get(clean_q, 0) + 1

    recent = analytics.setdefault("recentEvents", [])
    recent.insert(0, {
        "type": event_type,
        "query": query[:100],
        "timestamp": datetime.now().isoformat(),
        "details": details or {},
    })
    analytics["recentEvents"] = recent[:50]
    save_analytics(analytics)


# -------------------------------------------------------------
# TOOL DEFINITIONS & CONTROLLED EXECUTION
# -------------------------------------------------------------

def tool_search_products(products: List[Dict[str, Any]], query: str, category: Optional[str] = None, in_stock_only: bool = False, limit: int = 5) -> List[Dict[str, Any]]:
    tokens = [t.lower() for t in re.findall(r"\w+", query) if len(t) > 2]
    results = []

    for p in products:
        if not isinstance(p, dict) or p.get("status") == "inactive" or p.get("deleted"):
            continue
        if in_stock_only and int(p.get("stockQuantity", 0)) <= 0:
            continue

        p_cat = str(p.get("category", "")).lower()
        if category and category.lower() not in p_cat:
            continue

        p_name = str(p.get("name", "")).lower()
        p_generic = str(p.get("genericName", "")).lower()
        p_brand = str(p.get("brand", "")).lower()
        p_desc = str(p.get("description", "")).lower()

        score = 0
        if query.lower() in p_name:
            score += 10
        elif any(t in p_name for t in tokens):
            score += 6
        if any(t in p_generic for t in tokens):
            score += 5
        if any(t in p_brand for t in tokens):
            score += 4
        if any(t in p_desc for t in tokens):
            score += 2

        if score > 0 or not tokens:
            results.append((score, p))

    results.sort(key=lambda x: (x[0], int(x[1].get("stockQuantity", 0))), reverse=True)
    return [p for _, p in results[:limit]]


def tool_check_product_stock(products: List[Dict[str, Any]], product_id_or_name: str) -> Optional[Dict[str, Any]]:
    target = product_id_or_name.lower().strip()
    for p in products:
        if str(p.get("id", "")).lower() == target or target in str(p.get("name", "")).lower():
            return {
                "id": p.get("id"),
                "name": p.get("name"),
                "price": p.get("price"),
                "stockQuantity": p.get("stockQuantity", 0),
                "inStock": int(p.get("stockQuantity", 0)) > 0,
                "requiresPrescription": bool(p.get("requiresPrescription")),
            }
    return None


def tool_get_customer_orders(orders: List[Dict[str, Any]], current_user_id: str, order_ref: Optional[str] = None) -> List[Dict[str, Any]]:
    if not current_user_id:
        return []

    matched = []
    for o in orders:
        c_id = str(o.get("customerId") or o.get("customerEmail") or "")
        if c_id != current_user_id:
            continue

        if order_ref:
            o_num = str(o.get("orderNumber") or o.get("id") or "").lower()
            if order_ref.lower() in o_num:
                matched.append(o)
        else:
            matched.append(o)

    matched.sort(key=lambda x: str(x.get("createdAt", "")), reverse=True)
    return matched[:5]


def tool_get_bloomcare_faq(topic: str) -> Optional[str]:
    kb = load_knowledge_base()
    topic_tokens = set(re.findall(r"\w+", topic.lower()))

    for faq in kb.get("faqs", []):
        keywords = set(faq.get("keywords", []))
        if keywords.intersection(topic_tokens):
            return f"**{faq.get('question')}**\n\n{faq.get('answer')}"

    return None


# -------------------------------------------------------------
# MEDICAL SAFETY & CLINICAL GUARDRAILS
# -------------------------------------------------------------

def evaluate_medical_safety(message: str, knowledge: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    # 1. Emergency red-flag symptoms
    for pattern in EMERGENCY_PATTERNS:
        if pattern.search(message):
            pharm = knowledge.get("pharmacy", {})
            phone = pharm.get("phone", "+256 700 000 000")
            whatsapp = pharm.get("whatsapp", "256750210886")
            return {
                "text": (
                    "⚠️ **MEDICAL EMERGENCY ALERT**\n\n"
                    "The symptoms you described may indicate a serious or life-threatening medical emergency. "
                    "**BloomCare AI is an online pharmacy assistant and cannot diagnose conditions or manage emergencies.**\n\n"
                    "🚨 **Immediate Action Required:**\n"
                    "1. Please seek immediate in-person emergency care at the nearest hospital (such as **Mbarara Regional Referral Hospital**).\n"
                    f"2. Contact local emergency medical services or call BloomCare Urgent Support at **{phone}**.\n\n"
                    "Do not wait for an online medicine delivery for severe, sudden, or life-threatening symptoms."
                ),
                "isEmergency": True,
                "quickActions": [
                    {"label": "🚨 Emergency Contacts", "action": "emergency_contacts"},
                    {"label": "📞 Call Pharmacy: " + phone, "action": "call_phone", "value": phone},
                    {"label": "💬 WhatsApp Care Desk", "action": "whatsapp", "value": f"https://wa.me/{whatsapp}?text=URGENT%20Medical%20Inquiry"},
                ],
            }

    # 2. Prescription bypass attempt
    for pattern in PRESCRIPTION_BYPASS_PATTERNS:
        if pattern.search(message):
            return {
                "text": (
                    "🛡️ **Prescription Verification Policy**\n\n"
                    "BloomCare Pharmacy strictly complies with National Drug Authority (NDA) Uganda regulations. "
                    "**Prescription medicines (Rx) cannot be dispensed without a verified, legitimate prescription from a registered medical practitioner.**\n\n"
                    "**How to order prescription medications:**\n"
                    "1. Add the medicine to your order.\n"
                    "2. During checkout, upload a clear photo or PDF scan of your doctor's prescription.\n"
                    "3. A registered BloomCare pharmacist will clinically review and approve the prescription before dispensing."
                ),
                "isEmergency": False,
                "quickActions": [
                    {"label": "💊 Upload Prescription", "action": "navigate", "value": "prescriptions"},
                    {"label": "🩺 Consult a Pharmacist", "action": "navigate", "value": "consultations"},
                ],
            }

    return None


# -------------------------------------------------------------
# CORE CHATBOT LOGIC (HYBRID ENGINE)
# -------------------------------------------------------------

def process_ai_chat_message(payload: Dict[str, Any]) -> Dict[str, Any]:
    """Processes a chat request using configured AI provider or clinical rule-based engine."""
    message = str(payload.get("message", "")).strip()
    history = payload.get("history", [])
    products = payload.get("products", [])
    orders = payload.get("orders", [])
    current_user = payload.get("currentUser") or {}
    cart = payload.get("cart", [])

    user_id = current_user.get("uid") or current_user.get("email") or ""
    user_name = current_user.get("displayName") or current_user.get("name") or "Valued Customer"

    knowledge = load_knowledge_base()

    if not message:
        return {
            "text": f"Hello {user_name}! 👋 I'm BloomCare AI, your licensed pharmacy assistant. How can I help you today?",
            "products": [],
            "quickActions": [
                {"label": "🔎 Find a Medicine", "action": "suggest", "value": "Find a medicine"},
                {"label": "⭐ Recommended Products", "action": "suggest", "value": "Recommend products for me"},
                {"label": "📦 Track My Order", "action": "suggest", "value": "Where is my order?"},
                {"label": "💊 Prescription Help", "action": "suggest", "value": "How do I upload a prescription?"},
                {"label": "👨‍⚕️ Talk to a Pharmacist", "action": "suggest", "value": "I want to talk to a pharmacist"},
            ],
        }

    # Record conversation analytics
    record_analytics_event("conversation", message)

    # 1. Medical Safety Check
    safety_response = evaluate_medical_safety(message, knowledge)
    if safety_response:
        record_analytics_event("escalation", message, {"reason": "safety_check"})
        return {
            "text": safety_response["text"],
            "products": [],
            "quickActions": safety_response.get("quickActions", []),
            "isSafetyAlert": True,
        }

    # 2. Try External LLM if configured
    gemini_key = os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")
    openai_key = os.environ.get("OPENAI_API_KEY")

    if gemini_key:
        try:
            llm_res = call_gemini_provider(message, history, products, orders, current_user, knowledge, gemini_key)
            if llm_res:
                return llm_res
        except Exception as e:
            print(f"[BloomCare AI] Gemini provider error: {e}")

    if openai_key:
        try:
            llm_res = call_openai_provider(message, history, products, orders, current_user, knowledge, openai_key)
            if llm_res:
                return llm_res
        except Exception as e:
            print(f"[BloomCare AI] OpenAI provider error: {e}")

    # 3. Deterministic Healthcare NLP & Tool Engine (Always available, 0% hallucination)
    return execute_deterministic_engine(message, products, orders, current_user, cart, knowledge)


def execute_deterministic_engine(message: str, products: List[Dict[str, Any]], orders: List[Dict[str, Any]], current_user: Dict[str, Any], cart: List[Dict[str, Any]], knowledge: Dict[str, Any]) -> Dict[str, Any]:
    msg_lower = message.lower()
    user_id = current_user.get("uid") or current_user.get("email") or ""
    user_name = current_user.get("displayName") or current_user.get("name") or "Valued Customer"
    pharm = knowledge.get("pharmacy", {})
    deliv = knowledge.get("delivery", {})

    # Intent A: Pharmacist Escalation
    if any(k in msg_lower for k in ["talk to a pharmacist", "consult pharmacist", "human", "speak with pharmacist", "speak to pharmacist", "contact doctor"]):
        record_analytics_event("escalation", message)
        whatsapp = pharm.get("whatsapp", "256750210886")
        phone = pharm.get("phone", "+256 700 000 000")
        return {
            "text": (
                f"I'm connecting you directly to our registered clinical team! 🩺\n\n"
                f"**BloomCare Clinical Care Desk:**\n"
                f"• **Lead Pharmacist:** Dr. Amina Nanyonga & Clinical Team\n"
                f"• **Phone Support:** {phone}\n"
                f"• **WhatsApp Care Desk:** 0750210886\n"
                f"• **Location:** {pharm.get('location')}\n\n"
                "You can chat instantly on WhatsApp or book a 1-on-1 private consultation below:"
            ),
            "products": [],
            "quickActions": [
                {"label": "💬 Chat on WhatsApp", "action": "whatsapp", "value": f"https://wa.me/{whatsapp}?text=Hello%20BloomCare%20Pharmacist%2C%20I%20need%20medication%20guidance"},
                {"label": "🩺 Book Consultation", "action": "navigate", "value": "consultations"},
                {"label": "📞 Call Dispensary", "action": "call_phone", "value": phone},
            ],
        }

    # Intent B: Order Tracking
    if any(k in msg_lower for k in ["where is my order", "track order", "track my order", "order status", "my order"]):
        if not user_id:
            return {
                "text": "To track your order status and view courier details, please sign in to your BloomCare account.",
                "products": [],
                "quickActions": [
                    {"label": "🔑 Log In", "action": "navigate", "value": "auth"},
                    {"label": "📦 View General Order Info", "action": "suggest", "value": "How does order delivery work?"},
                ],
            }

        user_orders = tool_get_customer_orders(orders, user_id)
        if not user_orders:
            return {
                "text": f"Welcome, {user_name}. You don't have any active orders right now. Would you like to explore our medicine catalog?",
                "products": [],
                "quickActions": [
                    {"label": "💊 Browse Medicines", "action": "navigate", "value": "medicines"},
                    {"label": "⭐ Recommended for You", "action": "suggest", "value": "Recommend products for me"},
                ],
            }

        latest = user_orders[0]
        o_num = latest.get("orderNumber") or latest.get("id")
        status = latest.get("orderStatus", "Confirmed")
        items = latest.get("items", [])
        driver = latest.get("assignedStaff") or "Dispatch in progress"

        item_names = ", ".join([f"{i.get('quantity', 1)}x {i.get('name')}" for i in items[:3]])

        status_emojis = {
            "Placed": "📝 Order Placed",
            "Confirmed": "✅ Order Confirmed",
            "Processing": "📦 Preparing in Dispensary",
            "Out for Delivery": "🚚 Out for Delivery",
            "Delivered": "🎉 Successfully Delivered",
            "Cancelled": "❌ Cancelled",
        }
        status_text = status_emojis.get(status, status)

        return {
            "text": (
                f"I found your latest order **#{o_num}**:\n\n"
                f"• **Status:** {status_text}\n"
                f"• **Items:** {item_names}\n"
                f"• **Total:** UGX {int(latest.get('total', 0)):,}\n"
                f"• **Courier:** {driver}\n"
                f"• **Packaging:** Official BloomCare tamper-evident paper bag\n\n"
                "Click below to open the live 6-stage tracker or message your courier:"
            ),
            "products": [],
            "quickActions": [
                {"label": f"📍 Track Order #{o_num}", "action": "track_order", "value": o_num},
                {"label": "📦 All Orders", "action": "navigate", "value": "orders"},
            ],
        }

    # Intent C: Delivery Information
    if any(k in msg_lower for k in ["delivery fee", "delivery cost", "how much is delivery", "how fast", "shipping fee", "delivery time"]):
        record_analytics_event("search", message)
        return {
            "text": (
                f"🚚 **BloomCare Express Delivery Information**\n\n"
                f"• **Delivery Fee:** {deliv.get('feeFormatted', 'UGX 5,000')} flat rate across Mbarara City.\n"
                f"• **Delivery Speed:** {deliv.get('speed', '10–15 minutes')}.\n"
                f"• **Coverage Areas:** {deliv.get('coverage')}.\n"
                f"• **Packaging:** {deliv.get('packaging')}\n\n"
                "Orders are handled with validated cold-chain standards where required."
            ),
            "products": [],
            "quickActions": [
                {"label": "💊 Order Medicines", "action": "navigate", "value": "medicines"},
                {"label": "📍 Check Delivery Areas", "action": "navigate", "value": "dashboard"},
            ],
        }

    # Intent D: Prescription Upload Guidance
    if any(k in msg_lower for k in ["how do i upload", "upload prescription", "doctor note", "prescription help", "submit prescription"]):
        return {
            "text": (
                "💊 **How to Order Prescription Medicines at BloomCare:**\n\n"
                "1. **Add Medicine to Cart:** Select your required medication.\n"
                "2. **Upload Scan:** At checkout, tap **'Upload Prescription'** to attach a photo or PDF.\n"
                "3. **Clinical Review:** A licensed BloomCare pharmacist checks dosage, drug interactions, and validity.\n"
                "4. **Fast Dispatch:** Once approved, your medication is prepared in our official dispensary bag and delivered to your doorstep."
            ),
            "products": [],
            "quickActions": [
                {"label": "📄 Upload Prescription Now", "action": "navigate", "value": "prescriptions"},
                {"label": "🩺 Ask a Pharmacist", "action": "navigate", "value": "consultations"},
            ],
        }

    # Intent E: Cart Assistance
    if any(k in msg_lower for k in ["my cart", "view cart", "show cart", "what is in my cart"]):
        if not cart:
            return {
                "text": "Your shopping cart is currently empty. Can I help you find pain relief, vitamins, or family health supplies?",
                "products": [],
                "quickActions": [
                    {"label": "💊 Browse Catalog", "action": "navigate", "value": "medicines"},
                    {"label": "🌿 Vitamin & Wellness", "action": "suggest", "value": "Show me vitamins"},
                ],
            }
        total = sum(int(item.get("price", 0)) * int(item.get("quantity", 1)) for item in cart)
        cart_summary = "\n".join([f"• {item.get('quantity')}x **{item.get('name')}** (UGX {int(item.get('price', 0)):,})" for item in cart])
        return {
            "text": (
                f"🛒 **Your BloomCare Shopping Cart:**\n\n"
                f"{cart_summary}\n\n"
                f"**Subtotal:** UGX {total:,}\n"
                "You can review your items or proceed directly to checkout:"
            ),
            "products": [],
            "quickActions": [
                {"label": "🛒 View Full Cart", "action": "view_cart"},
                {"label": "💳 Proceed to Checkout", "action": "navigate", "value": "checkout"},
            ],
        }

    # Intent F: Direct Add-to-Cart Voice/Chat Command
    add_match = re.search(r"\badd\s+(\d+)?\s*(?:x\s*)?([a-z0-9\s]+?)\s*(?:to\s+(?:my\s+)?cart)?$", msg_lower)
    if add_match and any(w in msg_lower for w in ["add", "cart"]):
        qty_str, item_query = add_match.groups()
        quantity = int(qty_str) if qty_str else 1
        item_query = item_query.replace("to my cart", "").replace("to cart", "").strip()

        matched_products = tool_search_products(products, item_query, in_stock_only=True, limit=1)
        if matched_products:
            prod = matched_products[0]
            stock = int(prod.get("stockQuantity", 0))
            if quantity > stock:
                return {
                    "text": f"I found **{prod.get('name')}**, but only **{stock}** units are currently available in stock.",
                    "products": [prod],
                    "quickActions": [
                        {"label": f"Add {stock} to Cart", "action": "add_cart", "value": prod.get("id"), "quantity": stock},
                        {"label": "View Product", "action": "view_product", "value": prod.get("id")},
                    ],
                }

            record_analytics_event("cart_add", item_query, {"product": prod.get("name"), "qty": quantity})
            return {
                "text": f"I found **{prod.get('name')}**! Click below to confirm adding {quantity} unit(s) to your cart:",
                "products": [prod],
                "quickActions": [
                    {"label": f"🛒 Confirm Add ({quantity}x)", "action": "add_cart", "value": prod.get("id"), "quantity": quantity},
                    {"label": "View Product", "action": "view_product", "value": prod.get("id")},
                    {"label": "View Cart", "action": "view_cart"},
                ],
            }

    # Intent G: Product Search & Recommendation
    search_keywords = ["do you have", "show me", "recommend", "looking for", "find", "buy", "vitamin", "pain", "paracetamol", "coartem", "baby", "cough", "syrup", "cheapest"]
    if any(k in msg_lower for k in search_keywords) or len(message.split()) <= 4:
        clean_query = msg_lower
        for phrase in ["do you have", "show me", "can i get", "i need", "looking for", "please find", "what products do you have for"]:
            clean_query = clean_query.replace(phrase, "")
        clean_query = clean_query.strip()

        found = tool_search_products(products, clean_query or message, limit=4)
        if found:
            record_analytics_event("search", message)
            record_analytics_event("recommendation", message)
            return {
                "text": f"Here are authentic BloomCare pharmacy products matching **\"{clean_query or message}\"** verified in our dispensary catalog:",
                "products": found,
                "quickActions": [
                    {"label": "🛒 View Cart", "action": "view_cart"},
                    {"label": "💊 Browse Full Catalog", "action": "navigate", "value": "medicines"},
                ],
            }
        else:
            record_analytics_event("unanswered", message)
            return {
                "text": (
                    f"I couldn't find any products matching **\"{clean_query or message}\"** in our active catalog.\n\n"
                    "Our pharmacy stocks hundreds of verified medications. Would you like to check with our pharmacist directly or try another brand or generic name?"
                ),
                "products": [],
                "quickActions": [
                    {"label": "💬 Ask a Pharmacist", "action": "whatsapp", "value": f"https://wa.me/{pharm.get('whatsapp')}?text=Inquiry%20for%20{clean_query or message}"},
                    {"label": "💊 Browse All Medicines", "action": "navigate", "value": "medicines"},
                ],
            }

    # Intent H: General FAQ Matching
    faq_match = tool_get_bloomcare_faq(message)
    if faq_match:
        record_analytics_event("search", message)
        return {
            "text": faq_match,
            "products": [],
            "quickActions": [
                {"label": "💊 Browse Medicines", "action": "navigate", "value": "medicines"},
                {"label": "👨‍⚕️ Speak to a Pharmacist", "action": "suggest", "value": "Talk to a pharmacist"},
            ],
        }

    # Default Helpful Response
    return {
        "text": (
            f"I'm here to help you with anything related to BloomCare Pharmacy! 😊\n\n"
            f"I can help you **find genuine medicines**, **check real-time stock and prices**, **track your delivery**, "
            f"or connect you with **Dr. Amina Nanyonga** and our licensed pharmacy team.\n\n"
            "What would you like to do?"
        ),
        "products": tool_search_products(products, "Paracetamol", in_stock_only=True, limit=2),
        "quickActions": [
            {"label": "🔎 Find a Medicine", "action": "suggest", "value": "Find a medicine"},
            {"label": "⭐ Recommended Products", "action": "suggest", "value": "Recommend products for me"},
            {"label": "📦 Track Order", "action": "suggest", "value": "Where is my order?"},
            {"label": "🚚 Delivery Pricing", "action": "suggest", "value": "How much is delivery?"},
            {"label": "👨‍⚕️ Speak with Pharmacist", "action": "suggest", "value": "Talk to a pharmacist"},
        ],
    }


# -------------------------------------------------------------
# EXTERNAL LLM PROVIDERS (REST VIA URLLIB)
# -------------------------------------------------------------

def call_gemini_provider(message: str, history: List[Dict[str, Any]], products: List[Dict[str, Any]], orders: List[Dict[str, Any]], current_user: Dict[str, Any], knowledge: Dict[str, Any], api_key: str) -> Optional[Dict[str, Any]]:
    """Calls Google Gemini API using REST protocol."""
    # Pre-search products to ground the prompt in actual database records
    relevant_products = tool_search_products(products, message, limit=4)
    prod_context = json.dumps([{
        "id": p.get("id"),
        "name": p.get("name"),
        "genericName": p.get("genericName"),
        "price": p.get("price"),
        "stockQuantity": p.get("stockQuantity"),
        "inStock": int(p.get("stockQuantity", 0)) > 0,
        "requiresPrescription": p.get("requiresPrescription")
    } for p in relevant_products])

    system_prompt = (
        "You are BloomCare AI, the official pharmacy assistant for BloomCare Pharmacy in Mbarara City, Uganda. "
        "Strict clinical safety rules apply: You are NOT a doctor and must NEVER provide medical diagnoses or encourage bypassing prescriptions. "
        "Strict anti-hallucination rules: Only recommend products present in this real database extract: "
        f"{prod_context}. "
        "Never invent prices, stock numbers, or medications. If asked about emergency medical symptoms, urge immediate emergency hospital care."
    )

    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={api_key}"
    req_body = {
        "contents": [
            {"role": "user", "parts": [{"text": f"{system_prompt}\n\nCustomer question: {message}"}]}
        ]
    }

    req = urllib.request.Request(
        url,
        data=json.dumps(req_body).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST"
    )

    with urllib.request.urlopen(req, timeout=8) as response:
        if response.status == 200:
            res_data = json.loads(response.read().decode("utf-8"))
            candidates = res_data.get("candidates", [])
            if candidates:
                text = candidates[0].get("content", {}).get("parts", [{}])[0].get("text", "")
                if text:
                    return {
                        "text": text,
                        "products": relevant_products if ("have" in message.lower() or "recommend" in message.lower() or "show" in message.lower()) else [],
                        "quickActions": [
                            {"label": "🛒 View Cart", "action": "view_cart"},
                            {"label": "👨‍⚕️ Speak to Pharmacist", "action": "suggest", "value": "Talk to a pharmacist"},
                        ],
                    }
    return None


def call_openai_provider(message: str, history: List[Dict[str, Any]], products: List[Dict[str, Any]], orders: List[Dict[str, Any]], current_user: Dict[str, Any], knowledge: Dict[str, Any], api_key: str) -> Optional[Dict[str, Any]]:
    """Calls OpenAI API using REST protocol."""
    relevant_products = tool_search_products(products, message, limit=4)
    prod_context = json.dumps([{
        "id": p.get("id"),
        "name": p.get("name"),
        "price": p.get("price"),
        "stockQuantity": p.get("stockQuantity"),
    } for p in relevant_products])

    system_prompt = (
        "You are BloomCare AI, official pharmacy assistant for BloomCare Pharmacy in Mbarara City, Uganda. "
        "Never diagnose illnesses or bypass prescriptions. Only use actual BloomCare products: " + prod_context
    )

    url = "https://api.openai.com/v1/chat/completions"
    req_body = {
        "model": "gpt-4o-mini",
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": message},
        ],
        "temperature": 0.3,
        "max_tokens": 400,
    }

    req = urllib.request.Request(
        url,
        data=json.dumps(req_body).encode("utf-8"),
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {api_key}",
        },
        method="POST"
    )

    with urllib.request.urlopen(req, timeout=8) as response:
        if response.status == 200:
            res_data = json.loads(response.read().decode("utf-8"))
            choices = res_data.get("choices", [])
            if choices:
                text = choices[0].get("message", {}).get("content", "")
                if text:
                    return {
                        "text": text,
                        "products": relevant_products if ("have" in message.lower() or "recommend" in message.lower() or "show" in message.lower()) else [],
                        "quickActions": [
                            {"label": "🛒 View Cart", "action": "view_cart"},
                            {"label": "👨‍⚕️ Speak to Pharmacist", "action": "suggest", "value": "Talk to a pharmacist"},
                        ],
                    }
    return None

