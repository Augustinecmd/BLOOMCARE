import test from 'node:test';
import assert from 'node:assert/strict';

import {
  checkRouteAccess,
  userHasPermission,
  getFilteredUsers,
  updateUserManagementKpis,
  recordAdminAudit,
  canManageRole,
  ROLE_HIERARCHY,
  ROLE_PERMISSIONS,
  ROLE_SIDEBAR_CONFIGS,
  normalizeRole,
  formatRoleName,
  STATE,
  INITIAL_USERS
} from '../BLOOMCARE-main/app.js';

// Setup Mock Environment Fixtures
const adminUser = {
  uid: 'usr-staff-1',
  email: 'admin@bloomcare.com',
  displayName: 'Dr. Admin Mugisha',
  role: 'admin',
  status: 'active'
};

const developerUser = {
  uid: 'usr-dev-001',
  email: 'dev@bloomcare.com',
  displayName: 'Lead Systems Developer',
  role: 'developer',
  status: 'active'
};

const pharmacistUser = {
  uid: 'usr-staff-2',
  email: 'amina.n@bloomcare.com',
  displayName: 'Dr. Amina Nanyonga',
  role: 'pharmacist',
  status: 'active'
};

const customerUser = {
  uid: 'usr-cust-101',
  email: 'grace.nakato@example.com',
  displayName: 'Grace Nakato',
  role: 'customer',
  status: 'active'
};

const suspendedCustomer = {
  uid: 'usr-suspended-test',
  email: 'suspended.test@bloomcare.com',
  displayName: 'Suspended Test User',
  role: 'customer',
  status: 'suspended',
  suspensionReason: 'Policy violation under administrative review',
  suspensionDuration: '30'
};

const deactivatedUser = {
  uid: 'usr-deact-test',
  email: 'deact@bloomcare.com',
  displayName: 'Deactivated User',
  role: 'assistant_pharmacist',
  status: 'deactivated'
};

// Reset state helper
function resetUserState() {
  STATE.users = JSON.parse(JSON.stringify(INITIAL_USERS));
  STATE.auditLogs = [];
  STATE.userSearchQuery = '';
  STATE.userRoleFilter = 'all';
  STATE.userStatusFilter = 'all';
  STATE.userSortBy = 'date-desc';
  STATE.selectedUserIds = new Set();
  STATE.currentUser = adminUser;
  STATE.currentRole = 'admin';
}

// -------------------------------------------------------------
// 1. ROUTE ACCESS CONTROL FOR ADMIN USER MANAGEMENT
// -------------------------------------------------------------
test('ADMIN ACCESS: Admin and Developer have full access to admin/users and admin/audit-logs', () => {
  const adminUsersAccess = checkRouteAccess('admin/users', adminUser, 'admin');
  assert.equal(adminUsersAccess.allowed, true);

  const adminAuditAccess = checkRouteAccess('admin/audit-logs', adminUser, 'admin');
  assert.equal(adminAuditAccess.allowed, true);

  const devUsersAccess = checkRouteAccess('admin/users', developerUser, 'developer');
  assert.equal(devUsersAccess.allowed, true);

  const devAuditAccess = checkRouteAccess('admin/audit-logs', developerUser, 'developer');
  assert.equal(devAuditAccess.allowed, true);
});

test('RBAC SECURITY: Customers, Pharmacists, and unauthorized roles are blocked from admin user management', () => {
  const customerAccess = checkRouteAccess('admin/users', customerUser, 'customer');
  assert.equal(customerAccess.allowed, false);

  const pharmacistAccess = checkRouteAccess('admin/users', pharmacistUser, 'pharmacist');
  assert.equal(pharmacistAccess.allowed, false);

  const customerAuditAccess = checkRouteAccess('admin/audit-logs', customerUser, 'customer');
  assert.equal(customerAuditAccess.allowed, false);

  const pharmacistAuditAccess = checkRouteAccess('admin/audit-logs', pharmacistUser, 'pharmacist');
  assert.equal(pharmacistAuditAccess.allowed, false);

  const anonAccess = checkRouteAccess('admin/users', null, 'visitor');
  assert.equal(anonAccess.allowed, false);
});

// -------------------------------------------------------------
// 2. ACCOUNT STATUS ENFORCEMENT & IMMEDIATE BLOCKING
// -------------------------------------------------------------
test('ACCOUNT STATUS: Suspended accounts are immediately blocked from protected actions and routes', () => {
  const access = checkRouteAccess('customer/dashboard', suspendedCustomer, 'customer');
  assert.equal(access.allowed, false);
  assert.equal(access.suspended, true);
  assert.match(access.message, /Account Suspended/);

  // Even if suspended user attempts other routes
  const orderAccess = checkRouteAccess('orders', suspendedCustomer, 'customer');
  assert.equal(orderAccess.allowed, false);
  assert.equal(orderAccess.suspended, true);
});

test('ACCOUNT STATUS: Deactivated accounts are blocked from accessing protected routes', () => {
  const access = checkRouteAccess('assistant_pharmacist/dashboard', deactivatedUser, 'assistant_pharmacist');
  assert.equal(access.allowed, false);
  assert.equal(access.deactivated, true);
  assert.match(access.message, /Account Deactivated/);
});

// -------------------------------------------------------------
// 3. USER FILTERING, SEARCH, AND SORTING
// -------------------------------------------------------------
test('SEARCH & FILTER: Search query correctly matches user accounts by name, email, phone, and ID', () => {
  resetUserState();

  // Search by name
  STATE.userSearchQuery = 'Grace';
  let filtered = getFilteredUsers();
  assert.ok(filtered.some(u => (u.name || u.displayName).includes('Grace')));
  assert.ok(filtered.every(u => {
    const text = `${u.name || ''} ${u.displayName || ''} ${u.email || ''} ${u.phone || ''} ${u.id || u.uid || ''}`.toLowerCase();
    return text.includes('grace');
  }));

  // Search by email domain
  STATE.userSearchQuery = '@example.com';
  filtered = getFilteredUsers();
  assert.ok(filtered.length > 0);
  assert.ok(filtered.every(u => (u.email || '').toLowerCase().includes('@example.com')));

  // Search by phone
  STATE.userSearchQuery = '0751234567';
  filtered = getFilteredUsers();
  assert.equal(filtered.length, 1);
  assert.equal(filtered[0].phone, '0751234567');
});

test('SEARCH & FILTER: Filter by Role isolates users accurately', () => {
  resetUserState();

  // Filter Pharmacists
  STATE.userRoleFilter = 'pharmacist';
  let filtered = getFilteredUsers();
  assert.ok(filtered.length >= 2);
  assert.ok(filtered.every(u => normalizeRole(u.role) === 'pharmacist'));

  // Filter Customers
  STATE.userRoleFilter = 'customer';
  filtered = getFilteredUsers();
  assert.ok(filtered.length >= 2);
  assert.ok(filtered.every(u => normalizeRole(u.role) === 'customer'));
});

test('SEARCH & FILTER: Filter by Status isolates active vs suspended vs deactivated', () => {
  resetUserState();

  STATE.userStatusFilter = 'suspended';
  const suspendedUsers = getFilteredUsers();
  assert.ok(suspendedUsers.length >= 1);
  assert.ok(suspendedUsers.every(u => u.status === 'suspended'));

  STATE.userStatusFilter = 'active';
  const activeUsers = getFilteredUsers();
  assert.ok(activeUsers.length >= 5);
  assert.ok(activeUsers.every(u => (u.status || 'active') === 'active'));
});

test('SEARCH & FILTER: Sorting orders users by date, name, and hierarchy correctly', () => {
  resetUserState();

  // Sort by name ascending
  STATE.userSortBy = 'name-asc';
  const sortedByName = getFilteredUsers();
  for (let i = 0; i < sortedByName.length - 1; i++) {
    const a = (sortedByName[i].name || sortedByName[i].displayName || '').toLowerCase();
    const b = (sortedByName[i + 1].name || sortedByName[i + 1].displayName || '').toLowerCase();
    assert.ok(a.localeCompare(b) <= 0);
  }

  // Sort by role hierarchy descending
  STATE.userSortBy = 'role';
  const sortedByRole = getFilteredUsers();
  for (let i = 0; i < sortedByRole.length - 1; i++) {
    const aWeight = ROLE_HIERARCHY[sortedByRole[i].role] || 0;
    const bWeight = ROLE_HIERARCHY[sortedByRole[i + 1].role] || 0;
    assert.ok(aWeight >= bWeight);
  }
});

// -------------------------------------------------------------
// 4. GRANULAR PERMISSIONS MATRIX EVALUATION
// -------------------------------------------------------------
test('PERMISSIONS: Admin and Developer inherit all system capabilities', () => {
  assert.equal(userHasPermission(adminUser, 'catalog:manage'), true);
  assert.equal(userHasPermission(adminUser, 'prescription:clinical_review'), true);
  assert.equal(userHasPermission(adminUser, 'system:manage_users'), true);
  assert.equal(userHasPermission(adminUser, 'inventory:adjust'), true);

  assert.equal(userHasPermission(developerUser, 'system:manage_users'), true);
  assert.equal(userHasPermission(developerUser, 'dev:preview_roles'), true);
});

test('PERMISSIONS: Role defaults correctly provide baseline permissions', () => {
  assert.equal(userHasPermission(pharmacistUser, 'prescription:clinical_review'), true);
  assert.equal(userHasPermission(pharmacistUser, 'consultation:provide'), true);
  assert.equal(userHasPermission(pharmacistUser, 'system:manage_users'), false);

  assert.equal(userHasPermission(customerUser, 'cart:checkout'), true);
  assert.equal(userHasPermission(customerUser, 'prescription:clinical_review'), false);
});

test('PERMISSIONS: Granular explicit grants override role restrictions', () => {
  const enhancedCustomer = {
    ...customerUser,
    permissions: ['inventory:view', 'order:cancel']
  };

  // Explicitly granted
  assert.equal(userHasPermission(enhancedCustomer, 'inventory:view'), true);
  assert.equal(userHasPermission(enhancedCustomer, 'order:cancel'), true);
  // Default maintained
  assert.equal(userHasPermission(enhancedCustomer, 'cart:checkout'), true);
  // Still unauthorized for non-granted staff features
  assert.equal(userHasPermission(enhancedCustomer, 'prescription:clinical_review'), false);
});

test('PERMISSIONS: Granular explicit denials (!permission) revoke access', () => {
  const restrictedPharmacist = {
    ...pharmacistUser,
    permissions: ['!prescription:dispense']
  };

  assert.equal(userHasPermission(restrictedPharmacist, 'prescription:dispense'), false);
  assert.equal(userHasPermission(restrictedPharmacist, 'prescription:clinical_review'), true);
});

// -------------------------------------------------------------
// 5. ROLE MANAGEMENT HIERARCHY & SELF-LOCKOUT GUARDS
// -------------------------------------------------------------
test('ROLE HIERARCHY: Admin can manage roles below level 80 but cannot demote Developer', () => {
  // Admin (80) can manage Pharmacist (60), Assistant Pharmacist (40), Delivery (20), Customer (10)
  assert.equal(canManageRole('admin', 'pharmacist'), true);
  assert.equal(canManageRole('admin', 'assistant_pharmacist'), true);
  assert.equal(canManageRole('admin', 'delivery_person'), true);
  assert.equal(canManageRole('admin', 'customer'), true);

  // Admin (80) cannot manage Developer (100) or other Admins (80)
  assert.equal(canManageRole('admin', 'developer'), false);
  assert.equal(canManageRole('admin', 'admin'), false);

  // Developer (100) can manage everyone
  assert.equal(canManageRole('developer', 'admin'), true);
  assert.equal(canManageRole('developer', 'pharmacist'), true);
});

// -------------------------------------------------------------
// 6. ADMIN AUDIT TRAIL
// -------------------------------------------------------------
test('AUDIT TRAIL: Administrative actions generate immutable, detailed audit entries', async () => {
  resetUserState();

  const entry = await recordAdminAudit(
    'USER_SUSPEND',
    'usr-cust-101',
    'Suspended account for 30 days due to repeated suspicious cancellations.',
    { duration: '30', reason: 'suspicious activity' }
  );

  assert.ok(entry.id.startsWith('audit-'));
  assert.equal(entry.action, 'USER_SUSPEND');
  assert.equal(entry.targetUserId, 'usr-cust-101');
  assert.equal(entry.actorRole, 'admin');
  assert.ok(STATE.auditLogs.length > 0);
  assert.equal(STATE.auditLogs[0].id, entry.id);
});

// -------------------------------------------------------------
// 7. BULK ACTIONS & SELECTION
// -------------------------------------------------------------
test('BULK SELECTION: Admin can select multiple users and clear selection', () => {
  resetUserState();

  STATE.selectedUserIds.add('usr-cust-101');
  STATE.selectedUserIds.add('usr-cust-202');
  assert.equal(STATE.selectedUserIds.size, 2);

  // Test status batch update simulation
  for (const uid of STATE.selectedUserIds) {
    const user = STATE.users.find(u => (u.id === uid || u.uid === uid));
    if (user) user.status = 'suspended';
  }

  const user1 = STATE.users.find(u => u.id === 'usr-cust-101' || u.uid === 'usr-cust-101');
  const user2 = STATE.users.find(u => u.id === 'usr-cust-202' || u.uid === 'usr-cust-202');
  assert.equal(user1.status, 'suspended');
  assert.equal(user2.status, 'suspended');

  STATE.selectedUserIds.clear();
  assert.equal(STATE.selectedUserIds.size, 0);
});

// -------------------------------------------------------------
// 8. ADMIN SIDEBAR NAVIGATION STRUCTURE
// -------------------------------------------------------------
test('SIDEBAR: Admin sidebar configuration includes all 13 core administrative sections', () => {
  const adminNav = ROLE_SIDEBAR_CONFIGS.admin;
  assert.ok(adminNav, 'Admin navigation must be defined');

  const routes = adminNav.map(item => item.route);
  assert.ok(routes.includes('admin/dashboard'), 'Must include Dashboard');
  assert.ok(routes.includes('admin/users'), 'Must include Users management');
  assert.ok(routes.includes('admin/pharmacists'), 'Must include Pharmacists view');
  assert.ok(routes.includes('admin/customers'), 'Must include Customers directory');
  assert.ok(routes.includes('admin/consultations'), 'Must include Consultations');
  assert.ok(routes.includes('admin/appointments'), 'Must include Appointments');
  assert.ok(routes.includes('admin/medicines'), 'Must include Medicines');
  assert.ok(routes.includes('admin/orders'), 'Must include Orders');
  assert.ok(routes.includes('admin/inventory'), 'Must include Inventory');
  assert.ok(routes.includes('admin/reports'), 'Must include Reports');
  assert.ok(routes.includes('admin/audit-logs'), 'Must include Audit Logs');
  assert.ok(routes.includes('admin/settings'), 'Must include Settings');
  assert.ok(routes.includes('admin/profile'), 'Must include Profile');
});
