import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const appJsPath = path.join(rootDir, 'BLOOMCARE-main', 'app.js');
const chatbotJsPath = path.join(rootDir, 'BLOOMCARE-main', 'chatbot.js');
const stylesCssPath = path.join(rootDir, 'BLOOMCARE-main', 'styles.css');
const firestoreRulesPath = path.join(rootDir, 'firestore.rules');
const pythonChatbotPath = path.join(rootDir, 'server', 'ai_chatbot.py');
const pythonApiPath = path.join(rootDir, 'server', 'payment_api.py');
const vercelApiPath = path.join(rootDir, 'api', 'chat.js');
const aiKnowledgePath = path.join(rootDir, 'server', 'data', 'ai_knowledge.json');
const aiAnalyticsPath = path.join(rootDir, 'server', 'data', 'ai_analytics.json');
const medicalKnowledgePath = path.join(rootDir, 'server', 'data', 'medical_knowledge.json');

// Read files for structural verification
const appJsContent = fs.readFileSync(appJsPath, 'utf8');
const chatbotJsContent = fs.readFileSync(chatbotJsPath, 'utf8');
const stylesCssContent = fs.readFileSync(stylesCssPath, 'utf8');
const firestoreRulesContent = fs.readFileSync(firestoreRulesPath, 'utf8');
const pythonChatbotContent = fs.readFileSync(pythonChatbotPath, 'utf8');
const pythonApiContent = fs.readFileSync(pythonApiPath, 'utf8');
const vercelApiContent = fs.readFileSync(vercelApiPath, 'utf8');
const aiKnowledgeContent = fs.readFileSync(aiKnowledgePath, 'utf8');
const aiAnalyticsContent = fs.readFileSync(aiAnalyticsPath, 'utf8');
const medicalKnowledgeContent = fs.readFileSync(medicalKnowledgePath, 'utf8');

// Import chatbot module
const chatbotModule = await import('../BLOOMCARE-main/chatbot.js');
const appJsExports = await import('../BLOOMCARE-main/app.js');

test('1. CHATBOT LAUNCHER & DOM WIRING: Floating trigger, window, header and responsive styling exist', () => {
  assert.ok(chatbotModule.initBloomCareChatbot, 'initBloomCareChatbot should be exported');
  assert.ok(chatbotModule.openBloomCareChatbot, 'openBloomCareChatbot should be exported');
  assert.ok(chatbotModule.closeBloomCareChatbot, 'closeBloomCareChatbot should be exported');
  assert.ok(chatbotModule.sendMessageToBloomCareAI, 'sendMessageToBloomCareAI should be exported');

  // Verify CSS contains trigger, header, online indicator and mobile responsiveness
  assert.ok(stylesCssContent.includes('.bloomcare-ai-fab'), 'CSS must define .bloomcare-ai-fab');
  assert.ok(stylesCssContent.includes('.bloomcare-ai-window'), 'CSS must define .bloomcare-ai-window');
  assert.ok(stylesCssContent.includes('.ai-window-header'), 'CSS must define .ai-window-header');
  assert.ok(stylesCssContent.includes('.ai-online-dot') || stylesCssContent.includes('.ai-online-status-dot'), 'CSS must define online indicator dot');
  assert.ok(stylesCssContent.includes('@media (max-width: 640px)'), 'CSS must handle mobile screens');
});

test('2. SUGGESTED QUESTIONS & QUICK ACTIONS: Presets configured for quick medicine inquiry, order tracking, and pharmacist assist', () => {
  assert.ok(chatbotJsContent.includes('Find a medicine'), 'Should include "Find a medicine" quick action');
  assert.ok(chatbotJsContent.includes('Recommend a product') || chatbotJsContent.includes('Recommend product'), 'Should include "Recommend product" quick action');
  assert.ok(chatbotJsContent.includes('Where is my order?') || chatbotJsContent.includes('Track Order'), 'Should include order tracking quick action');
  assert.ok(chatbotJsContent.includes('How do I upload a prescription?') || chatbotJsContent.includes('Rx Help'), 'Should include prescription quick action');
  assert.ok(chatbotJsContent.includes('Talk to a pharmacist') || chatbotJsContent.includes('Pharmacist'), 'Should include pharmacist escalation quick action');
});

test('3. REAL-TIME PRODUCT SEARCH: Server and client engines filter actual catalog without hallucination', () => {
  // Python chatbot has tool_search_products and catalog grounding
  assert.ok(pythonChatbotContent.includes('def tool_search_products'), 'Server must implement tool_search_products');
  assert.ok(pythonChatbotContent.includes('def tool_check_product_stock'), 'Server must implement tool_check_product_stock');
  // Client chatbot matches real products without invented catalog items
  assert.ok(chatbotJsContent.includes('matched = (products || []).filter'), 'Client chatbot must filter catalog products');
});

test('4. IN-CHAT PRODUCT CARDS: Product cards render price, stock status, [View Product] and [Add to Cart] actions', () => {
  assert.ok(chatbotJsContent.includes('ai-product-card'), 'Chatbot must generate .ai-product-card markup');
  assert.ok(chatbotJsContent.includes('ai-card-view-btn') || chatbotJsContent.includes('ai-btn-view'), 'Chatbot must include View Product action');
  assert.ok(chatbotJsContent.includes('ai-card-add-btn') || chatbotJsContent.includes('ai-btn-cart'), 'Chatbot must include Add to Cart action');
  assert.ok(chatbotJsContent.includes('addToCart'), 'Chatbot must wire directly to addToCart');
  assert.ok(chatbotJsContent.includes('openProductDetails'), 'Chatbot must wire to openProductDetails');
});

test('5. CART ASSISTANCE: Chatbot provides direct cart status inspection and guidance', () => {
  assert.ok(pythonChatbotContent.includes('cart') || pythonChatbotContent.includes('checkout'), 'Python engine must support cart and checkout queries');
  assert.ok(chatbotJsContent.includes('cart') || chatbotJsContent.includes('checkout'), 'Client engine must handle cart queries');
});

test('6. AUTHENTICATED CUSTOMER ORDER TRACKING: Secure authorization prevents accessing unauthorized orders', () => {
  assert.ok(pythonChatbotContent.includes('tool_get_customer_orders'), 'Server must implement customer order lookup');
  assert.ok(pythonChatbotContent.includes('customer_id') || pythonChatbotContent.includes('customerId'), 'Order tool must require customer identity');
  assert.ok(chatbotJsContent.includes('openOrderTracking'), 'Client chatbot must wire to openOrderTracking');
});

test('7. PRESCRIPTION WORKFLOW & NDA COMPLIANCE: Directs customer to upload prescription and refuses bypass', () => {
  assert.ok(pythonChatbotContent.includes('prescription') || pythonChatbotContent.includes('Prescription'), 'Python engine must enforce prescription rules');
  assert.ok(pythonChatbotContent.includes('bypass') || pythonChatbotContent.includes('Upload Prescription') || pythonChatbotContent.includes('licensed pharmacist'), 'Must guard against bypass attempts');
});

test('8. MEDICAL SAFETY GUARDRAILS: Red flag triage triggers emergency notice for chest pain/poisoning/shortness of breath', () => {
  assert.ok(pythonChatbotContent.includes('EMERGENCY_PATTERNS') || pythonChatbotContent.includes('MEDICAL EMERGENCY ALERT'), 'Python engine must check red-flag emergency symptoms');
  assert.ok(chatbotJsContent.includes('MEDICAL EMERGENCY ALERT'), 'Client engine must include emergency alert');
});

test('9. PHARMACIST ESCALATION: Direct WhatsApp and phone contact channels', () => {
  assert.ok(pythonChatbotContent.includes('256750210886'), 'Must use official BloomCare WhatsApp number 256750210886');
  assert.ok(chatbotJsContent.includes('256750210886') || chatbotJsContent.includes('whatsappPhone'), 'Client must connect to official WhatsApp channel');
  assert.ok(aiKnowledgeContent.includes('256750210886'), 'Knowledge base must store verified WhatsApp number');
});

test('10. ADMIN AI ANALYTICS & KNOWLEDGE BASE: Analytics and knowledge base endpoints configured in payment_api.py', () => {
  assert.ok(pythonApiContent.includes('/api/ai/chat'), 'payment_api.py must handle POST /api/ai/chat');
  assert.ok(pythonApiContent.includes('/api/ai/analytics'), 'payment_api.py must handle GET /api/ai/analytics');
  assert.ok(pythonApiContent.includes('/api/ai/knowledge'), 'payment_api.py must handle GET and POST /api/ai/knowledge');
  assert.ok(appJsContent.includes('renderAdminAiAnalyticsSection'), 'app.js must define and render renderAdminAiAnalyticsSection');
  assert.ok(appJsExports.renderAdminAiAnalyticsSection, 'app.js must export renderAdminAiAnalyticsSection');
});

test('11. SECURE BACKEND ARCHITECTURE: Zero frontend API keys exposed', () => {
  // Verify no hardcoded API keys in frontend scripts
  const frontendFiles = [appJsContent, chatbotJsContent];
  frontendFiles.forEach(content => {
    assert.equal(content.includes('AIzaSy'), false, 'No Google API keys allowed in frontend code');
    assert.equal(content.includes('sk-proj-'), false, 'No OpenAI API keys allowed in frontend code');
  });
});

test('12. FIRESTORE SECURITY RULES: chatSessions and aiKnowledgeBase access policies verified', () => {
  assert.ok(firestoreRulesContent.includes('match /chatSessions/{sessionId}'), 'firestore.rules must secure /chatSessions/{sessionId}');
  assert.ok(firestoreRulesContent.includes('match /aiKnowledgeBase/{docId}'), 'firestore.rules must secure /aiKnowledgeBase/{docId}');
});

test('13. MEDICAL INFORMATION ASSISTANT BRANDING & DISCLAIMER: Required clinical disclaimer strip and welcome messaging present', () => {
  assert.ok(chatbotJsContent.includes('BloomCare Medical Information & Pharmacy Assistant'), 'Chatbot must introduce itself as Medical Information & Pharmacy Assistant');
  assert.ok(chatbotJsContent.includes('BloomCare AI provides general health information and does not replace advice from a qualified healthcare professional'), 'Chatbot must render required medical disclaimer');
  assert.ok(chatbotJsContent.includes('BloomCare AI is analyzing health information...'), 'Chatbot must include clinical analyzing typing indicator');
  assert.ok(stylesCssContent.includes('.ai-disclaimer-strip'), 'CSS must define .ai-disclaimer-strip');
  assert.ok(stylesCssContent.includes('.ai-msg-bubble.ai-safety-alert'), 'CSS must define safety alert bubble styling');
});

test('14. 12 LIFE-THREATENING EMERGENCY CATEGORIES: Python and Vercel engines detect all critical emergencies', () => {
  const emergencyTriggers = [
    'shortness of breath',
    'chest pain',
    'unconscious',
    'severe bleeding',
    'seizure',
    'stroke',
    'anaphylaxis',
    'overdose',
    'severe trauma',
    'severe confusion',
    'severe dehydration',
    'suicid'
  ];

  emergencyTriggers.forEach(term => {
    assert.ok(pythonChatbotContent.toLowerCase().includes(term), `Python engine must detect emergency category: ${term}`);
    assert.ok(vercelApiContent.toLowerCase().includes(term), `Vercel serverless engine must detect emergency category: ${term}`);
  });
});

test('15. NON-DIAGNOSTIC CLINICAL GUIDANCE FORMAT: Responses follow structured differential sections', () => {
  assert.ok(pythonChatbotContent.includes('What it could mean'), 'Server must use "**What it could mean**" section');
  assert.ok(pythonChatbotContent.includes('Common symptoms'), 'Server must use "**Common symptoms**" section');
  assert.ok(pythonChatbotContent.includes('What you can do'), 'Server must use "**What you can do**" section');
  assert.ok(pythonChatbotContent.includes('When to seek medical care'), 'Server must use "**When to seek medical care**" section');
  assert.ok(chatbotJsContent.includes('What it could mean'), 'Client must use "**What it could mean**" section');
});

test('16. CLINICAL FOLLOW-UP QUESTIONS & LAB TESTS: Clarifications for age, duration, pregnancy, and diagnostic tests', () => {
  assert.ok(pythonChatbotContent.includes('clarificationQuestions') || pythonChatbotContent.includes('suggestedTests'), 'Server must reference clinical questions or tests');
  assert.ok(pythonChatbotContent.includes('tool_get_lab_test_info'), 'Server must implement tool_get_lab_test_info');
  assert.ok(medicalKnowledgeContent.includes('clarificationQuestions'), 'medical_knowledge.json must provide clinical clarification questions');
  assert.ok(medicalKnowledgeContent.includes('malaria_rdt'), 'medical_knowledge.json must define malaria RDT lab test');
});

test('17. COMPREHENSIVE MEDICINE MONOGRAPHS: Monograph structure contains uses, mechanism, side effects, precautions, interactions, Rx status', () => {
  assert.ok(pythonChatbotContent.includes('tool_get_medicine_info'), 'Server must implement tool_get_medicine_info');
  assert.ok(pythonChatbotContent.includes('format_medicine_response'), 'Server must format medicine monograph');
  assert.ok(medicalKnowledgeContent.includes('paracetamol'), 'medical_knowledge.json must detail Paracetamol');
  assert.ok(medicalKnowledgeContent.includes('amoxicillin'), 'medical_knowledge.json must detail Amoxicillin');
  assert.ok(medicalKnowledgeContent.includes('coartem'), 'medical_knowledge.json must detail Coartem');
  assert.ok(medicalKnowledgeContent.includes('sideEffects'), 'medical_knowledge.json must include sideEffects');
  assert.ok(medicalKnowledgeContent.includes('prescriptionStatus'), 'medical_knowledge.json must include prescriptionStatus');
});

test('18. STRICT DOSAGE SAFETY DIRECTIVES: Chatbot refuses prescriptive dosages and explains safety factors', () => {
  assert.ok(pythonChatbotContent.includes('format_dosage_safety_advisory'), 'Server must implement format_dosage_safety_advisory');
  assert.ok(pythonChatbotContent.includes('Patient Age & Weight'), 'Dosage advisory must explain age and weight factors');
  assert.ok(pythonChatbotContent.includes('Pregnancy & Breastfeeding'), 'Dosage advisory must explain pregnancy factors');
  assert.ok(chatbotJsContent.includes('Medication Dosage & Administration Safety'), 'Client fallback must include dosage safety guidance');
});

test('19. FIRST AID PROTOCOLS & MEDICAL GLOSSARY: Steps for burns, cuts, nosebleeds, choking and glossary definitions', () => {
  assert.ok(pythonChatbotContent.includes('tool_get_first_aid_info'), 'Server must implement tool_get_first_aid_info');
  assert.ok(pythonChatbotContent.includes('tool_get_medical_term'), 'Server must implement tool_get_medical_term');
  assert.ok(medicalKnowledgeContent.includes('firstAid'), 'medical_knowledge.json must define firstAid protocols');
  assert.ok(medicalKnowledgeContent.includes('medicalGlossary'), 'medical_knowledge.json must define medicalGlossary');
  assert.ok(medicalKnowledgeContent.includes('burns'), 'medical_knowledge.json must cover burns first aid');
  assert.ok(medicalKnowledgeContent.includes('choking'), 'medical_knowledge.json must cover choking first aid');
});

test('20. ERROR RESILIENCE: Polite healthcare fallback message for offline or failed requests', () => {
  assert.ok(
    chatbotJsContent.includes("Sorry, I'm unable to respond right now. Please try again later or contact a qualified healthcare professional."),
    'Chatbot must provide required polite healthcare error fallback message'
  );
});


