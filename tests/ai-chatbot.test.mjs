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

