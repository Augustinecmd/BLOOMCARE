import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  ROLE_SIDEBAR_CONFIGS,
  checkRouteAccess
} from "../BLOOMCARE-main/app.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, "..");
const INDEX_HTML_PATH = path.join(ROOT_DIR, "BLOOMCARE-main", "index.html");

test("1. PHARMACIST NAVIGATION: Strictly operational - no About Us or Contact Us", () => {
  const pharmacistConfig = ROLE_SIDEBAR_CONFIGS.pharmacist;
  assert.ok(Array.isArray(pharmacistConfig), "Pharmacist sidebar config must exist as an array");

  const routes = pharmacistConfig.map(item => item.route);
  const labels = pharmacistConfig.map(item => item.label.toLowerCase());

  // Must not have About Us or Contact Us
  assert.equal(routes.includes("about"), false, "Pharmacist navigation must not contain 'about' route");
  assert.equal(routes.includes("contact"), false, "Pharmacist navigation must not contain 'contact' route");
  assert.equal(labels.some(l => l.includes("about")), false, "Pharmacist navigation must not contain 'About' label");
  assert.equal(labels.some(l => l.includes("contact")), false, "Pharmacist navigation must not contain 'Contact' label");

  // Must retain exactly operational modules
  assert.deepEqual(routes, [
    "pharmacist/dashboard",
    "pharmacist/prescriptions",
    "pharmacist/consultations",
    "pharmacist/refills",
    "pharmacist/orders",
    "pharmacist/medicines",
    "pharmacist/inventory"
  ]);
});

test("2. ASSISTANT PHARMACIST NAVIGATION: Strictly operational - no About Us or Contact Us", () => {
  const assistantConfig = ROLE_SIDEBAR_CONFIGS.assistant_pharmacist;
  assert.ok(Array.isArray(assistantConfig), "Assistant pharmacist sidebar config must exist as an array");

  const routes = assistantConfig.map(item => item.route);
  const labels = assistantConfig.map(item => item.label.toLowerCase());

  // Must not have About Us or Contact Us
  assert.equal(routes.includes("about"), false, "Assistant Pharmacist navigation must not contain 'about' route");
  assert.equal(routes.includes("contact"), false, "Assistant Pharmacist navigation must not contain 'contact' route");
  assert.equal(labels.some(l => l.includes("about")), false, "Assistant Pharmacist navigation must not contain 'About' label");
  assert.equal(labels.some(l => l.includes("contact")), false, "Assistant Pharmacist navigation must not contain 'Contact' label");

  // Must retain exactly operational modules
  assert.deepEqual(routes, [
    "assistant_pharmacist/dashboard",
    "orders",
    "medicines",
    "categories",
    "inventory"
  ]);

  // Check pharmacyAssistant alias as well
  const aliasConfig = ROLE_SIDEBAR_CONFIGS.pharmacyAssistant;
  assert.ok(Array.isArray(aliasConfig), "pharmacyAssistant alias config must exist as an array");
  const aliasRoutes = aliasConfig.map(item => item.route);
  assert.equal(aliasRoutes.includes("about"), false, "pharmacyAssistant alias must not contain 'about' route");
  assert.equal(aliasRoutes.includes("contact"), false, "pharmacyAssistant alias must not contain 'contact' route");
  assert.deepEqual(aliasRoutes, [
    "assistant_pharmacist/dashboard",
    "orders",
    "medicines",
    "categories",
    "inventory"
  ]);
});

test("3. CUSTOMER & VISITOR NAVIGATION PRESERVED: Retains About Us and Contact Us", () => {
  const customerRoutes = ROLE_SIDEBAR_CONFIGS.customer.map(i => i.route);
  assert.ok(customerRoutes.includes("about"), "Customer navigation must retain 'about' route");
  assert.ok(customerRoutes.includes("contact"), "Customer navigation must retain 'contact' route");

  const visitorRoutes = ROLE_SIDEBAR_CONFIGS.visitor.map(i => i.route);
  assert.ok(visitorRoutes.includes("about"), "Visitor navigation must retain 'about' route");
  assert.ok(visitorRoutes.includes("contact"), "Visitor navigation must retain 'contact' route");
});

test("4. PUBLIC VIEWS INTEGRITY: #view-about and #view-contact remain in DOM", () => {
  const html = fs.readFileSync(INDEX_HTML_PATH, "utf8");
  assert.ok(html.includes('id="view-about"'), "index.html must retain #view-about section");
  assert.ok(html.includes('id="view-contact"'), "index.html must retain #view-contact section");
});

test("5. ROUTE ACCESS: Public and customer access to about & contact remains available", () => {
  const publicAbout = checkRouteAccess("about", null, "visitor");
  assert.equal(publicAbout.allowed, true, "Visitors can access about route");

  const publicContact = checkRouteAccess("contact", null, "visitor");
  assert.equal(publicContact.allowed, true, "Visitors can access contact route");

  const customerAbout = checkRouteAccess("about", { role: "customer" }, "customer");
  assert.equal(customerAbout.allowed, true, "Customers can access about route");

  const customerContact = checkRouteAccess("contact", { role: "customer" }, "customer");
  assert.equal(customerContact.allowed, true, "Customers can access contact route");
});

