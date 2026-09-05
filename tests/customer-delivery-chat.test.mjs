import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const appJsPath = path.resolve(rootDir, "BLOOMCARE-main", "app.js");
const indexHtmlPath = path.resolve(rootDir, "BLOOMCARE-main", "index.html");
const stylesCssPath = path.resolve(rootDir, "BLOOMCARE-main", "styles.css");
const firestoreRulesPath = path.resolve(rootDir, "firestore.rules");

test("1. MODULE REMOVAL: About Us & Contact Us completely removed from Delivery Man navigation", async () => {
  const { ROLE_SIDEBAR_CONFIGS } = await import("../BLOOMCARE-main/app.js");
  const deliveryItems = ROLE_SIDEBAR_CONFIGS.delivery_person;
  assert.ok(deliveryItems, "delivery_person sidebar config must exist");

  const hasAbout = deliveryItems.some(item => item.route === "about" || item.label.includes("About"));
  const hasContact = deliveryItems.some(item => item.route === "contact" || item.label.includes("Contact"));

  assert.equal(hasAbout, false, "About Us must not be in delivery_person sidebar");
  assert.equal(hasContact, false, "Contact Us must not be in delivery_person sidebar");
});

test("2. PRESERVATION: About Us & Contact Us preserved for Visitors and Customers", () => {
  const indexHtml = fs.readFileSync(indexHtmlPath, "utf-8");
  assert.ok(indexHtml.includes('data-route="about"'), "data-route=about must exist in index.html for visitors");
  assert.ok(indexHtml.includes('data-route="contact"'), "data-route=contact must exist in index.html for visitors");
});

test("3. ROUTE GUARDS: Delivery Person blocked from navigating to About Us or Contact Us", async () => {
  const { checkRouteAccess } = await import("../BLOOMCARE-main/app.js");

  const deliveryUser = { uid: "usr-5", role: "delivery_person", email: "delivery@bloomcare.com" };
  const customerUser = { uid: "usr-1", role: "customer", email: "customer@example.com" };

  const aboutAccessDelivery = checkRouteAccess("about", deliveryUser);
  assert.equal(aboutAccessDelivery.allowed, false, "Delivery person must not be allowed access to /about");
  assert.equal(aboutAccessDelivery.redirectRoute, "delivery_person/dashboard", "Delivery person navigating to /about must redirect to dashboard");

  const contactAccessDelivery = checkRouteAccess("contact", deliveryUser);
  assert.equal(contactAccessDelivery.allowed, false, "Delivery person must not be allowed access to /contact");
  assert.equal(contactAccessDelivery.redirectRoute, "delivery_person/dashboard", "Delivery person navigating to /contact must redirect to dashboard");

  const aboutAccessCustomer = checkRouteAccess("about", customerUser);
  assert.equal(aboutAccessCustomer.allowed, true, "Customer must have allowed access to /about");

  const contactAccessCustomer = checkRouteAccess("contact", customerUser);
  assert.equal(contactAccessCustomer.allowed, true, "Customer must have allowed access to /contact");
});

test("4. CUSTOMER CHAT SIDEBAR ITEM: Added to Delivery Person with unread badge", async () => {
  const { ROLE_SIDEBAR_CONFIGS } = await import("../BLOOMCARE-main/app.js");
  const deliveryItems = ROLE_SIDEBAR_CONFIGS.delivery_person;

  const chatItem = deliveryItems.find(item => item.label === "Customer Chat");
  assert.ok(chatItem, "Customer Chat item must exist in delivery sidebar");
  assert.equal(chatItem.badgeId, "delivery-chat-unread-badge", "Badge ID must match delivery-chat-unread-badge");
});

test("5. DELIVERY DASHBOARD: Customer Chat KPI and quick access card integrated", () => {
  const appJs = fs.readFileSync(appJsPath, "utf-8");
  assert.ok(appJs.includes("dash-active-chats-count"), "Dashboard must have active chats counter");
  assert.ok(appJs.includes("dash-unread-chats-count"), "Dashboard must have unread chats counter");
});

test("6. DOM STRUCTURE: index.html contains Delivery Chat Pane (#view-customer-chat)", () => {
  const indexHtml = fs.readFileSync(indexHtmlPath, "utf-8");
  assert.ok(indexHtml.includes('id="view-customer-chat"'), "#view-customer-chat section must exist");
  assert.ok(indexHtml.includes('id="chat-sidebar-pane"'), "#chat-sidebar-pane must exist");
  assert.ok(indexHtml.includes('id="chat-search-input"'), "#chat-search-input must exist");
  assert.ok(indexHtml.includes('id="chat-conversations-list"'), "#chat-conversations-list must exist");
  assert.ok(indexHtml.includes('id="chat-main-pane"'), "#chat-main-pane must exist");
  assert.ok(indexHtml.includes('id="chat-empty-selection"'), "#chat-empty-selection placeholder must exist");
  assert.ok(indexHtml.includes('id="chat-active-box"'), "#chat-active-box must exist");
  assert.ok(indexHtml.includes('id="chat-header-bar"'), "#chat-header-bar must exist");
  assert.ok(indexHtml.includes('id="chat-completed-notice"'), "#chat-completed-notice banner must exist");
  assert.ok(indexHtml.includes('id="chat-messages-stream"'), "#chat-messages-stream must exist");
  assert.ok(indexHtml.includes('id="delivery-chat-form"'), "#delivery-chat-form must exist");
  assert.ok(indexHtml.includes('id="delivery-chat-input"'), "#delivery-chat-input must exist");
  assert.ok(indexHtml.includes('id="chat-char-counter"'), "#chat-char-counter must exist");
});

test("7. DOM STRUCTURE: index.html contains Customer Chat Modal (#customer-order-chat-dialog)", () => {
  const indexHtml = fs.readFileSync(indexHtmlPath, "utf-8");
  assert.ok(indexHtml.includes('id="customer-order-chat-dialog"'), "#customer-order-chat-dialog modal must exist");
  assert.ok(indexHtml.includes('id="customer-chat-modal-title"'), "#customer-chat-modal-title must exist");
  assert.ok(indexHtml.includes('id="customer-chat-completed-notice"'), "#customer-chat-completed-notice banner must exist");
  assert.ok(indexHtml.includes('id="customer-chat-stream"'), "#customer-chat-stream must exist");
  assert.ok(indexHtml.includes('id="customer-chat-form"'), "#customer-chat-form must exist");
  assert.ok(indexHtml.includes('id="customer-chat-input"'), "#customer-chat-input must exist");
  assert.ok(indexHtml.includes('id="customer-chat-char-counter"'), "#customer-chat-char-counter must exist");
});

test("8. CSS STYLING: styles.css contains modern layout, bubbles, badges, and completed notice", () => {
  const stylesCss = fs.readFileSync(stylesCssPath, "utf-8");
  assert.ok(stylesCss.includes(".chat-layout-grid"), ".chat-layout-grid must be defined");
  assert.ok(stylesCss.includes(".chat-sidebar-pane"), ".chat-sidebar-pane must be defined");
  assert.ok(stylesCss.includes(".chat-conv-item"), ".chat-conv-item must be defined");
  assert.ok(stylesCss.includes(".chat-unread-badge"), ".chat-unread-badge must be defined");
  assert.ok(stylesCss.includes(".chat-completed-notice"), ".chat-completed-notice must be defined");
  assert.ok(stylesCss.includes(".chat-bubble"), ".chat-bubble must be defined");
  assert.ok(stylesCss.includes(".chat-message-row.outgoing"), "outgoing chat message styling must be defined");
  assert.ok(stylesCss.includes(".chat-message-row.incoming"), "incoming chat message styling must be defined");
  assert.ok(stylesCss.includes(".chat-quick-btn"), "quick action buttons styling must be defined");
});

test("9. FIRESTORE SECURITY RULES: Rule 14 protects conversations and messages subcollections", () => {
  const rules = fs.readFileSync(firestoreRulesPath, "utf-8");
  assert.ok(rules.includes("match /conversations/{conversationId}"), "Rule for /conversations must exist");
  assert.ok(rules.includes("match /messages/{messageId}"), "Rule for /messages subcollection must exist");
  assert.ok(rules.includes("resource.data.customerId == request.auth.uid"), "Customer ID security guard must be present");
  assert.ok(rules.includes("resource.data.deliveryManId == request.auth.uid"), "Delivery Man ID security guard must be present");
});

test("10. 1:1 ORDER-LINKED CONVERSATIONS: getOrCreateOrderDeliveryChat generates consistent conversation", async () => {
  const { getOrCreateOrderDeliveryChat, STATE } = await import("../BLOOMCARE-main/app.js");
  const conv = getOrCreateOrderDeliveryChat("BC-ORD-0042");
  assert.ok(conv, "Conversation must be returned");
  assert.equal(conv.orderId, "BC-ORD-0042", "Conversation must be linked to BC-ORD-0042");
  const refId = conv.id || conv.conversationId;
  assert.ok(refId && refId.includes("BC-ORD-0042"), "Conversation ID must reflect order reference");
  assert.ok(conv.customerName, "Conversation must have customer name");
  assert.ok(conv.deliveryManName, "Conversation must have assigned delivery driver");
});

test("11. DATA ISOLATION & ACCESS CONTROL: Drivers and Customers only access their own chats", async () => {
  const { canUserAccessConversation } = await import("../BLOOMCARE-main/app.js");
  const mockConv = {
    id: "CHAT-TEST-01",
    conversationId: "CHAT-TEST-01",
    orderId: "ORD-TEST-01",
    customerId: "usr-1",
    customerEmail: "sarah.namubiru@example.com",
    customerName: "Sarah Namubiru",
    deliveryManId: "usr-5",
    deliveryManName: "Moses Kato",
    deliveryStatus: "OUT_FOR_DELIVERY",
    status: "ACTIVE"
  };

  const assignedDriver = { uid: "usr-5", role: "delivery_person", displayName: "Moses Kato" };
  assert.equal(canUserAccessConversation(mockConv, assignedDriver, "delivery_person"), true, "Assigned driver must have access");

  const otherDriver = { uid: "usr-6", role: "delivery_person", displayName: "Emmanuel Otim" };
  assert.equal(canUserAccessConversation(mockConv, otherDriver, "delivery_person"), false, "Unassigned driver must NOT have access");

  const assignedCustomer = { uid: "usr-1", role: "customer", email: "sarah.namubiru@example.com" };
  assert.equal(canUserAccessConversation(mockConv, assignedCustomer, "customer"), true, "Assigned customer must have access");

  const otherCustomer = { uid: "usr-99", role: "customer", email: "other@example.com" };
  assert.equal(canUserAccessConversation(mockConv, otherCustomer, "customer"), false, "Unassigned customer must NOT have access");

  const adminUser = { uid: "usr-admin", role: "admin" };
  assert.equal(canUserAccessConversation(mockConv, adminUser, "admin"), true, "Admin must have audit access");
});

test("12. MESSAGE VALIDATION: Rejects empty strings and whitespace-only text", async () => {
  const { sendChatMessage, STATE } = await import("../BLOOMCARE-main/app.js");
  const conv = STATE.conversations.find(c => c.status === "ACTIVE") || STATE.conversations[0];
  assert.ok(conv, "Active conversation must exist for testing");

  const convId = conv.id || conv.conversationId;
  const emptyResult = sendChatMessage(convId, "");
  assert.equal(emptyResult.success, false, "Empty string message must be rejected");

  const whitespaceResult = sendChatMessage(convId, "     \n  \t  ");
  assert.equal(whitespaceResult.success, false, "Whitespace-only message must be rejected");
});

test("13. MESSAGE LENGTH VALIDATION: Enforces 500-character upper boundary", async () => {
  const { sendChatMessage, STATE } = await import("../BLOOMCARE-main/app.js");
  const conv = STATE.conversations.find(c => c.status === "ACTIVE") || STATE.conversations[0];
  assert.ok(conv, "Active conversation must exist for testing");

  const convId = conv.id || conv.conversationId;
  const longText = "A".repeat(501);
  const result = sendChatMessage(convId, longText);
  assert.equal(result.success, false, "Messages over 500 characters must be rejected");
  assert.ok(result.error.includes("500"), "Error message must mention 500 characters");
});

test("14. COMPLETED ORDER IMMUTABILITY: Messaging closed when order is delivered or completed", async () => {
  const { sendChatMessage, STATE } = await import("../BLOOMCARE-main/app.js");
  let completedConv = STATE.conversations.find(c => c.status === "COMPLETED" || c.deliveryStatus === "DELIVERED" || c.deliveryStatus === "Delivered");
  if (!completedConv) {
    completedConv = {
      id: "CHAT-COMPLETED-TEST",
      conversationId: "CHAT-COMPLETED-TEST",
      orderId: "BC-ORD-COMPLETED",
      orderRef: "BC-ORD-COMPLETED",
      customerId: "usr-1",
      customerName: "Sarah Namubiru",
      deliveryManId: "usr-5",
      deliveryManName: "Moses Kato",
      deliveryStatus: "DELIVERED",
      status: "COMPLETED",
      unreadCountForDelivery: 0,
      unreadCountForCustomer: 0
    };
    STATE.conversations.push(completedConv);
  }

  const convId = completedConv.id || completedConv.conversationId;
  const result = sendChatMessage(convId, "Hello, can you still deliver?");
  assert.equal(result.success, false, "Sending a message to a completed delivery must fail");
  assert.ok(result.error.toLowerCase().includes("completed") || result.error.toLowerCase().includes("closed"), "Error message must state messaging is closed");
});

test("15. READ STATUS & UNREAD COUNTERS: markConversationMessagesAsRead resets unread count", async () => {
  const { markConversationMessagesAsRead, STATE } = await import("../BLOOMCARE-main/app.js");
  const testConv = {
    id: "CHAT-READ-TEST",
    conversationId: "CHAT-READ-TEST",
    orderId: "BC-ORD-TEST-READ",
    customerId: "usr-1",
    customerName: "Sarah Namubiru",
    deliveryManId: "usr-5",
    deliveryManName: "Moses Kato",
    deliveryStatus: "OUT_FOR_DELIVERY",
    status: "ACTIVE",
    unreadCountForDelivery: 3,
    unreadCountForCustomer: 2,
    unreadDelivery: 3,
    unreadCustomer: 2
  };
  STATE.conversations.push(testConv);

  markConversationMessagesAsRead("CHAT-READ-TEST", "delivery");
  assert.equal(testConv.unreadCountForDelivery, 0, "unreadCountForDelivery must be reset to 0 after reading");

  markConversationMessagesAsRead("CHAT-READ-TEST", "customer");
  assert.equal(testConv.unreadCountForCustomer, 0, "unreadCountForCustomer must be reset to 0 after reading");
});

test("16. ZERO EXTERNAL REDIRECTS: Internal real-time chat links Customer <-> Delivery directly", () => {
  const indexHtml = fs.readFileSync(indexHtmlPath, "utf-8");
  const chatPaneMatch = indexHtml.match(/<section[^>]*id="view-customer-chat"[\s\S]*?<\/section>/);
  assert.ok(chatPaneMatch, "#view-customer-chat must exist");
  assert.ok(!chatPaneMatch[0].includes("wa.me"), "Customer Chat module must not contain external WhatsApp links");

  const chatModalMatch = indexHtml.match(/<dialog[^>]*id="customer-order-chat-dialog"[\s\S]*?<\/dialog>/);
  assert.ok(chatModalMatch, "#customer-order-chat-dialog must exist");
  assert.ok(!chatModalMatch[0].includes("wa.me"), "Customer order chat modal must not contain external WhatsApp links");
});
