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
MEDICAL_KNOWLEDGE_FILE = DATA_DIR / "medical_knowledge.json"
ANALYTICS_FILE = DATA_DIR / "ai_analytics.json"
DELIVERIES_FILE = DATA_DIR / "deliveries.json"
ASSIGNMENTS_FILE = DATA_DIR / "delivery_assignments.json"

# 12 Life-Threatening Emergency Categories
EMERGENCY_PATTERNS = [
    # 1. Difficulty breathing
    re.compile(r"\b(shortness\s+of\s+breath|can'?t\s+breathe|severe\s+difficulty\s+breathing|choking|gasping\s+for\s+(air|breath)|struggling\s+to\s+breathe|unable\s+to\s+breathe)\b", re.I),
    # 2. Chest pain / heart attack
    re.compile(r"\b(chest\s+pain|heart\s+attack|pressure\s+in\s+(my\s+)?chest|crushing\s+chest|tightness\s+in\s+chest|pain\s+radiating\s+to\s+(left\s+)?arm)\b", re.I),
    # 3. Unconsciousness / fainting
    re.compile(r"\b(unconscious|fainted|passed\s+out|unresponsive|collapsed|blacked\s+out|loss\s+of\s+consciousness)\b", re.I),
    # 4. Severe bleeding
    re.compile(r"\b(severe\s+bleeding|bleeding\s+uncontrollably|spurting\s+blood|gushing\s+blood|massive\s+hemorrhage|deep\s+arterial\s+cut)\b", re.I),
    # 5. Seizures / convulsions
    re.compile(r"\b(seizure|convulsing|fits|epilepsy\s+attack|shaking\s+uncontrollably)\b", re.I),
    # 6. Stroke symptoms
    re.compile(r"\b(stroke|face\s+droop|slurred\s+speech|sudden\s+paralysis|sudden\s+numbness|arm\s+weakness|can'?t\s+move\s+(one\s+)?side)\b", re.I),
    # 7. Anaphylaxis / severe allergic reaction
    re.compile(r"\b(anaphylaxis|throat\s+closing|severe\s+allergic\s+reaction|tongue\s+swelling|swollen\s+lips\s+and\s+breathing|lip\s+swelling\s+with\s+wheezing)\b", re.I),
    # 8. Poisoning / overdose
    re.compile(r"\b(overdose|swallowed\s+poison|poisoning|drank\s+bleach|ingested\s+chemical|swallowed\s+pills|toxic\s+ingestion)\b", re.I),
    # 9. Serious injury / severe trauma
    re.compile(r"\b(serious\s+head\s+injury|broken\s+bone\s+protruding|car\s+accident|severe\s+trauma|compound\s+fracture|severe\s+burn)\b", re.I),
    # 10. Severe confusion / altered mental state
    re.compile(r"\b(severe\s+confusion|sudden\s+disorientation|hallucinations|sudden\s+delirium|altered\s+mental\s+state)\b", re.I),
    # 11. Severe dehydration (especially in infants / elderly)
    re.compile(r"\b(severe\s+dehydration|sunken\s+eyes\s+no\s+tears|no\s+urine\s+for\s+(12|24)\s+hours|infant\s+unresponsive\s+dehydration)\b", re.I),
    # 12. Suicidal intent / self-harm
    re.compile(r"\b(suicid|kill\s+myself|end\s+my\s+life|self[- ]harm|want\s+to\s+die)\b", re.I),
]

PRESCRIPTION_BYPASS_PATTERNS = [
    re.compile(r"\b(without\s+(a\s+)?prescription|bypass\s+prescription|skip\s+prescription|no\s+doctor\s+note|fake\s+prescription)\b", re.I),
]

DOSAGE_PATTERNS = [
    re.compile(r"\b(how\s+much\s+(should\s+i|can\s+i|to)\s+take|what\s+dosage|how\s+many\s+(tablets|pills|capsules|drops|spoons)|dosage\s+for|can\s+i\s+give\s+\d+|child\s+dose|pediatric\s+dose|dose\s+for\s+child|dose\s+for\s+baby)\b", re.I),
]


def load_knowledge_base() -> Dict[str, Any]:
    if not KNOWLEDGE_FILE.exists():
        return {}
    try:
        with open(KNOWLEDGE_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return {}


def load_medical_knowledge() -> Dict[str, Any]:
    if not MEDICAL_KNOWLEDGE_FILE.exists():
        return {}
    try:
        with open(MEDICAL_KNOWLEDGE_FILE, "r", encoding="utf-8") as f:
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


MEDICINE_KEYWORD_MAP = {
    "paracetamol": ["paracetamol", "acetaminophen", "panadol"],
    "ibuprofen": ["ibuprofen", "advil", "brufen"],
    "amoxicillin": ["amoxicillin", "amoxil"],
    "coartem": ["coartem", "artemether", "lumefantrine", "lonart"],
    "omeprazole": ["omeprazole", "losec", "prilosec"],
    "cetirizine": ["cetirizine", "zyrtec"],
    "ors_zinc": ["ors", "oral rehydration", "zinc sulfate", "rehydration salts"],
}

CONDITION_KEYWORD_MAP = {
    "malaria": ["malaria", "anopheles", "plasmodium"],
    "colds_flu": ["flu", "cold", "coughs", "coughing", "runny nose", "sore throat", "sneezing", "influenza"],
    "headaches_migraines": ["headache", "migraine", "head ache", "throbbing head"],
    "digestive_problems": ["heartburn", "indigestion", "acid reflux", "stomach ache", "bloating", "gastritis", "ulcer"],
    "diarrhea_vomiting": ["diarrhea", "diarrhoea", "vomiting", "throwing up", "loose stool", "watery stool", "stomach bug"],
    "allergies": ["allergy", "allergies", "allergic rhinitis", "hay fever", "hives", "urticaria"],
    "asthma": ["asthma", "wheezing", "wheeze", "inhaler"],
    "diabetes": ["diabetes", "high sugar", "hyperglycemia", "blood glucose", "diabetic"],
    "hypertension": ["hypertension", "high blood pressure", "elevated bp"],
    "skin_rashes": ["rash", "eczema", "dermatitis", "itchy skin", "ringworm", "skin infection", "skin allergy"],
}


def tool_get_condition_info(query: str, med_kb: Optional[Dict[str, Any]] = None) -> Optional[Dict[str, Any]]:
    kb = med_kb or load_medical_knowledge()
    conditions = kb.get("conditions", {})
    query_lower = query.lower()

    # 1. Direct mapped keyword check
    for cond_key, kw_list in CONDITION_KEYWORD_MAP.items():
        if any(re.search(r"\b" + re.escape(kw) + r"\b", query_lower) for kw in kw_list):
            if cond_key in conditions:
                return conditions[cond_key]

    # 2. Match condition name or common symptoms
    for key, cond in conditions.items():
        name = cond.get("name", "").lower()
        if name in query_lower:
            return cond
        symptoms = [s.lower() for s in cond.get("commonSymptoms", [])]
        if any(sym in query_lower for sym in symptoms):
            return cond

    return None


def tool_get_medicine_info(query: str, med_kb: Optional[Dict[str, Any]] = None) -> Optional[Dict[str, Any]]:
    kb = med_kb or load_medical_knowledge()
    medicines = kb.get("medicines", {})
    query_lower = query.lower()

    # Check mapped keywords with word boundaries
    for med_key, kw_list in MEDICINE_KEYWORD_MAP.items():
        if any(re.search(r"\b" + re.escape(kw) + r"\b", query_lower) for kw in kw_list):
            if med_key in medicines:
                return medicines[med_key]

    # Match name
    for key, med in medicines.items():
        name = med.get("name", "").lower()
        if name in query_lower:
            return med

    return None


def tool_get_first_aid_info(query: str, med_kb: Optional[Dict[str, Any]] = None) -> Optional[Dict[str, Any]]:
    kb = med_kb or load_medical_knowledge()
    first_aid = kb.get("firstAid", {})
    query_lower = query.lower()

    if any(w in query_lower for w in ["burn", "scald", "hot water burn"]):
        return first_aid.get("burns")
    if any(w in query_lower for w in ["cut", "scrape", "wound", "bleeding cut", "scrapes"]):
        return first_aid.get("cuts_wounds")
    if any(w in query_lower for w in ["nosebleed", "nose bleed", "bleeding nose"]):
        return first_aid.get("nosebleed")
    if any(w in query_lower for w in ["choking", "choke", "heimlich"]):
        return first_aid.get("choking")

    for key, item in first_aid.items():
        title = item.get("title", "").lower()
        if title in query_lower:
            return item

    return None


def tool_get_lab_test_info(query: str, med_kb: Optional[Dict[str, Any]] = None) -> Optional[Dict[str, Any]]:
    kb = med_kb or load_medical_knowledge()
    lab_tests = kb.get("labTests", {})
    query_lower = query.lower()

    if any(w in query_lower for w in ["malaria test", "rdt", "blood smear", "malaria check"]):
        return lab_tests.get("malaria_rdt")
    if any(w in query_lower for w in ["cbc", "complete blood count", "fbc", "blood count"]):
        return lab_tests.get("cbc")
    if any(w in query_lower for w in ["urinalysis", "urine test", "urine dipstick"]):
        return lab_tests.get("urinalysis")
    if any(w in query_lower for w in ["blood glucose", "blood sugar", "fasting blood glucose", "rbs"]):
        return lab_tests.get("blood_glucose")
    if any(w in query_lower for w in ["lipid", "cholesterol panel", "cholesterol test", "triglycerides"]):
        return lab_tests.get("lipid_profile")

    return None


def tool_get_medical_term(query: str, med_kb: Optional[Dict[str, Any]] = None) -> Optional[Tuple[str, str]]:
    kb = med_kb or load_medical_knowledge()
    glossary = kb.get("medicalGlossary", {})
    query_lower = query.lower()

    for term, definition in glossary.items():
        if re.search(r"\b" + re.escape(term) + r"\b", query_lower):
            return term.upper(), definition

    return None


def format_condition_response(cond: Dict[str, Any]) -> str:
    name = cond.get("name", "Condition")
    causes = cond.get("possibleCauses") or cond.get("summary", "")
    symptoms = cond.get("commonSymptoms", [])
    safe_advice = cond.get("safeAdvice", [])
    warnings = cond.get("warningSigns", [])
    clarifications = cond.get("clarificationQuestions", [])
    tests = cond.get("suggestedTests", [])

    lines = [
        f"🌿 **Medical Guidance: {name}**\n",
        f"**What it could mean:**\n{causes}\n",
    ]

    if symptoms:
        lines.append("**Common symptoms:**")
        for s in symptoms:
            lines.append(f"• {s}")
        lines.append("")

    if safe_advice:
        lines.append("**What you can do:**")
        for a in safe_advice:
            lines.append(f"• {a}")
        lines.append("")

    if warnings:
        lines.append("**When to seek medical care:**")
        for w in warnings:
            lines.append(f"• ⚠️ {w}")
        lines.append("")

    if tests:
        lines.append(f"🔬 **Recommended Diagnostic Confirmation:** {', '.join(tests)}\n")

    if clarifications:
        lines.append("**To help our clinical team guide you more accurately, please consider:**")
        for q in clarifications:
            lines.append(f"• {q}")
        lines.append("")

    lines.append(
        "_Disclaimer: BloomCare AI provides general health information and does not replace advice from a qualified healthcare professional. For emergencies or serious symptoms, seek immediate medical care._"
    )

    return "\n".join(lines)


def format_medicine_response(med: Dict[str, Any]) -> str:
    name = med.get("name", "Medication")
    med_class = med.get("class", "")
    uses = med.get("uses", "")
    mechanism = med.get("mechanism", "")
    side_effects = med.get("sideEffects", "")
    precautions = med.get("precautions", "")
    interactions = med.get("interactions", "")
    rx_status = med.get("prescriptionStatus", "Over-The-Counter (OTC)")
    dosage = med.get("dosageGuidance", "")
    consult = med.get("whenToConsult", "")

    lines = [
        f"💊 **Medication Guide: {name}**",
        f"• **Drug Class:** {med_class}",
        f"• **Prescription Status:** {rx_status}\n",
    ]

    if uses:
        lines.append(f"**What it is and uses:**\n{uses}\n")

    if mechanism:
        lines.append(f"**How it works:**\n{mechanism}\n")

    if side_effects:
        lines.append(f"**Common side effects:**\n{side_effects}\n")

    if precautions:
        lines.append(f"**Important precautions:**\n{precautions}\n")

    if interactions:
        lines.append(f"**Drug interactions & safety:**\n{interactions}\n")

    if dosage:
        lines.append(f"**Dosage guidance:**\n{dosage}\n")

    if consult:
        lines.append(f"**When to consult a healthcare professional:**\n{consult}\n")

    lines.append(
        "_Dosage Safety: Safe dosage depends on age, weight, liver/kidney health, and clinical history. Always follow product packaging instructions or consult a BloomCare pharmacist._"
    )

    return "\n".join(lines)


def format_dosage_safety_advisory(medicine_name: Optional[str] = None) -> str:
    med_text = f" for **{medicine_name}**" if medicine_name else ""
    return (
        f"🛡️ **Medication Dosage & Administration Safety**\n\n"
        f"BloomCare AI cannot provide personalized prescriptive dosing instructions{med_text}. "
        f"Safe dosage varies significantly depending on several critical clinical factors:\n\n"
        f"• **Patient Age & Weight:** Pediatric doses must be calculated strictly by weight (mg/kg), never by adult estimates.\n"
        f"• **Organ Function:** Kidney and liver conditions alter how drugs are metabolized and cleared.\n"
        f"• **Pregnancy & Breastfeeding:** Certain medications require dose adjustment or are strictly contraindicated.\n"
        f"• **Product Strength & Formulation:** Liquid syrups, drops, chewables, and tablets contain different concentrations.\n"
        f"• **Current Medications:** Potential drug-drug interactions may increase side effect risks.\n\n"
        f"📋 **Safe Next Steps:**\n"
        f"1. **Read Product Label:** Always check the dosage chart on the outer box or leaflet.\n"
        f"2. **Use Accurate Measures:** Use oral syringes or medicine spoons, never kitchen spoons.\n"
        f"3. **Ask Our Pharmacist:** Our licensed pharmacy team is ready to calculate the exact safe dosage for you."
    )


# -------------------------------------------------------------
# MEDICAL SAFETY & CLINICAL GUARDRAILS
# -------------------------------------------------------------

def evaluate_medical_safety(message: str, knowledge: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    # 1. Emergency red-flag symptoms
    for pattern in EMERGENCY_PATTERNS:
        if pattern.search(message):
            pharm = knowledge.get("pharmacy", {})
            phone = pharm.get("phone", "+256 700 000 000")
            phone = pharm.get("phone", "0750210886")
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
        phone = pharm.get("phone", "0750210886")
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

    # Intent G: Medication Dosage & Administration Safety
    if any(p.search(message) for p in DOSAGE_PATTERNS) or ("dosage" in msg_lower and not ("buy" in msg_lower or "add" in msg_lower)):
        record_analytics_event("search", message, {"type": "dosage_safety"})
        matched_med = tool_get_medicine_info(message)
        med_name = matched_med.get("name") if matched_med else None
        cat_products = tool_search_products(products, med_name or message, limit=2) if med_name else []
        return {
            "text": format_dosage_safety_advisory(med_name),
            "products": cat_products,
            "quickActions": [
                {"label": "👨‍⚕️ Consult BloomCare Pharmacist", "action": "whatsapp", "value": f"https://wa.me/{pharm.get('whatsapp')}?text=Dosage%20Inquiry%20for%20{med_name or 'Medication'}"},
                {"label": "🩺 Book Consultation", "action": "navigate", "value": "consultations"},
                {"label": "💊 Browse Medicines", "action": "navigate", "value": "medicines"},
            ],
            "suggestedQuestions": [
                "What are common side effects?",
                "When to consult a healthcare professional?",
                "How do I upload a prescription?"
            ]
        }

    # Intent H: First Aid Protocols
    first_aid_match = tool_get_first_aid_info(message)
    if first_aid_match:
        record_analytics_event("search", message, {"type": "first_aid"})
        title = first_aid_match.get("title", "First Aid")
        steps = "\n".join([f"{idx+1}. {s}" for idx, s in enumerate(first_aid_match.get("immediate_steps", []))])
        avoid = "\n".join([f"• ❌ {a}" for a in first_aid_match.get("what_not_to_do", [])])
        red_flags = "\n".join([f"• ⚠️ {r}" for r in first_aid_match.get("red_flags", [])])

        return {
            "text": (
                f"🩹 **First Aid Guidance: {title}**\n\n"
                f"**Immediate Steps:**\n{steps}\n\n"
                f"**What NOT to do:**\n{avoid}\n\n"
                f"**Seek Emergency Care Immediately If:**\n{red_flags}\n\n"
                "_First aid is initial supportive care and does not replace medical treatment by a qualified professional._"
            ),
            "products": tool_search_products(products, "Antiseptic", limit=2),
            "quickActions": [
                {"label": "📞 Call Dispensary", "action": "call_phone", "value": pharm.get("phone", "0750210886")},
                {"label": "💬 WhatsApp Care Desk", "action": "whatsapp", "value": f"https://wa.me/{pharm.get('whatsapp')}?text=First%20Aid%20Emergency%20Inquiry"},
            ]
        }

    # Intent I: Diagnostic Laboratory Tests
    lab_test_match = tool_get_lab_test_info(message)
    if lab_test_match and any(w in msg_lower for w in ["test", "lab", "screen", "smear", "rdt", "check", "glucose", "urinalysis", "cbc", "blood"]):
        record_analytics_event("search", message, {"type": "lab_test"})
        return {
            "text": (
                f"🔬 **Laboratory Test Information: {lab_test_match.get('name')}**\n\n"
                f"• **Purpose:** {lab_test_match.get('purpose')}\n"
                f"• **Sample Required:** {lab_test_match.get('sample_type')}\n"
                f"• **Patient Preparation:** {lab_test_match.get('preparation')}\n"
                f"• **Clinical Importance:** {lab_test_match.get('clinical_importance')}\n\n"
                "BloomCare Pharmacy works closely with registered medical diagnostic centers across Mbarara. "
                "Consult our clinical team if you need a test requisition or interpretation."
            ),
            "products": [],
            "quickActions": [
                {"label": "🩺 Clinical Consultation", "action": "navigate", "value": "consultations"},
                {"label": "💬 Ask Pharmacist on WhatsApp", "action": "whatsapp", "value": f"https://wa.me/{pharm.get('whatsapp')}?text=Inquiry%20about%20{lab_test_match.get('name')}"},
            ]
        }

    # Intent J: Medical Term / Health Glossary
    term_match = tool_get_medical_term(message)
    if term_match and any(w in msg_lower for w in ["what is", "what does", "meaning", "define", "term"]):
        record_analytics_event("search", message, {"type": "glossary"})
        return {
            "text": (
                f"📖 **Medical Definition: {term_match.get('term')}**\n\n"
                f"{term_match.get('simple_explanation')}\n\n"
                f"**Clinical Context:** {term_match.get('context')}"
            ),
            "products": [],
            "quickActions": [
                {"label": "💊 Browse Medicines", "action": "navigate", "value": "medicines"},
                {"label": "👨‍⚕️ Speak to a Pharmacist", "action": "suggest", "value": "Talk to a pharmacist"},
            ]
        }

    # Intent K: Specific Medicine Monograph Information
    med_monograph = tool_get_medicine_info(message)
    is_buying_intent = any(w in msg_lower for w in ["buy", "order", "price", "how much is", "add to cart", "purchase", "in stock", "cost"])
    if med_monograph and (not is_buying_intent or any(w in msg_lower for w in ["side effect", "use", "work", "precaution", "interaction", "contraindication", "information", "tell me about"])):
        record_analytics_event("search", message, {"type": "medicine_monograph"})
        med_name = med_monograph.get("name", "")
        cat_products = tool_search_products(products, med_name, limit=3)
        return {
            "text": format_medicine_response(med_monograph),
            "products": cat_products,
            "quickActions": [
                {"label": "🛒 View Cart", "action": "view_cart"},
                {"label": "👨‍⚕️ Ask a Pharmacist", "action": "whatsapp", "value": f"https://wa.me/{pharm.get('whatsapp')}?text=Inquiry%20about%20{med_name}"},
                {"label": "💊 Browse Catalog", "action": "navigate", "value": "medicines"},
            ],
            "suggestedQuestions": [
                f"What is the dosage safety for {med_name}?",
                "When should I consult a doctor?",
                "How do I upload a prescription?"
            ]
        }

    # Intent L: Clinical Conditions & Symptom Guidance (Non-Diagnostic)
    condition_match = tool_get_condition_info(message)
    if condition_match:
        record_analytics_event("search", message, {"type": "condition_guidance"})
        cond_name = condition_match.get("name", "")
        # Find relevant OTC support products from catalog
        otc_keywords = condition_match.get("relevant_otc_products", [])
        matched_products = []
        for kw in otc_keywords:
            matched_products.extend(tool_search_products(products, kw, limit=2))
            if len(matched_products) >= 3:
                break

        # Deduplicate
        seen_ids = set()
        dedup_products = []
        for p in matched_products:
            p_id = p.get("id")
            if p_id not in seen_ids:
                seen_ids.add(p_id)
                dedup_products.append(p)

        return {
            "text": format_condition_response(condition_match),
            "products": dedup_products[:3],
            "quickActions": [
                {"label": "👨‍⚕️ Speak to a Pharmacist", "action": "suggest", "value": "Talk to a pharmacist"},
                {"label": "🩺 Book Consultation", "action": "navigate", "value": "consultations"},
                {"label": "💊 Browse Medicines", "action": "navigate", "value": "medicines"},
            ],
            "suggestedQuestions": condition_match.get("follow_up_questions", [])[:3]
        }

    # Intent M: Product Search & Recommendation
    search_keywords = ["do you have", "show me", "recommend", "looking for", "find", "buy", "vitamin", "pain", "paracetamol", "coartem", "baby", "cough", "syrup", "cheapest"]
    if any(k in msg_lower for k in search_keywords) or (len(message.split()) <= 4 and not any(w in msg_lower for w in ["why", "what", "how", "when"])):
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

    # Intent N: General FAQ Matching
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
            f"I'm **BloomCare AI**, your clinical information and licensed pharmacy assistant! 😊\n\n"
            f"I can help you with:\n"
            f"• **Health Guidance:** Understanding symptoms, causes, supportive home care, and warning signs.\n"
            f"• **Medicine Information:** Uses, mechanism, side effects, precautions, and interactions.\n"
            f"• **Pharmacy Services:** Finding verified medicines, checking stock & prices, and tracking deliveries.\n"
            f"• **Clinical Team:** Direct connection with **Dr. Amina Nanyonga** and our registered pharmacists.\n\n"
            "How can I help you today?"
        ),
        "products": tool_search_products(products, "Paracetamol", in_stock_only=True, limit=2),
        "quickActions": [
            {"label": "🔎 Find a Medicine", "action": "suggest", "value": "Find a medicine"},
            {"label": "⭐ Recommended Products", "action": "suggest", "value": "Recommend products for me"},
            {"label": "📦 Track Order", "action": "suggest", "value": "Where is my order?"},
            {"label": "💊 Prescription Help", "action": "suggest", "value": "How do I upload a prescription?"},
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
        "You are BloomCare AI, the authoritative Medical Information and Licensed Pharmacy Assistant for BloomCare Pharmacy in Mbarara City, Uganda. "
        "Strict clinical safety rules: You provide helpful health education and guidance, but you are NOT a substitute for a doctor. "
        "NEVER declare 'You have X' based only on symptoms; always use differential phrasing (e.g., 'Fever can have several causes such as malaria, viral infections, or bacterial infections... A diagnostic test can confirm'). "
        "NEVER prescribe prescription medicines or encourage bypassing prescriptions. "
        "Structure clinical guidance into: **What it could mean**, **Common symptoms**, **What you can do**, and **When to seek medical care**. "
        "NEVER provide personalized prescriptive dosing; explain that dosage depends on age, weight, kidney/liver health, and pregnancy, and advise reading package instructions or asking a BloomCare pharmacist. "
        "For acute red-flag emergencies (chest pain, severe breathing difficulty, stroke, severe bleeding, poisoning), urge immediate in-person hospital care. "
        f"Strict anti-hallucination rules: Only recommend products present in this real database extract: {prod_context}. Never invent products or prices."
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
        "You are BloomCare AI, official medical information and pharmacy assistant for BloomCare Pharmacy in Mbarara City, Uganda. "
        "Never diagnose illnesses or bypass prescriptions. Always provide differential health guidance with structured sections: "
        "**What it could mean**, **Common symptoms**, **What you can do**, and **When to seek medical care**. "
        "Strictly refuse personalized dosing. Only use actual BloomCare products: " + prod_context
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

