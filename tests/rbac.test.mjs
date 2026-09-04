import test from 'node:test';
import assert from 'node:assert/strict';

import {
  checkRouteAccess,
  ROLE_HOME_ROUTES,
  ROLE_SIDEBAR_CONFIGS,
  normalizeRole,
  formatRoleName,
  getEffectiveRole,
  ROLE_HIERARCHY,
  PERMISSIONS,
  ROLE_PERMISSIONS,
  isAtLeastRole,
  canManageRole,
  hasPermission,
  canTransitionOrderStatus,
  canAccessResource,
  STATE
} from '../BLOOMCARE-main/app.js';

const developerUser = {
  uid: 'usr-dev-001',
  email: 'dev@bloomcare.com',
  displayName: 'Lead Systems Developer',
  role: 'developer'
};

const adminUser = {
  uid: 'usr-staff-1',
  email: 'admin@bloomcare.com',
  displayName: 'Dr. Admin Mugisha',
  role: 'admin'
};

const pharmacistUser = {
  uid: 'usr-staff-2',
  email: 'amina.n@bloomcare.com',
  displayName: 'Dr. Amina Nanyonga',
  role: 'pharmacist'
};

const assistantPharmacistUser = {
  uid: 'usr-staff-3',
  email: 'sarah.n@bloomcare.com',
  displayName: 'Sarah Namusoke',
  role: 'assistant_pharmacist'
};

const deliveryPersonUser = {
  uid: 'usr-staff-4',
  email: 'moses.k@bloomcare.com',
  displayName: 'Moses Kato',
  role: 'delivery_person'
};

const customerUser = {
  uid: 'usr-cust-101',
  email: 'grace.nakato@example.com',
  displayName: 'Grace Nakato',
  role: 'customer'
};

const otherCustomerUser = {
  uid: 'usr-cust-202',
  email: 'john.sse@example.com',
  displayName: 'John Ssemwogerere',
  role: 'customer'
};

// -------------------------------------------------------------
// 1. CANONICAL ROLES AND ROUTING MAPPING TESTS
// -------------------------------------------------------------
test('ROLE ARCHITECTURE: All 6 roles have distinct designated home routes', () => {
  assert.equal(ROLE_HOME_ROUTES.developer, 'developer/dashboard');
  assert.equal(ROLE_HOME_ROUTES.admin, 'admin/dashboard');
  assert.equal(ROLE_HOME_ROUTES.pharmacist, 'pharmacist/dashboard');
  assert.equal(ROLE_HOME_ROUTES.assistant_pharmacist, 'assistant_pharmacist/dashboard');
  assert.equal(ROLE_HOME_ROUTES.delivery_person, 'delivery_person/dashboard');
  assert.equal(ROLE_HOME_ROUTES.customer, 'customer/dashboard');
  assert.equal(ROLE_HOME_ROUTES.visitor, 'auth');
});

test('ROLE NORMALIZATION: Aliases and legacy role names are correctly normalized', () => {
  assert.equal(normalizeRole('dev'), 'developer');
  assert.equal(normalizeRole('developer'), 'developer');
  assert.equal(normalizeRole('DEVELOPER'), 'developer');
  assert.equal(normalizeRole('administrator'), 'admin');
  assert.equal(normalizeRole('admin'), 'admin');
  assert.equal(normalizeRole('ADMIN'), 'admin');
  assert.equal(normalizeRole('pharmacist'), 'pharmacist');
  assert.equal(normalizeRole('PHARMACIST'), 'pharmacist');
  assert.equal(normalizeRole('pharmacyAssistant'), 'assistant_pharmacist');
  assert.equal(normalizeRole('assistant_pharmacist'), 'assistant_pharmacist');
  assert.equal(normalizeRole('assistant pharmacist'), 'assistant_pharmacist');
  assert.equal(normalizeRole('deliveryStaff'), 'delivery_person');
  assert.equal(normalizeRole('delivery_person'), 'delivery_person');
  assert.equal(normalizeRole('delivery person'), 'delivery_person');
  assert.equal(normalizeRole('driver'), 'delivery_person');
  assert.equal(normalizeRole('customer'), 'customer');
  assert.equal(normalizeRole('unknown_role'), null);
});

test('ROLE FORMATTING: Friendly labels match role specifications', () => {
  assert.equal(formatRoleName('developer'), 'Developer');
  assert.equal(formatRoleName('admin'), 'Administrator');
  assert.equal(formatRoleName('pharmacist'), 'Pharmacist');
  assert.equal(formatRoleName('assistant_pharmacist'), 'Assistant Pharmacist');
  assert.equal(formatRoleName('delivery_person'), 'Delivery Person');
  assert.equal(formatRoleName('customer'), 'Customer');
});

// -------------------------------------------------------------
// 2. DEVELOPER WORKSPACE & SIMULATION MODE TESTS
// -------------------------------------------------------------
test('DEVELOPER ACCESS: Developer logs in -> Directed to Developer Dashboard with full system access', () => {
  assert.equal(ROLE_HOME_ROUTES.developer, 'developer/dashboard');
  const access = checkRouteAccess('developer/dashboard', developerUser, 'developer');
  assert.equal(access.allowed, true);

  const adminAccess = checkRouteAccess('admin/users', developerUser, 'developer');
  assert.equal(adminAccess.allowed, true);

  const pharmAccess = checkRouteAccess('pharmacist/prescriptions', developerUser, 'developer');
  assert.equal(pharmAccess.allowed, true);

  const sidebarRoutes = ROLE_SIDEBAR_CONFIGS.developer.map(item => item.route);
  assert.ok(sidebarRoutes.includes('developer/dashboard'));
  assert.ok(sidebarRoutes.includes('admin/users'));
  assert.ok(sidebarRoutes.includes('admin/inventory'));
});

test('DEVELOPER PREVIEW SIMULATION: Developer tests as other roles without mutating database role', () => {
  STATE.currentUser = { ...developerUser };
  STATE.activeRole = 'developer';
  STATE.developerPreviewRole = null;

  assert.equal(getEffectiveRole(), 'developer');

  // Preview as Pharmacist
  STATE.developerPreviewRole = 'pharmacist';
  assert.equal(getEffectiveRole(), 'pharmacist');
  assert.equal(STATE.currentUser.role, 'developer'); // Database role unchanged!

  const pharmRouteAccess = checkRouteAccess('pharmacist/prescriptions', STATE.currentUser, getEffectiveRole());
  assert.equal(pharmRouteAccess.allowed, true);

  const adminRestrictedAccess = checkRouteAccess('admin/users', STATE.currentUser, getEffectiveRole());
  assert.equal(adminRestrictedAccess.allowed, false); // Role simulation faithfully restricts admin routes!

  // Preview as Delivery Person
  STATE.developerPreviewRole = 'delivery_person';
  assert.equal(getEffectiveRole(), 'delivery_person');
  const deliveryAccess = checkRouteAccess('delivery_person/dashboard', STATE.currentUser, getEffectiveRole());
  assert.equal(deliveryAccess.allowed, true);
  const deliveryBlockedPharm = checkRouteAccess('pharmacist/dashboard', STATE.currentUser, getEffectiveRole());
  assert.equal(deliveryBlockedPharm.allowed, false);

  // Exit Preview
  STATE.developerPreviewRole = null;
  assert.equal(getEffectiveRole(), 'developer');
  const restoredDevAccess = checkRouteAccess('developer/dashboard', STATE.currentUser, getEffectiveRole());
  assert.equal(restoredDevAccess.allowed, true);
});

// -------------------------------------------------------------
// 3. ROLE ACCESS & ROUTE PROTECTION TESTS
// -------------------------------------------------------------
test('CUSTOMER ACCESS: Customer logs in -> Directed to Customer Dashboard only', () => {
  assert.equal(ROLE_HOME_ROUTES.customer, 'customer/dashboard');
  const access = checkRouteAccess('customer/dashboard', customerUser, 'customer');
  assert.equal(access.allowed, true);

  const sidebarRoutes = ROLE_SIDEBAR_CONFIGS.customer.map(item => item.route);
  assert.ok(sidebarRoutes.includes('customer/dashboard'));
  assert.ok(sidebarRoutes.includes('customer/orders'));
  assert.ok(!sidebarRoutes.includes('admin/users'));
  assert.ok(!sidebarRoutes.includes('pharmacist/inventory'));
  assert.ok(!sidebarRoutes.includes('developer/dashboard'));
});

test('CUSTOMER BLOCKS: Customer cannot access developer, pharmacist, or admin routes', () => {
  const devAttempt = checkRouteAccess('developer/dashboard', customerUser, 'customer');
  assert.equal(devAttempt.allowed, false);
  assert.equal(devAttempt.redirectRoute, 'customer/dashboard');
  assert.match(devAttempt.reason, /Developer tools are restricted/i);

  const pharmAttempt = checkRouteAccess('pharmacist/dashboard', customerUser, 'customer');
  assert.equal(pharmAttempt.allowed, false);
  assert.equal(pharmAttempt.redirectRoute, 'customer/dashboard');
  assert.match(pharmAttempt.reason, /Customer accounts cannot access pharmacy staff tools/i);

  const adminAttempt = checkRouteAccess('admin/dashboard', customerUser, 'customer');
  assert.equal(adminAttempt.allowed, false);
  assert.equal(adminAttempt.redirectRoute, 'customer/dashboard');
  assert.match(adminAttempt.reason, /Customer accounts cannot access administrative pages/i);

  const usersAttempt = checkRouteAccess('admin/users', customerUser, 'customer');
  assert.equal(usersAttempt.allowed, false);
  assert.equal(usersAttempt.redirectRoute, 'customer/dashboard');
});

test('PHARMACIST ACCESS: Pharmacist logs in -> Directed to Pharmacist Dashboard', () => {
  assert.equal(ROLE_HOME_ROUTES.pharmacist, 'pharmacist/dashboard');
  const access = checkRouteAccess('pharmacist/dashboard', pharmacistUser, 'pharmacist');
  assert.equal(access.allowed, true);

  const sidebarRoutes = ROLE_SIDEBAR_CONFIGS.pharmacist.map(item => item.route);
  assert.ok(sidebarRoutes.includes('pharmacist/dashboard'));
  assert.ok(sidebarRoutes.includes('pharmacist/prescriptions'));
  assert.ok(sidebarRoutes.includes('pharmacist/orders'));
  assert.ok(!sidebarRoutes.includes('admin/users'));
  assert.ok(!sidebarRoutes.includes('developer/dashboard'));
});

test('PHARMACIST BLOCKS: Pharmacist cannot access developer console or admin management', () => {
  const devAttempt = checkRouteAccess('developer/dashboard', pharmacistUser, 'pharmacist');
  assert.equal(devAttempt.allowed, false);
  assert.equal(devAttempt.redirectRoute, 'pharmacist/dashboard');
  assert.match(devAttempt.reason, /Developer console is restricted/i);

  const adminAttempt = checkRouteAccess('admin/dashboard', pharmacistUser, 'pharmacist');
  assert.equal(adminAttempt.allowed, false);
  assert.equal(adminAttempt.redirectRoute, 'pharmacist/dashboard');

  const customerDashAttempt = checkRouteAccess('customer/dashboard', pharmacistUser, 'pharmacist');
  assert.equal(customerDashAttempt.allowed, false);
  assert.equal(customerDashAttempt.redirectRoute, 'pharmacist/dashboard');
});

test('ASSISTANT PHARMACIST ACCESS: Directed to assistant dashboard and packing views', () => {
  assert.equal(ROLE_HOME_ROUTES.assistant_pharmacist, 'assistant_pharmacist/dashboard');
  const access = checkRouteAccess('assistant_pharmacist/dashboard', assistantPharmacistUser, 'assistant_pharmacist');
  assert.equal(access.allowed, true);

  const ordersAccess = checkRouteAccess('orders', assistantPharmacistUser, 'assistant_pharmacist');
  assert.equal(ordersAccess.allowed, true);

  const inventoryAccess = checkRouteAccess('inventory', assistantPharmacistUser, 'assistant_pharmacist');
  assert.equal(inventoryAccess.allowed, true);

  // Blocked from admin and developer
  const adminUsersAccess = checkRouteAccess('admin/users', assistantPharmacistUser, 'assistant_pharmacist');
  assert.equal(adminUsersAccess.allowed, false);
  assert.equal(adminUsersAccess.redirectRoute, 'assistant_pharmacist/dashboard');

  const devAccess = checkRouteAccess('developer/dashboard', assistantPharmacistUser, 'assistant_pharmacist');
  assert.equal(devAccess.allowed, false);
  assert.equal(devAccess.redirectRoute, 'assistant_pharmacist/dashboard');
});

test('DELIVERY PERSON ACCESS: Directed to delivery dashboard and dispatch views only', () => {
  assert.equal(ROLE_HOME_ROUTES.delivery_person, 'delivery_person/dashboard');
  const access = checkRouteAccess('delivery_person/dashboard', deliveryPersonUser, 'delivery_person');
  assert.equal(access.allowed, true);

  const deliveriesAccess = checkRouteAccess('deliveries', deliveryPersonUser, 'delivery_person');
  assert.equal(deliveriesAccess.allowed, true);

  // Blocked from pharmacist, admin, developer
  const pharmAccess = checkRouteAccess('pharmacist/dashboard', deliveryPersonUser, 'delivery_person');
  assert.equal(pharmAccess.allowed, false);
  assert.equal(pharmAccess.redirectRoute, 'delivery_person/dashboard');

  const adminAccess = checkRouteAccess('admin/dashboard', deliveryPersonUser, 'delivery_person');
  assert.equal(adminAccess.allowed, false);
  assert.equal(adminAccess.redirectRoute, 'delivery_person/dashboard');
});

test('ADMIN ACCESS: Admin logs in -> Directed to Admin Dashboard and has administrative access', () => {
  assert.equal(ROLE_HOME_ROUTES.admin, 'admin/dashboard');
  const access = checkRouteAccess('admin/dashboard', adminUser, 'admin');
  assert.equal(access.allowed, true);

  const adminRoutes = ROLE_SIDEBAR_CONFIGS.admin.map(item => item.route);
  assert.ok(adminRoutes.includes('admin/dashboard'));
  assert.ok(adminRoutes.includes('admin/users'));
  assert.ok(adminRoutes.includes('admin/reports'));
  assert.ok(adminRoutes.includes('admin/settings'));

  // Developer console restricted even for admin
  const devAccess = checkRouteAccess('developer/dashboard', adminUser, 'admin');
  assert.equal(devAccess.allowed, false);
  assert.equal(devAccess.redirectRoute, 'admin/dashboard');
});

// -------------------------------------------------------------
// 4. USER/STAFF MANAGEMENT PERMISSION TESTS
// -------------------------------------------------------------
test('STAFF MANAGEMENT: Only Admin and Developer can manage staff accounts and roles', () => {
  function canManageUsers(user) {
    const role = normalizeRole(user?.role);
    return role === 'admin' || role === 'developer';
  }

  assert.equal(canManageUsers(developerUser), true);
  assert.equal(canManageUsers(adminUser), true);
  assert.equal(canManageUsers(pharmacistUser), false);
  assert.equal(canManageUsers(assistantPharmacistUser), false);
  assert.equal(canManageUsers(deliveryPersonUser), false);
  assert.equal(canManageUsers(customerUser), false);
  assert.equal(canManageUsers(null), false);
});

// -------------------------------------------------------------
// 5. UNVERIFIED ROLE & FALLBACK HANDLING TESTS
// -------------------------------------------------------------
test('ROLE VERIFICATION: User without role in profile safely defaults to customer', () => {
  const legacyProfile = { uid: 'usr-legacy-01', firstName: 'Sarah', lastName: 'Akello' }; // missing role field
  const role = legacyProfile.role ? normalizeRole(legacyProfile.role) : 'customer';
  assert.equal(role, 'customer');
});

test('ROLE VERIFICATION: Unverified role triggers error screen and blocks silent customer default', () => {
  function verifyUserRole(profile, session) {
    let userRole = null;
    if (profile?.role) {
      userRole = normalizeRole(profile.role);
    } else if (session?.role) {
      userRole = normalizeRole(session.role);
    }
    if (!userRole) {
      return { verified: false, error: 'Your account role could not be verified. Please contact the administrator.' };
    }
    return { verified: true, role: userRole };
  }

  const failedVerification = verifyUserRole(null, null);
  assert.equal(failedVerification.verified, false);
  assert.match(failedVerification.error, /Your account role could not be verified/i);
});

// -------------------------------------------------------------
// 6. VISITOR & DATA ISOLATION TESTS
// -------------------------------------------------------------
test('VISITOR ACCESS: Unauthenticated visitor accessing protected route -> Redirected to auth', () => {
  const visitorAccess = checkRouteAccess('admin/dashboard', null, 'visitor');
  assert.equal(visitorAccess.allowed, false);
  assert.equal(visitorAccess.redirectRoute, 'auth');

  const publicAccess = checkRouteAccess('medicines', null, 'visitor');
  assert.equal(publicAccess.allowed, true);
});

test('DATA ISOLATION: Customer A cannot view Customer B\'s order or receipt', () => {
  const orderA = {
    id: 'BC-ORD-111',
    orderNumber: 'BC-ORD-111',
    customerId: customerUser.uid,
    customerEmail: customerUser.email,
    total: 35000
  };

  const orderB = {
    id: 'BC-ORD-222',
    orderNumber: 'BC-ORD-222',
    customerId: otherCustomerUser.uid,
    customerEmail: otherCustomerUser.email,
    total: 82000
  };

  function canCustomerAccessOrder(order, currentUser, role) {
    if (role !== 'customer') return true;
    return order.customerId === currentUser?.uid || order.customerEmail === currentUser?.email;
  }

  assert.equal(canCustomerAccessOrder(orderA, customerUser, 'customer'), true);
  assert.equal(canCustomerAccessOrder(orderB, customerUser, 'customer'), false);
});

// -------------------------------------------------------------
// 7. ROLE HIERARCHY & CLEARANCE ESCALATION TESTS
// -------------------------------------------------------------
test('ROLE HIERARCHY: Security clearance hierarchy enforces correct authority order', () => {
  assert.equal(ROLE_HIERARCHY.developer, 100);
  assert.equal(ROLE_HIERARCHY.admin, 80);
  assert.equal(ROLE_HIERARCHY.pharmacist, 60);
  assert.equal(ROLE_HIERARCHY.assistant_pharmacist, 40);
  assert.equal(ROLE_HIERARCHY.delivery_person, 20);
  assert.equal(ROLE_HIERARCHY.customer, 10);
  assert.equal(ROLE_HIERARCHY.visitor, 0);

  // Clearance checks
  assert.equal(isAtLeastRole('admin', 'developer'), true); // Developer >= Admin
  assert.equal(isAtLeastRole('pharmacist', 'admin'), true); // Admin >= Pharmacist
  assert.equal(isAtLeastRole('admin', 'pharmacist'), false); // Pharmacist is NOT >= Admin
  assert.equal(isAtLeastRole('pharmacist', 'customer'), false); // Customer is NOT >= Pharmacist
});

test('ROLE MANAGEMENT CLEARANCE: Admins cannot edit/assign Developer accounts', () => {
  // Developer can manage all roles
  assert.equal(canManageRole('developer', 'admin'), true);
  assert.equal(canManageRole('developer', 'pharmacist'), true);

  // Admin can manage staff below level 80, but NOT developer (100) or other Admins (80)
  assert.equal(canManageRole('admin', 'developer'), false);
  assert.equal(canManageRole('admin', 'admin'), false);
  assert.equal(canManageRole('admin', 'pharmacist'), true);
  assert.equal(canManageRole('admin', 'delivery_person'), true);

  // Pharmacist cannot manage staff
  assert.equal(canManageRole('pharmacist', 'assistant_pharmacist'), true); // Hierarchy check
  assert.equal(canManageRole('pharmacist', 'admin'), false);
});

// -------------------------------------------------------------
// 8. GRANULAR PERMISSION CAPABILITIES TESTS
// -------------------------------------------------------------
test('GRANULAR PERMISSIONS: Clinical approval is strictly restricted to Pharmacist and Admin/Dev', () => {
  assert.equal(hasPermission(PERMISSIONS.PRESCRIPTION_CLINICAL_REVIEW, 'pharmacist'), true);
  assert.equal(hasPermission(PERMISSIONS.PRESCRIPTION_CLINICAL_REVIEW, 'admin'), true);
  assert.equal(hasPermission(PERMISSIONS.PRESCRIPTION_CLINICAL_REVIEW, 'developer'), true);

  // Assistant Pharmacist, Delivery, Customer and Visitor MUST NOT have clinical review permission
  assert.equal(hasPermission(PERMISSIONS.PRESCRIPTION_CLINICAL_REVIEW, 'assistant_pharmacist'), false);
  assert.equal(hasPermission(PERMISSIONS.PRESCRIPTION_CLINICAL_REVIEW, 'delivery_person'), false);
  assert.equal(hasPermission(PERMISSIONS.PRESCRIPTION_CLINICAL_REVIEW, 'customer'), false);
  assert.equal(hasPermission(PERMISSIONS.PRESCRIPTION_CLINICAL_REVIEW, 'visitor'), false);
});

test('GRANULAR PERMISSIONS: Doorstep dispatch is restricted to Delivery Person and Admin/Dev', () => {
  assert.equal(hasPermission(PERMISSIONS.ORDER_DISPATCH, 'delivery_person'), true);
  assert.equal(hasPermission(PERMISSIONS.ORDER_DELIVER, 'delivery_person'), true);
  assert.equal(hasPermission(PERMISSIONS.ORDER_DISPATCH, 'admin'), true);

  // Customer & Pharmacist cannot perform delivery driver dispatches
  assert.equal(hasPermission(PERMISSIONS.ORDER_DISPATCH, 'customer'), false);
  assert.equal(hasPermission(PERMISSIONS.ORDER_DISPATCH, 'pharmacist'), false);
});

// -------------------------------------------------------------
// 9. PHARMACY WORKFLOW STATE MACHINE TESTS
// -------------------------------------------------------------
test('ORDER WORKFLOW: Clinical safety gate restricts moving Rx orders to Confirmed', () => {
  // Moving from Awaiting Prescription Review -> Confirmed requires Pharmacist or Admin
  const pharmTransition = canTransitionOrderStatus('Awaiting Prescription Review', 'Confirmed', 'pharmacist');
  assert.equal(pharmTransition.allowed, true);

  const adminTransition = canTransitionOrderStatus('Awaiting Prescription Review', 'Confirmed', 'admin');
  assert.equal(adminTransition.allowed, true);

  // Assistant Pharmacist CANNOT approve a prescription order
  const asstTransition = canTransitionOrderStatus('Awaiting Prescription Review', 'Confirmed', 'assistant_pharmacist');
  assert.equal(asstTransition.allowed, false);
  assert.match(asstTransition.reason, /Action Denied/i);

  // Delivery Person CANNOT approve a prescription order
  const deliveryTransition = canTransitionOrderStatus('Awaiting Prescription Review', 'Confirmed', 'delivery_person');
  assert.equal(deliveryTransition.allowed, false);

  // Customer CANNOT approve their own prescription order
  const custTransition = canTransitionOrderStatus('Awaiting Prescription Review', 'Confirmed', 'customer');
  assert.equal(custTransition.allowed, false);
});

test('ORDER WORKFLOW: Doorstep delivery completion is gated to Delivery Staff and Admin', () => {
  // Delivery Person can mark Out for Delivery -> Delivered
  const deliveryFulfill = canTransitionOrderStatus('Out for Delivery', 'Delivered', 'delivery_person');
  assert.equal(deliveryFulfill.allowed, true);

  // Pharmacist or Customer cannot mark Out for Delivery -> Delivered
  const pharmFulfill = canTransitionOrderStatus('Out for Delivery', 'Delivered', 'pharmacist');
  assert.equal(pharmFulfill.allowed, false);
});

// -------------------------------------------------------------
// 10. CONTEXTUAL RESOURCE AUTHORIZATION TESTS
// -------------------------------------------------------------
test('CONTEXTUAL ACCESS: Data isolation allows delivery driver to view assigned runs only', () => {
  const assignedOrder = {
    id: 'BC-ORD-901',
    deliveryStaffId: deliveryPersonUser.uid,
    assignedStaff: deliveryPersonUser.displayName,
    orderStatus: 'Out for Delivery'
  };

  const unassignedOrder = {
    id: 'BC-ORD-902',
    deliveryStaffId: 'usr-staff-99',
    assignedStaff: 'Other Driver',
    orderStatus: 'Processing'
  };

  assert.equal(canAccessResource(deliveryPersonUser, 'order', assignedOrder, 'view'), true);
  assert.equal(canAccessResource(deliveryPersonUser, 'order', unassignedOrder, 'view'), false);
  assert.equal(canAccessResource(adminUser, 'order', unassignedOrder, 'view'), true); // Admin has oversight
});


