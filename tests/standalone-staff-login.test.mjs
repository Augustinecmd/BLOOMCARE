import assert from "node:assert/strict";
import test from "node:test";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  checkRouteAccess,
  ROLE_HOME_ROUTES,
  STATE
} from "../BLOOMCARE-main/app.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const htmlPath = path.join(rootDir, "BLOOMCARE-main", "index.html");
const cssPath = path.join(rootDir, "BLOOMCARE-main", "styles.css");
const appJsPath = path.join(rootDir, "BLOOMCARE-main", "app.js");

test("1. STANDALONE STAFF LOGIN SCREEN: HTML Structure, Branding, and Controls", () => {
  const html = fs.readFileSync(htmlPath, "utf8");

  // Check staff-login-card exists
  assert.ok(html.includes('id="staff-login-card"'), "staff-login-card must exist");

  const startIdx = html.indexOf('id="staff-login-card"');
  const endIdx = html.indexOf('</section>', startIdx);
  const cardSlice = html.substring(startIdx, endIdx !== -1 ? endIdx : startIdx + 3000);

  // Branding: Logo
  assert.ok(cardSlice.includes("bloomcare-logo.png"), "Staff login card must feature BloomCare Pharmacy logo");

  // Heading & Subtitle
  assert.ok(cardSlice.includes("BloomCare Staff Portal"), "Must contain 'BloomCare Staff Portal' heading");
  assert.ok(cardSlice.includes("Authorized Pharmacy Staff &amp; Administrator Access") || cardSlice.includes("Authorized Pharmacy Staff & Administrator Access"),
    "Must contain 'Authorized Pharmacy Staff & Administrator Access' subtitle");

  // Fields: Email & Password
  assert.ok(cardSlice.includes('id="staff-login-email"'), "Must contain email input #staff-login-email");
  assert.ok(cardSlice.includes('id="staff-login-password"'), "Must contain password input #staff-login-password");

  // Controls: Show/Hide Password Toggle
  assert.ok(cardSlice.includes('id="toggle-staff-password-btn"'), "Must contain show/hide password toggle #toggle-staff-password-btn");

  // Controls: Log In Button & Forgot Password Link
  assert.ok(cardSlice.includes('id="staff-login-submit-btn"'), "Must contain #staff-login-submit-btn");
  assert.ok(cardSlice.includes("Log In"), "Submit button must display 'Log In'");
  assert.ok(cardSlice.includes('id="staff-forgot-password-link"'), "Must contain #staff-forgot-password-link");

  // Error alert & spinner
  assert.ok(cardSlice.includes('id="staff-login-error"'), "Must contain #staff-login-error alert container");
  assert.ok(cardSlice.includes('id="staff-login-spinner"'), "Must contain #staff-login-spinner loading indicator");

  // Demo staff profiles hidden in production
  assert.ok(cardSlice.includes('style="display:none !important;"') && cardSlice.includes('demo-auth-help-box hidden'),
    "Demo staff profile buttons must be hidden in production");

  // Return to store link
  assert.ok(cardSlice.includes('id="staff-back-to-store-link"'), "Must contain #staff-back-to-store-link to return to storefront");
});

test("2. ISOLATED LAYOUT: CSS suppresses all customer chrome on staff login", () => {
  const css = fs.readFileSync(cssPath, "utf8");

  assert.ok(css.includes("body.staff-login-layout"), "styles.css must include body.staff-login-layout rules");
  assert.ok(css.includes("#app-left-sidebar"), "CSS must hide left sidebar in staff-login-layout");
  assert.ok(css.includes("#app-top-header"), "CSS must hide top header in staff-login-layout");
  assert.ok(css.includes("#marketplace-categories-bar"), "CSS must hide categories bar in staff-login-layout");
  assert.ok(css.includes("#main-bottom-footer"), "CSS must hide main footer in staff-login-layout");
  assert.ok(css.includes("#ai-assistant-fab-wrap"), "CSS must hide AI assistant FAB in staff-login-layout");
  assert.ok(css.includes(".mobile-bottom-nav"), "CSS must hide mobile bottom nav in staff-login-layout");
  assert.ok(css.includes(".password-input-wrapper"), "CSS must style password wrapper and toggle button");
  assert.ok(css.includes(".staff-auth-error-alert"), "CSS must style inline error alert");
});

test("3. ROUTE GUARDS: Unauthenticated access to staff paths is denied by checkRouteAccess", () => {
  // Visitor attempting to access staff/admin routes
  const staffProtectedRoutes = [
    "admin/dashboard",
    "admin/users",
    "admin/audit",
    "pharmacist/dashboard",
    "pharmacist/prescriptions",
    "assistant_pharmacist/dashboard",
    "delivery_person/orders",
    "inventory",
    "users",
    "reports"
  ];

  for (const route of staffProtectedRoutes) {
    const res = checkRouteAccess(route, null, "visitor");
    assert.equal(res.allowed, false, `Unauthenticated user must be blocked from ${route}`);
  }

  // Visitor accessing customer protected routes (e.g. checkout) redirects to auth
  const customerProtectedRes = checkRouteAccess("checkout", null, "visitor");
  assert.equal(customerProtectedRes.allowed, false);
  assert.equal(customerProtectedRes.redirectRoute, "auth");

  // Visitor accessing staff-login itself is permitted
  const staffLoginRes = checkRouteAccess("staff-login", null, "visitor");
  assert.equal(staffLoginRes.allowed, true, "Visitor must be allowed to access staff-login route");
});

test("4. ROLE-BASED ACCESS CONTROL: Customers cannot access staff portal or staff routes", () => {
  const customerUser = { uid: "cust-001", email: "cust@example.com", role: "customer" };

  // Customer attempting staff-login
  const staffLoginRes = checkRouteAccess("staff-login", customerUser, "customer");
  assert.equal(staffLoginRes.allowed, false, "Customer must not access staff-login");
  assert.equal(staffLoginRes.redirectRoute, "customer/dashboard");

  // Customer attempting admin/dashboard
  const adminRes = checkRouteAccess("admin/dashboard", customerUser, "customer");
  assert.equal(adminRes.allowed, false, "Customer must not access admin/dashboard");
  assert.equal(adminRes.redirectRoute, "customer/dashboard");

  // Customer attempting pharmacist/prescriptions
  const rxRes = checkRouteAccess("pharmacist/prescriptions", customerUser, "customer");
  assert.equal(rxRes.allowed, false, "Customer must not access pharmacist/prescriptions");
  assert.equal(rxRes.redirectRoute, "customer/dashboard");
});

test("5. ROLE-BASED ACCESS CONTROL: Staff privilege separation preserved", () => {
  const pharmacistUser = { uid: "pharm-001", email: "pharm@bloomcare.com", role: "pharmacist" };
  const adminUser = { uid: "admin-001", email: "admin@bloomcare.com", role: "admin" };

  // Pharmacist accessing pharmacist tools is allowed
  const pharmRes = checkRouteAccess("pharmacist/dashboard", pharmacistUser, "pharmacist");
  assert.equal(pharmRes.allowed, true, "Pharmacist must access pharmacist/dashboard");

  // Pharmacist attempting admin dashboard is blocked
  const pharmAdminRes = checkRouteAccess("admin/dashboard", pharmacistUser, "pharmacist");
  assert.equal(pharmAdminRes.allowed, false, "Pharmacist must NOT access admin/dashboard");
  assert.equal(pharmAdminRes.redirectRoute, "pharmacist/dashboard");

  // Admin accessing admin dashboard is allowed
  const adminRes = checkRouteAccess("admin/dashboard", adminUser, "admin");
  assert.equal(adminRes.allowed, true, "Admin must access admin/dashboard");
});

test("6. APPLICATION LOGIC: app.js contains show/hide toggle and logout history protection", () => {
  const appJs = fs.readFileSync(appJsPath, "utf8");

  // Password toggle listener
  assert.ok(appJs.includes("toggle-staff-password-btn"), "app.js must attach event listener for toggle-staff-password-btn");
  assert.ok(appJs.includes("staff-forgot-password-link"), "app.js must attach event listener for staff-forgot-password-link");

  // Inline error and spinner
  assert.ok(appJs.includes("staff-login-error"), "app.js must handle staff-login-error alert rendering");
  assert.ok(appJs.includes("staff-login-spinner"), "app.js must toggle staff-login-spinner");

  // Layout class toggling on body
  assert.ok(appJs.includes("staff-login-layout"), "app.js must toggle staff-login-layout on body");

  // Logout replaces history state
  assert.ok(appJs.includes('window.history.replaceState(null, "", "#staff-login")'),
    "app.js must replace history state on staff logout to prevent back button leakage");
});
