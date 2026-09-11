import assert from "node:assert/strict";
import test from "node:test";

import {
  PASSWORD_POLICY,
  validateCustomerDemoPassword,
  validateCustomerPassword,
  validatePassword
} from "../validators.js";

import {
  registerUser,
  loginUser,
  findUserProfile,
  checkRouteAccess,
  ROLE_HOME_ROUTES,
  STATE
} from "../BLOOMCARE-main/app.js";

test("DEMO PASSWORD POLICY: Enforces exactly 6 numeric digits", () => {
  assert.equal(PASSWORD_POLICY, "demo");

  // Valid 6-digit PINs
  for (const validPin of ["123456", "000000", "999999", "654321", "246810"]) {
    const res = validateCustomerDemoPassword(validPin);
    assert.equal(res.valid, true, `Expected ${validPin} to be valid`);
    assert.equal(res.message, "");
  }

  // Invalid: non-numeric characters, spaces, letters, symbols
  for (const invalidPin of ["12345a", "abcdef", "12 345", "123-45", "12345!", "!@#$%^"]) {
    const res = validateCustomerDemoPassword(invalidPin);
    assert.equal(res.valid, false, `Expected ${invalidPin} to be invalid`);
    assert.equal(res.message, "Password must contain exactly 6 digits.");
  }

  // Invalid length: < 6 or > 6
  for (const invalidLength of ["", "1", "12", "123", "1234", "12345", "1234567", "12345678"]) {
    const res = validateCustomerDemoPassword(invalidLength);
    assert.equal(res.valid, false, `Expected length ${invalidLength.length} to be invalid`);
    assert.equal(res.message, "Password must contain exactly 6 digits.");
  }

  // validateCustomerPassword defaults to demo policy
  assert.equal(validateCustomerPassword("123456").valid, true);
  assert.equal(validateCustomerPassword("12345").valid, false);

  // Standard production password validator remains intact and unchanged
  assert.equal(validatePassword("BloomCare2026!").valid, true);
  assert.equal(validatePassword("123456").valid, false);
});

test("DEMO CUSTOMER ACCOUNT: Pre-configured demo customer is accessible via email and phone", () => {
  // Demo customer account: customer@example.com / 123456
  const profileByEmail = findUserProfile("customer@example.com");
  assert.ok(profileByEmail, "Demo customer should be found by email");
  assert.equal(profileByEmail.email, "customer@example.com");
  assert.equal(profileByEmail.role, "customer");
  assert.equal(profileByEmail.phone, "0751234567");
  assert.equal(profileByEmail.name || profileByEmail.displayName, "Demo Customer");

  // Lookup by Ugandan phone
  const profileByPhone = findUserProfile("0751234567");
  assert.ok(profileByPhone, "Demo customer should be found by phone");
  assert.equal(profileByPhone.email, "customer@example.com");
  assert.equal(profileByPhone.role, "customer");
});

test("CUSTOMER LOGIN: Successful authentication with email and phone", async () => {
  // Login with demo email and 6-digit password
  const emailLogin = await loginUser({ identifier: "customer@example.com", password: "123456" });
  assert.equal(emailLogin.success, true);
  assert.equal(emailLogin.user.role, "customer");
  assert.equal(emailLogin.redirectRoute, "customer/dashboard");
  assert.equal(STATE.activeRole, "customer");

  // Login with phone number and 6-digit password
  const phoneLogin = await loginUser({ identifier: "0751234567", password: "123456" });
  assert.equal(phoneLogin.success, true);
  assert.equal(phoneLogin.user.role, "customer");
  assert.equal(phoneLogin.redirectRoute, "customer/dashboard");
});

test("CUSTOMER LOGIN ERRORS: Exact error messages for invalid inputs", async () => {
  // 1. Password not 6 digits
  const formatErr = await loginUser({ identifier: "customer@example.com", password: "123" });
  assert.equal(formatErr.success, false);
  assert.equal(formatErr.message, "Password must contain exactly 6 digits.");

  const letterErr = await loginUser({ identifier: "customer@example.com", password: "abcdef" });
  assert.equal(letterErr.success, false);
  assert.equal(letterErr.message, "Password must contain exactly 6 digits.");

  // 2. Non-existent customer account
  const notFoundErr = await loginUser({ identifier: "nonexistent.cust@example.com", password: "123456" });
  assert.equal(notFoundErr.success, false);
  assert.equal(notFoundErr.message, "Customer account not found.");

  // 3. Incorrect password
  const wrongPassErr = await loginUser({ identifier: "customer@example.com", password: "999999" });
  assert.equal(wrongPassErr.success, false);
  assert.equal(wrongPassErr.message, "Incorrect password.");

  // 4. Staff account blocked from customer login
  const staffErr = await loginUser({ identifier: "admin@bloomcare.com", password: "123456" });
  assert.equal(staffErr.success, false);
  assert.equal(staffErr.message, "Staff and administrator accounts must sign in via the Staff Portal.");

  const devErr = await loginUser({ identifier: "dev@bloomcare.com", password: "123456" });
  assert.equal(devErr.success, false);
  assert.equal(devErr.message, "Staff and administrator accounts must sign in via the Staff Portal.");
});

test("CUSTOMER REGISTRATION: Registers new customer and assigns customer role", async () => {
  const testEmail = `newuser.${Date.now()}@example.com`;
  const regResult = await registerUser({
    fullName: "Jane Namatovu",
    email: testEmail,
    phone: "0772123456",
    password: "654321"
  });

  assert.equal(regResult.success, true);
  assert.equal(regResult.user.role, "customer");
  assert.equal(regResult.user.status, "active");
  assert.equal(regResult.user.name, "Jane Namatovu");
  assert.equal(regResult.user.email, testEmail);

  // Attempt duplicate email registration -> exact required error message
  const dupResult = await registerUser({
    fullName: "Jane Duplicate",
    email: testEmail,
    phone: "0772999888",
    password: "123456"
  });
  assert.equal(dupResult.success, false);
  assert.equal(dupResult.message, "An account with this email already exists. Please log in.");

  // Attempt registration with invalid 6-digit password
  const badPassResult = await registerUser({
    fullName: "Test BadPass",
    email: `badpass.${Date.now()}@example.com`,
    phone: "0772123456",
    password: "pass"
  });
  assert.equal(badPassResult.success, false);
  assert.equal(badPassResult.message, "Password must contain exactly 6 digits.");

  // Log in with newly registered user
  const newLogin = await loginUser({ identifier: testEmail, password: "654321" });
  assert.equal(newLogin.success, true);
  assert.equal(newLogin.user.role, "customer");
  assert.equal(newLogin.user.name, "Jane Namatovu");
});

test("REQUIREMENT 12 FLOW: Complete registration, login, and staff route protection", async () => {
  const johnEmail = `john.${Date.now()}@example.com`;

  // Step 4 & 5: Register John Doe with 123456
  const reg = await registerUser({
    fullName: "John Doe",
    phone: "0770000000",
    email: johnEmail,
    password: "123456"
  });

  // Step 6 & 7: Account created, role automatically becomes CUSTOMER
  assert.equal(reg.success, true);
  assert.equal(reg.user.role, "customer");

  // Step 8, 9, 10: Log in as John Doe with 123456
  const login = await loginUser({
    identifier: johnEmail,
    password: "123456"
  });

  // Step 11: Customer Dashboard opens
  assert.equal(login.success, true);
  assert.equal(login.user.role, "customer");
  assert.equal(login.redirectRoute, "customer/dashboard");
  assert.equal(ROLE_HOME_ROUTES.customer, "customer/dashboard");

  // Step 12: Staff pages cannot be opened by this customer
  const staffRoutesToTest = [
    "admin/dashboard",
    "admin/users",
    "admin/inventory",
    "pharmacist/dashboard",
    "pharmacist/prescriptions",
    "assistant_pharmacist/dashboard",
    "delivery_person/dashboard",
    "delivery/orders",
    "staff/portal",
    "developer/dashboard"
  ];

  for (const staffRoute of staffRoutesToTest) {
    const access = checkRouteAccess(staffRoute, login.user, "customer");
    assert.equal(access.allowed, false, `Customer should NOT be allowed to access ${staffRoute}`);
    assert.equal(access.redirectRoute, "customer/dashboard");
  }

  // Customer permitted routes
  const customerRoutes = [
    "customer/dashboard",
    "medicines",
    "customer/medicines",
    "categories",
    "customer/categories",
    "orders",
    "customer/orders",
    "prescriptions",
    "customer/prescriptions",
    "profile",
    "about",
    "contact"
  ];

  for (const custRoute of customerRoutes) {
    const access = checkRouteAccess(custRoute, login.user, "customer");
    assert.equal(access.allowed, true, `Customer SHOULD be allowed to access ${custRoute}`);
  }

  setImmediate(() => {
    process.exit(0);
  });
});


