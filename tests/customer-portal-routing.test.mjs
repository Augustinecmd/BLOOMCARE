import assert from "node:assert/strict";
import test from "node:test";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  registerUser,
  loginUser,
  findUserProfile,
  checkRouteAccess,
  ROLE_HOME_ROUTES,
  ROLE_SIDEBAR_CONFIGS,
  STATE
} from "../BLOOMCARE-main/app.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const htmlPath = path.join(rootDir, "BLOOMCARE-main", "index.html");
const appJsPath = path.join(rootDir, "BLOOMCARE-main", "app.js");

test("1. CUSTOMER REGISTRATION: Individual and Business accounts auto-authenticate with customer role and redirect to customer/dashboard", async () => {
  // 1A. Register Individual Customer
  const indEmail = `ind.${Date.now()}@example.com`;
  const indRes = await registerUser({
    fullName: "Grace Individual",
    email: indEmail,
    phone: "0772111222",
    password: "123456",
    accountType: "INDIVIDUAL"
  });

  assert.equal(indRes.success, true);
  assert.equal(indRes.user.role, "customer");
  assert.equal(indRes.user.accountType, "INDIVIDUAL");
  assert.equal(indRes.user.status, "active");
  assert.equal(indRes.redirectRoute, "customer/dashboard");

  // 1B. Register Business Customer
  const bizEmail = `biz.${Date.now()}@example.com`;
  const bizRes = await registerUser({
    fullName: "Kampala Clinic Supplies",
    email: bizEmail,
    phone: "0772333444",
    password: "654321",
    accountType: "BUSINESS"
  });

  assert.equal(bizRes.success, true);
  assert.equal(bizRes.user.role, "customer");
  assert.equal(bizRes.user.accountType, "BUSINESS");
  assert.equal(bizRes.user.status, "active");
  assert.equal(bizRes.redirectRoute, "customer/dashboard");

  // 1C. Customer Login preserves accountType and routes to customer/dashboard
  const loginRes = await loginUser({ identifier: bizEmail, password: "654321" });
  assert.equal(loginRes.success, true);
  assert.equal(loginRes.user.role, "customer");
  assert.equal(loginRes.user.accountType, "BUSINESS");
  assert.equal(loginRes.redirectRoute, "customer/dashboard");
});

test("2. ROLE-BASED HOME ROUTES: Verifies all roles map to their dedicated home dashboards", () => {
  assert.equal(ROLE_HOME_ROUTES.customer, "customer/dashboard");
  assert.equal(ROLE_HOME_ROUTES.admin, "admin/dashboard");
  assert.equal(ROLE_HOME_ROUTES.pharmacist, "pharmacist/dashboard");
  assert.ok(
    ROLE_HOME_ROUTES.assistant_pharmacist === "assistant_pharmacist/dashboard" ||
    ROLE_HOME_ROUTES.assistant_pharmacist === "assistant-pharmacist/dashboard"
  );
  assert.ok(
    ROLE_HOME_ROUTES.delivery_person === "delivery_person/dashboard" ||
    ROLE_HOME_ROUTES.delivery_person === "delivery/dashboard"
  );
  assert.equal(ROLE_HOME_ROUTES.developer, "developer/dashboard");
});

test("3. CUSTOMER SHIELDING: Customer is strictly denied access to staff portal, staff login, and staff tools", () => {
  const customerUser = {
    uid: "cust-test-123",
    email: "customer@example.com",
    displayName: "Jane Customer",
    role: "customer"
  };

  const forbiddenRoutes = [
    "staff-login",
    "staff",
    "staff/login",
    "staff/portal",
    "admin",
    "admin/dashboard",
    "admin/users",
    "admin/inventory",
    "admin/reports",
    "pharmacist",
    "pharmacist/dashboard",
    "pharmacist/prescriptions",
    "assistant_pharmacist",
    "assistant_pharmacist/dashboard",
    "assistant-pharmacist",
    "assistant-pharmacist/dashboard",
    "delivery",
    "delivery/dashboard",
    "delivery_person/dashboard",
    "developer",
    "developer/dashboard",
    "inventory",
    "users",
    "deliveries",
    "payments",
    "reports",
    "audit",
    "admin-audit"
  ];

  for (const route of forbiddenRoutes) {
    const access = checkRouteAccess(route, customerUser, "customer");
    assert.equal(access.allowed, false, `Customer should NEVER be allowed to access '${route}'`);
    assert.equal(
      access.redirectRoute,
      "customer/dashboard",
      `Customer accessing '${route}' must be redirected to 'customer/dashboard'`
    );
  }
});

test("4. AUTHENTICATED REDIRECTIONS: Logged-in customer visiting public auth pages is redirected to customer dashboard", () => {
  const customerUser = {
    uid: "cust-test-123",
    email: "customer@example.com",
    role: "customer"
  };

  for (const authRoute of ["auth", "login", "register"]) {
    const access = checkRouteAccess(authRoute, customerUser, "customer");
    assert.equal(access.allowed, false, `Authenticated customer on '${authRoute}' should be redirected`);
    assert.equal(access.redirectRoute, "customer/dashboard");
  }
});

test("5. CUSTOMER PERMITTED ROUTES: Customer can freely access customer portal features", () => {
  const customerUser = {
    uid: "cust-test-123",
    email: "customer@example.com",
    role: "customer"
  };

  const allowedRoutes = [
    "customer/dashboard",
    "customer/medicines",
    "medicines",
    "customer/categories",
    "categories",
    "customer/prescriptions",
    "prescriptions",
    "customer/consultations",
    "consultations",
    "customer/refills",
    "refills",
    "customer/orders",
    "orders",
    "customer-chat",
    "chat",
    "customer/profile",
    "profile",
    "customer/settings",
    "settings",
    "cart",
    "checkout",
    "about",
    "contact"
  ];

  for (const route of allowedRoutes) {
    const access = checkRouteAccess(route, customerUser, "customer");
    assert.equal(access.allowed, true, `Customer SHOULD have access to '${route}'`);
  }
});

test("6. SIDEBAR NAVIGATION: Customer sidebar config contains only customer navigation items and zero staff tools", () => {
  const customerNav = ROLE_SIDEBAR_CONFIGS?.customer;
  assert.ok(Array.isArray(customerNav), "Customer sidebar config must be an array");

  const routes = customerNav.map(item => item.route);
  assert.ok(routes.includes("customer/dashboard"), "Must include customer/dashboard");
  assert.ok(routes.includes("customer/medicines"), "Must include customer/medicines");
  assert.ok(routes.includes("customer/orders"), "Must include customer/orders");
  assert.ok(routes.includes("customer/prescriptions"), "Must include customer/prescriptions");

  // Verify no staff routes exist in customer nav
  const staffRoutes = ["inventory", "users", "deliveries", "payments", "reports", "audit", "admin/dashboard", "developer/dashboard"];
  for (const sr of staffRoutes) {
    assert.ok(!routes.includes(sr), `Customer sidebar must NOT contain staff route '${sr}'`);
  }
});

test("7. HTML STRUCTURE: No staff login cards or demo staff buttons inside register-card or login-card", () => {
  const html = fs.readFileSync(htmlPath, "utf8");

  // Account type radios exist in register card
  assert.ok(html.includes('name="reg-account-type"'), "Account type radio buttons must exist in index.html");
  assert.ok(html.includes('value="INDIVIDUAL"'), "Individual account type option must exist");
  assert.ok(html.includes('value="BUSINESS"'), "Business account type option must exist");

  // Extract register card slice
  const regStart = html.indexOf('id="register-card"');
  assert.ok(regStart !== -1, "register-card must exist");
  const regEnd = html.indexOf('</form>', regStart);
  const regSlice = html.substring(regStart, regEnd);

  assert.ok(!regSlice.includes("demo-staff-btn"), "register-card must NOT contain .demo-staff-btn");
  assert.ok(!regSlice.includes("Clinical &amp; Staff Portal") && !regSlice.includes("Clinical & Staff Portal"), "register-card must NOT contain staff portal title");

  // Extract login card slice
  const loginStart = html.indexOf('id="login-card"');
  assert.ok(loginStart !== -1, "login-card must exist");
  const loginEnd = html.indexOf('</form>', loginStart);
  const loginSlice = html.substring(loginStart, loginEnd);

  assert.ok(!loginSlice.includes("demo-staff-btn"), "login-card must NOT contain .demo-staff-btn");
  assert.ok(!loginSlice.includes("Clinical &amp; Staff Portal") && !loginSlice.includes("Clinical & Staff Portal"), "login-card must NOT contain staff portal title");

  // Staff card slice exists separately and contains staff portal elements
  const staffStart = html.indexOf('id="staff-login-card"');
  assert.ok(staffStart !== -1, "staff-login-card must exist");
  const staffEnd = html.indexOf('</section>', staffStart);
  const staffSlice = html.substring(staffStart, staffEnd !== -1 ? staffEnd : staffStart + 3000);

  assert.ok(staffSlice.includes("Clinical &amp; Staff Portal") || staffSlice.includes("Clinical & Staff Portal"), "staff-login-card must have Clinical & Staff Portal header");
  assert.ok(staffSlice.includes("demo-staff-btn"), "staff-login-card contains demo-staff-btn");
});

test("8. STOREFRONT DASHBOARD: Customer dashboard markup includes pharmacy storefront components", () => {
  const appJs = fs.readFileSync(appJsPath, "utf8");

  assert.ok(appJs.includes("customer-storefront-card"), "app.js must include customer-storefront-card");
  assert.ok(appJs.includes("BLOOMCARE PHARMACY"), "app.js must include BLOOMCARE PHARMACY header");
  assert.ok(appJs.includes("cust-dash-search-input"), "app.js must include #cust-dash-search-input");
  assert.ok(appJs.includes("cust-dash-rec-track"), "app.js must include #cust-dash-rec-track");
  assert.ok(appJs.includes("cust-dash-category-pills"), "app.js must include #cust-dash-category-pills");
  assert.ok(appJs.includes("cust-dash-products-grid"), "app.js must include #cust-dash-products-grid");
  assert.ok(appJs.includes("Mbarara City Hub"), "app.js must include Mbarara City Hub badge");

  setImmediate(() => {
    process.exit(0);
  });
});
