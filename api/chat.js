// Vercel Serverless Function for BloomCare AI Chatbot
// Routes requests to Gemini, OpenAI, or the BloomCare Clinical Rule-Based Engine

export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method Not Allowed' });
  }

  try {
    const payload = req.body || {};
    const message = (payload.message || '').trim();
    const products = payload.products || [];
    const orders = payload.orders || [];
    const currentUser = payload.currentUser || {};
    const cart = payload.cart || [];

    // 1. Check 12 emergency red-flag categories
    const emergencyRegex = /\b(chest\s+pain|heart\s+attack|pressure\s+in\s+(my\s+)?chest|crushing\s+chest|pain\s+radiating\s+to\s+(left\s+)?arm|shortness\s+of\s+breath|can'?t\s+breathe|severe\s+difficulty\s+breathing|choking|gasping\s+for\s+(air|breath)|struggling\s+to\s+breathe|unconscious|fainted|passed\s+out|unresponsive|collapsed|blacked\s+out|severe\s+bleeding|bleeding\s+uncontrollably|spurting\s+blood|gushing\s+blood|seizure|convulsing|fits|epilepsy\s+attack|stroke|face\s+droop|slurred\s+speech|sudden\s+paralysis|sudden\s+numbness|arm\s+weakness|anaphylaxis|throat\s+closing|severe\s+allergic\s+reaction|tongue\s+swelling|swollen\s+lips\s+and\s+breathing|overdose|swallowed\s+poison|poisoning|drank\s+bleach|ingested\s+chemical|swallowed\s+pills|serious\s+head\s+injury|broken\s+bone\s+protruding|car\s+accident|severe\s+trauma|severe\s+confusion|sudden\s+disorientation|hallucinations|severe\s+dehydration|sunken\s+eyes\s+no\s+tears|no\s+urine\s+for\s+(12|24)\s+hours|suicid|kill\s+myself|end\s+my\s+life|self[- ]harm|want\s+to\s+die)\b/i;
    if (emergencyRegex.test(message)) {
      return res.status(200).json({
        success: true,
        text: "⚠️ **MEDICAL EMERGENCY ALERT**\n\nThe symptoms you described may indicate a serious or life-threatening medical emergency. **BloomCare AI is an online pharmacy assistant and cannot diagnose conditions or manage emergencies.**\n\n🚨 **Immediate Action Required:**\n1. Please seek immediate in-person emergency care at the nearest hospital (such as **Mbarara Regional Referral Hospital**).\n2. Contact local emergency medical services or call BloomCare Urgent Support at **0750210886**.\n\nDo not wait for an online medicine delivery for severe, sudden, or life-threatening symptoms.",
        products: [],
        isSafetyAlert: true,
        quickActions: [
          { label: "🚨 Emergency Contacts", action: "emergency_contacts" },
          { label: "📞 Call Dispensary: 0750210886", action: "call_phone", value: "0750210886" },
          { label: "💬 WhatsApp Care Desk", action: "whatsapp", value: "https://wa.me/256750210886?text=URGENT%20Medical%20Inquiry" }
        ]
      });
    }

    // 2. Prescription bypass guardrail
    const bypassRegex = /\b(without\s+(a\s+)?prescription|bypass\s+prescription|skip\s+prescription|no\s+doctor\s+note|fake\s+prescription)\b/i;
    if (bypassRegex.test(message)) {
      return res.status(200).json({
        success: true,
        text: "🛡️ **Prescription Verification Policy**\n\nBloomCare Pharmacy strictly complies with National Drug Authority (NDA) Uganda regulations. **Prescription medicines (Rx) cannot be dispensed without a verified, legitimate prescription from a registered medical practitioner.**\n\n**How to order prescription medications:**\n1. Add the medicine to your order.\n2. During checkout, upload a clear photo or PDF scan of your doctor's prescription.\n3. A registered BloomCare pharmacist will clinically review and approve the prescription before dispensing.",
        products: [],
        quickActions: [
          { label: "💊 Upload Prescription", action: "navigate", value: "prescriptions" },
          { label: "🩺 Consult Pharmacist", action: "navigate", value: "consultations" }
        ]
      });
    }

    const msgLower = message.toLowerCase();

    // 3. Dosage Safety Check
    const dosageRegex = /\b(how\s+much\s+(should\s+i|can\s+i|to)\s+take|what\s+dosage|how\s+many\s+(tablets|pills|capsules|drops|spoons)|dosage\s+for|can\s+i\s+give\s+\d+|child\s+dose|pediatric\s+dose|dose\s+for\s+child|dose\s+for\s+baby|dosage)\b/i;
    if (dosageRegex.test(message) && !msgLower.includes("buy") && !msgLower.includes("add to cart")) {
      return res.status(200).json({
        success: true,
        text: "🛡️ **Medication Dosage & Administration Safety**\n\nBloomCare AI cannot provide personalized prescriptive dosing instructions. Safe dosage varies significantly depending on several critical clinical factors:\n\n• **Patient Age & Weight:** Pediatric doses must be calculated strictly by weight (mg/kg), never by adult estimates.\n• **Organ Function:** Kidney and liver conditions alter drug metabolism and excretion.\n• **Pregnancy & Breastfeeding:** Certain medications require dose adjustment or are strictly contraindicated.\n• **Product Strength & Formulation:** Liquid syrups, drops, chewables, and tablets have different concentrations.\n• **Current Medications:** Potential drug-drug interactions may increase adverse reaction risks.\n\n📋 **Safe Next Steps:**\n1. **Read Product Label:** Always check the dosage table on the package or patient leaflet.\n2. **Use Accurate Measures:** Use an oral dosing syringe or medicinal spoon, never kitchen spoons.\n3. **Ask Our Pharmacist:** Our registered clinical team is available to calculate the exact safe dosage for you.",
        products: products.filter(p => p && (p.name || '').toLowerCase().includes('paracetamol')).slice(0, 2),
        quickActions: [
          { label: "👨‍⚕️ Ask a Pharmacist", action: "whatsapp", value: "https://wa.me/256750210886?text=Dosage%20Inquiry" },
          { label: "🩺 Book Consultation", action: "navigate", value: "consultations" },
          { label: "💊 Browse Catalog", action: "navigate", value: "medicines" }
        ]
      });
    }

    // 4. Clinical Condition & Symptom Guidance (Non-Diagnostic)
    if (/\b(malaria|anopheles|plasmodium)\b/i.test(message)) {
      return res.status(200).json({
        success: true,
        text: "🌿 **Medical Guidance: Malaria**\n\n**What it could mean:**\nMalaria is a life-threatening infection caused by Plasmodium parasites transmitted through infected female Anopheles mosquito bites. Symptoms can overlap with viral infections or typhoid, so a diagnostic test is essential before starting treatment.\n\n**Common symptoms:**\n• High fever and chills\n• Profuse sweating\n• Headache and muscle/joint aches\n• Nausea, vomiting, or loss of appetite\n• General fatigue and weakness\n\n**What you can do:**\n• Take a rapid diagnostic test (RDT) or microscopy blood smear before initiating antimalarials.\n• Stay well-hydrated with clean water and oral fluids.\n• Rest in a cool, ventilated room.\n• Use paracetamol for fever relief and comfort while awaiting test results.\n\n**When to seek medical care:**\n• ⚠️ Difficulty breathing or rapid breathing\n• ⚠️ Persistent vomiting unable to retain oral fluids\n• ⚠️ Extreme weakness or inability to sit/walk\n• ⚠️ Yellowing of eyes or skin (jaundice)\n• ⚠️ Convulsions or altered consciousness\n\n🔬 **Recommended Diagnostic Confirmation:** Malaria Rapid Diagnostic Test (RDT) or Blood Smear\n\n**To help our clinical team guide you more accurately, please consider:**\n• Have you taken a malaria blood test?\n• How many days has the fever lasted?\n• Is this for a child, pregnant mother, or adult?\n\n_Disclaimer: BloomCare AI provides general health information and does not replace advice from a qualified healthcare professional. For emergencies or serious symptoms, seek immediate medical care._",
        products: products.filter(p => p && ((p.name || '').toLowerCase().includes('paracetamol') || (p.name || '').toLowerCase().includes('coartem'))).slice(0, 3),
        quickActions: [
          { label: "👨‍⚕️ Speak to a Pharmacist", action: "suggest", "value": "Talk to a pharmacist" },
          { label: "🩺 Book Consultation", action: "navigate", value: "consultations" },
          { label: "💊 Browse Medicines", action: "navigate", value: "medicines" }
        ]
      });
    }

    if (/\b(flu|cold|cough|coughing|runny nose|sore throat|sneezing|influenza)\b/i.test(message)) {
      return res.status(200).json({
        success: true,
        text: "🌿 **Medical Guidance: Colds, Cough, Flu & Upper Respiratory Symptoms**\n\n**What it could mean:**\nRespiratory symptoms such as cough, sore throat, and runny nose are most commonly caused by viral infections. Most common colds resolve on their own within 7 to 10 days. However, persistent fever or severe cough can also stem from bronchitis, allergies, or bacterial infections.\n\n**Common symptoms:**\n• Runny or stuffy nose\n• Sore or scratchy throat\n• Cough (dry or chesty)\n• Mild body aches and low-grade fever\n• Sneezing and mild fatigue\n\n**What you can do:**\n• Get plenty of restful sleep to support immune recovery.\n• Drink warm fluids (warm water, herbal tea, clear broths) to soothe the throat.\n• Use steam inhalation or saline nasal spray to ease nasal congestion.\n• Honey and lemon can help soothe coughs in adults and children over 1 year.\n\n**When to seek medical care:**\n• ⚠️ Shortness of breath, wheezing, or chest pain\n• ⚠️ High fever lasting more than 3 to 4 days\n• ⚠️ Coughing up thick discolored phlegm with rust or blood streaks\n• ⚠️ Inability to swallow fluids due to severe throat pain\n\n_Disclaimer: BloomCare AI provides general health information and does not replace advice from a qualified healthcare professional. For emergencies or serious symptoms, seek immediate medical care._",
        products: products.filter(p => p && ((p.name || '').toLowerCase().includes('cough') || (p.name || '').toLowerCase().includes('paracetamol'))).slice(0, 3),
        quickActions: [
          { label: "👨‍⚕️ Speak to a Pharmacist", action: "suggest", "value": "Talk to a pharmacist" },
          { label: "💊 Browse Cough & Cold", action: "navigate", value: "medicines" }
        ]
      });
    }

    // 5. Medicine Monograph Lookups
    if (/\b(amoxicillin|amoxil)\b/i.test(message)) {
      return res.status(200).json({
        success: true,
        text: "💊 **Medication Guide: Amoxicillin**\n• **Drug Class:** Penicillin-class Beta-lactam Antibiotic\n• **Prescription Status:** Prescription Only (Rx)\n\n**What it is and uses:**\nTreatment of susceptible bacterial infections of the ear, nose, throat, respiratory tract, urinary tract, and skin. It is completely ineffective against viral colds and flu.\n\n**How it works:**\nInhibits bacterial cell wall synthesis during active multiplication, causing the bacteria to rupture and die.\n\n**Common side effects:**\nNausea, vomiting, diarrhea, loose stools, mild skin rash.\n\n**Important precautions:**\nSTRICTLY CONTRAINDICATED in patients with known penicillin or beta-lactam allergy. Complete the full prescribed course even if symptoms improve early to prevent antibiotic resistance.\n\n**Drug interactions & safety:**\nOral contraceptives (may reduce effectiveness), methotrexate, allopurinol (increases risk of rash).\n\n**When to consult a healthcare professional:**\nSeek emergency care if you develop signs of an allergic reaction (hives, facial swelling, difficulty breathing) or severe watery diarrhea.\n\n_Dosage Safety: Safe dosage depends on age, weight, liver/kidney health, and clinical history. Always follow product packaging instructions or consult a BloomCare pharmacist._",
        products: products.filter(p => p && (p.name || '').toLowerCase().includes('amoxicillin')).slice(0, 2),
        quickActions: [
          { label: "📄 Upload Prescription", action: "navigate", value: "prescriptions" },
          { label: "👨‍⚕️ Ask a Pharmacist", action: "whatsapp", value: "https://wa.me/256750210886?text=Inquiry%20about%20Amoxicillin" }
        ]
      });
    }

    // 6. Search real products
    const matchedProducts = products.filter(p => {
      if (!p || p.status === 'inactive' || p.deleted) return false;
      const name = (p.name || '').toLowerCase();
      const generic = (p.genericName || '').toLowerCase();
      const cat = (p.category || '').toLowerCase();
      const tokens = msgLower.split(/\s+/).filter(t => t.length > 2);
      return tokens.some(t => name.includes(t) || generic.includes(t) || cat.includes(t));
    }).slice(0, 4);

    if (matchedProducts.length > 0 && (msgLower.includes('have') || msgLower.includes('recommend') || msgLower.includes('show') || msgLower.includes('find') || msgLower.includes('price') || msgLower.includes('paracetamol') || msgLower.includes('vitamin'))) {
      return res.status(200).json({
        success: true,
        text: `Here are authentic BloomCare pharmacy products matching your search:`,
        products: matchedProducts,
        quickActions: [
          { label: "🛒 View Cart", action: "view_cart" },
          { label: "💊 Browse Catalog", action: "navigate", value: "medicines" }
        ]
      });
    }

    // 7. Default response
    return res.status(200).json({
      success: true,
      text: "Hello! 👋 I'm **BloomCare AI**, your clinical information and licensed pharmacy assistant.\n\nI can help you understand symptoms, explore medicine uses and precautions, check real-time product stock and prices, track deliveries across Mbarara, or connect you directly with our clinical team.",
      products: [],
      quickActions: [
        { label: "🔎 Find a Medicine", action: "suggest", "value": "Find a medicine" },
        { label: "⭐ Recommend a Product", action: "suggest", "value": "Recommend a product" },
        { label: "📦 Where is my order?", action: "suggest", "value": "Where is my order?" },
        { label: "💊 How do I upload a prescription?", action: "suggest", "value": "How do I upload a prescription?" },
        { label: "👨‍⚕️ Talk to a pharmacist", action: "suggest", "value": "Talk to a pharmacist" }
      ]
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err?.message || 'Internal Server Error' });
  }
}

