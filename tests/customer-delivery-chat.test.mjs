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

test("14. CHAT ACCESSIBILITY & NON-CLOSING RULE: Messaging remains open and accessible even when order is delivered or completed", async () => {
  const { sendChatMessage, STATE } = await import("../BLOOMCARE-main/app.js");
  const completedConv = {
    id: "CHAT-COMPLETED-TEST",
    conversationId: "CHAT-COMPLETED-TEST",
    orderId: "BC-ORD-COMPLETED-TEST",
    orderRef: "BC-ORD-COMPLETED-TEST",
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

  const convId = completedConv.id;
  const result = sendChatMessage(convId, "Hello, following up on my delivery confirmation.");
  assert.equal(result.success, true, "Sending a message to a completed delivery must succeed per non-closing rule");
  assert.ok(result.message, "Sent message object must be returned");
  assert.equal(result.message.text, "Hello, following up on my delivery confirmation.");
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

test("17. IMMEDIATE CONVERSATION CREATION: Chat is initialized immediately without assigned delivery driver", async () => {
  const { getOrCreateOrderDeliveryChat, STATE } = await import("../BLOOMCARE-main/app.js");
  
  const testOrderRef = `BC-TEST-${Date.now()}`;
  const unassignedOrder = {
    id: testOrderRef,
    orderNumber: testOrderRef,
    customerId: "usr-test-customer",
    customerName: "Alice Nambi",
    customerPhone: "0772111222",
    customerEmail: "alice@example.com",
    fulfillmentType: "delivery",
    deliveryAddress: "Plot 10, High Street, Mbarara",
    orderStatus: "Confirmed",
    assignedStaff: "Pending Assignment"
  };
  STATE.orders.push(unassignedOrder);

  const conv = getOrCreateOrderDeliveryChat(testOrderRef);
  assert.ok(conv, "Conversation must be initialized immediately");
  assert.equal(conv.orderId, testOrderRef, "Conversation must link to order");
  assert.equal(conv.customerId, "usr-test-customer", "Conversation must have customerId");
  assert.equal(conv.deliveryManId, null, "deliveryManId must be null before driver assignment");
  assert.equal(conv.status, "ACTIVE", "Conversation status must be ACTIVE");
});

test("18. PRE-ASSIGNMENT MESSAGING: Customer can send messages immediately before driver assignment", async () => {
  const { getOrCreateOrderDeliveryChat, sendChatMessage, STATE } = await import("../BLOOMCARE-main/app.js");
  
  const testOrderRef = `BC-PRE-${Date.now()}`;
  const unassignedOrder = {
    id: testOrderRef,
    orderNumber: testOrderRef,
    customerId: "usr-test-customer",
    customerName: "Alice Nambi",
    orderStatus: "Confirmed",
    assignedStaff: "Pending Assignment"
  };
  STATE.orders.push(unassignedOrder);

  const conv = getOrCreateOrderDeliveryChat(testOrderRef);
  assert.equal(conv.deliveryManId, null, "Driver must not be assigned yet");

  const customerUser = { uid: "usr-test-customer", displayName: "Alice Nambi", role: "customer" };
  const result = sendChatMessage(conv.id, "Please call when you reach the blue gate.", customerUser);
  
  assert.equal(result.success, true, "Customer sending message prior to driver assignment must succeed");
  assert.ok(result.message, "Saved message object returned");
  assert.equal(result.message.text, "Please call when you reach the blue gate.");
  assert.equal(result.message.senderRole, "customer");
  assert.equal(result.message.recipientRole, "delivery");

  // Verify message is in STATE.messages
  const foundMsg = STATE.messages.find(m => m.conversationId === conv.id);
  assert.ok(foundMsg, "Message must be stored and preserved in STATE.messages");
  assert.equal(foundMsg.text, "Please call when you reach the blue gate.");
});

test("19. DRIVER ASSIGNMENT SYNC & MESSAGE PRESERVATION: Updating driver syncs conversation without duplicates", async () => {
  const { getOrCreateOrderDeliveryChat, sendChatMessage, STATE } = await import("../BLOOMCARE-main/app.js");
  
  const testOrderRef = `BC-SYNC-${Date.now()}`;
  const testOrder = {
    id: testOrderRef,
    orderNumber: testOrderRef,
    customerId: "usr-cust-99",
    customerName: "James Kato",
    orderStatus: "Confirmed",
    assignedStaff: "Pending Assignment"
  };
  STATE.orders.push(testOrder);

  // 1. Immediate conversation creation
  const conv = getOrCreateOrderDeliveryChat(testOrderRef);
  const initialConvCount = STATE.conversations.filter(c => c.orderId === testOrderRef).length;
  assert.equal(initialConvCount, 1, "Exactly one conversation created");

  // 2. Customer sends pre-assignment message
  sendChatMessage(conv.id, "I will be waiting outside.", { uid: "usr-cust-99", displayName: "James Kato", role: "customer" });

  // 3. Admin assigns driver "Moses Kato"
  testOrder.assignedStaff = "Moses Kato";
  conv.deliveryManName = "Moses Kato";
  conv.deliveryManId = "usr-5";
  conv.deliveryStatus = "ASSIGNED";

  // Re-requesting conversation must return existing conversation, not create duplicate
  const convAfterAssign = getOrCreateOrderDeliveryChat(testOrderRef);
  assert.equal(convAfterAssign.id, conv.id, "Must return existing conversation");
  assert.equal(convAfterAssign.deliveryManName, "Moses Kato", "Driver name must be updated");
  assert.equal(convAfterAssign.deliveryManId, "usr-5", "Driver ID must be updated");

  const totalConvCount = STATE.conversations.filter(c => c.orderId === testOrderRef).length;
  assert.equal(totalConvCount, 1, "Must never duplicate conversation on driver assignment");

  // 4. Assigned driver Moses Kato can view prior customer message
  const driverMsgs = STATE.messages.filter(m => m.conversationId === conv.id);
  assert.ok(driverMsgs.length >= 1, "Assigned driver must see all prior customer messages");
  assert.equal(driverMsgs[0].text, "I will be waiting outside.");
});

test("20. ACCESS CONTROL & DATA ISOLATION: Unassigned drivers blocked, assigned driver and customer allowed", async () => {
  const { canUserAccessConversation } = await import("../BLOOMCARE-main/app.js");

  const unassignedConv = {
    id: "CHAT-UNASSIGNED-TEST",
    orderId: "BC-UNASSIGNED",
    customerId: "usr-cust-123",
    customerName: "Grace Nakato",
    deliveryManId: null,
    deliveryManName: null,
    status: "ACTIVE"
  };

  const driverUser = { uid: "usr-5", role: "delivery_person", displayName: "Moses Kato" };
  const customerUser = { uid: "usr-cust-123", role: "customer", displayName: "Grace Nakato" };
  const otherCustomer = { uid: "usr-other", role: "customer", displayName: "Other Person" };

  assert.equal(canUserAccessConversation(unassignedConv, driverUser, "delivery_person"), false, "Driver cannot access unassigned chat");
  assert.equal(canUserAccessConversation(unassignedConv, customerUser, "customer"), true, "Customer can access their own unassigned chat");
  assert.equal(canUserAccessConversation(unassignedConv, otherCustomer, "customer"), false, "Other customer cannot access");

  // Now assign driver
  const assignedConv = { ...unassignedConv, deliveryManId: "usr-5", deliveryManName: "Moses Kato" };
  assert.equal(canUserAccessConversation(assignedConv, driverUser, "delivery_person"), true, "Assigned driver can access chat");
});

test("21. UI MARKUP: Customer chat modal contains pre-assignment notice and enabled chat form", () => {
  const indexHtml = fs.readFileSync(indexHtmlPath, "utf-8");
  assert.ok(indexHtml.includes('id="customer-chat-preassign-notice"'), "Pre-assignment notice banner must exist in modal");
  assert.ok(indexHtml.includes('id="receipt-chat-driver-btn"'), "Receipt chat driver action button must exist");
  assert.ok(indexHtml.includes('id="customer-chat-form"'), "Customer chat form must exist");
  assert.ok(indexHtml.includes('id="customer-chat-send-btn"'), "Customer chat send button must exist");
});

test("22. DASHBOARD INTEGRATION: Customer and Delivery dashboard messages sections defined", () => {
  const appJs = fs.readFileSync(appJsPath, "utf-8");
  assert.ok(appJs.includes("customer-messages-card"), "Customer dashboard must have Messages section");
  assert.ok(appJs.includes("CUSTOMER CHAT"), "Delivery dashboard must have Customer Chat section");
});

