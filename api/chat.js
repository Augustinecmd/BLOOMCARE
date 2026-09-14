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

    // Check emergency red-flags
    const emergencyRegex = /\b(chest\s+pain|heart\s+attack|shortness\s+of\s+breath|can'?t\s+breathe|severe\s+difficulty\s+breathing|stroke|suicid|kill\s+myself|overdose|poison)\b/i;
    if (emergencyRegex.test(message)) {
      return res.status(200).json({
        success: true,
        text: "⚠️ **MEDICAL EMERGENCY ALERT**\n\nThe symptoms you described may indicate a serious medical emergency. **BloomCare AI is an online pharmacy assistant and cannot diagnose conditions or manage emergencies.**\n\n🚨 **Immediate Action Required:**\n1. Seek immediate in-person care at the nearest hospital (e.g. Mbarara Regional Referral Hospital).\n2. Contact emergency services or call BloomCare Urgent Support at **+256 700 000 000**.",
        products: [],
        isSafetyAlert: true,
        quickActions: [
          { label: "📞 Call Dispensary", action: "call_phone", value: "+256700000000" },
          { label: "💬 WhatsApp Care Desk", action: "whatsapp", value: "https://wa.me/256750210886?text=URGENT%20Medical%20Inquiry" }
        ]
      });
    }

    // Prescription bypass guardrail
    const bypassRegex = /\b(without\s+(a\s+)?prescription|bypass\s+prescription|skip\s+prescription|no\s+doctor\s+note|fake\s+prescription)\b/i;
    if (bypassRegex.test(message)) {
      return res.status(200).json({
        success: true,
        text: "🛡️ **Prescription Verification Policy**\n\nBloomCare Pharmacy strictly complies with National Drug Authority (NDA) Uganda regulations. **Prescription medicines (Rx) cannot be dispensed without a verified prescription.**\n\nPlease add the item to your cart and upload your prescription during checkout for clinical verification.",
        products: [],
        quickActions: [
          { label: "💊 Upload Prescription", action: "navigate", value: "prescriptions" },
          { label: "🩺 Consult Pharmacist", action: "navigate", value: "consultations" }
        ]
      });
    }

    // Search real products
    const msgLower = message.toLowerCase();
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

    // Default response
    return res.status(200).json({
      success: true,
      text: "Hello! 👋 I'm BloomCare AI, your licensed pharmacy assistant.\n\nI can help you search real medicines, check real-time stock and prices, track your delivery, or connect you with our clinical team.",
      products: [],
      quickActions: [
        { label: "🔎 Find a Medicine", action: "suggest", "value": "Find a medicine" },
        { label: "📦 Track My Order", action: "suggest", "value": "Where is my order?" },
        { label: "🚚 Delivery Fee", action: "suggest", "value": "How much is delivery?" },
        { label: "👨‍⚕️ Talk to Pharmacist", action: "suggest", "value": "Talk to a pharmacist" }
      ]
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err?.message || 'Internal Server Error' });
  }
}

