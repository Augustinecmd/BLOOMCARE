import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const htmlPath = path.join(rootDir, 'BLOOMCARE-main', 'index.html');
const appJsPath = path.join(rootDir, 'BLOOMCARE-main', 'app.js');
const cssPath = path.join(rootDir, 'BLOOMCARE-main', 'styles.css');

test('TOP BAR: Compact search placeholder matches "Search medicines, orders, users..."', () => {
  const html = fs.readFileSync(htmlPath, 'utf8');
  assert.ok(
    html.includes('placeholder="Search medicines, orders, users..."'),
    'Search input must have placeholder "Search medicines, orders, users..."'
  );
});

test('TOP BAR: Redundant role indicator is hidden from view to prevent clutter', () => {
  const html = fs.readFileSync(htmlPath, 'utf8');
  const css = fs.readFileSync(cssPath, 'utf8');

  assert.ok(
    html.includes('id="active-role-indicator"') && (html.includes('display: none') || html.includes('hidden')),
    'active-role-indicator must be hidden in HTML'
  );

  assert.ok(
    css.includes('#active-role-indicator') && css.includes('display: none !important'),
    'active-role-indicator must have display: none !important in CSS'
  );
});

test('TOP BAR: User profile dropdown menu includes Profile, Account Settings, and Sign Out', () => {
  const html = fs.readFileSync(htmlPath, 'utf8');

  assert.ok(html.includes('id="user-profile-dropdown"'), 'Must have user-profile-dropdown');
  assert.ok(html.includes('id="dropdown-item-profile"'), 'Must have Profile item');
  assert.ok(html.includes('id="dropdown-item-settings"'), 'Must have Account Settings item');
  assert.ok(html.includes('id="dropdown-item-logout"'), 'Must have Sign Out item');
});

test('TOP BAR: Notifications bell has clean dropdown panel with mark read and list', () => {
  const html = fs.readFileSync(htmlPath, 'utf8');
  const appJs = fs.readFileSync(appJsPath, 'utf8');

  assert.ok(html.includes('id="top-notif-dropdown"'), 'Must have top-notif-dropdown panel');
  assert.ok(html.includes('id="notif-mark-all-read"'), 'Must have mark all as read button');
  assert.ok(html.includes('id="notif-dropdown-list"'), 'Must have notification list container');
  assert.ok(appJs.includes('renderNotificationsDropdown'), 'app.js must implement renderNotificationsDropdown');
});

test('SIDEBAR: Streamlined to exactly the 8 core administrative sections', async () => {
  const { ROLE_SIDEBAR_CONFIGS } = await import('../BLOOMCARE-main/app.js');
  const adminNav = ROLE_SIDEBAR_CONFIGS.admin;

  assert.ok(adminNav, 'Admin navigation must be defined');
  assert.equal(adminNav.length, 8, 'Admin navigation must have exactly 8 items');

  const routes = adminNav.map(item => item.route);
  assert.deepEqual(routes, [
    'admin/dashboard',
    'admin/medicines',
    'admin/orders',
    'admin/consultations',
    'admin/appointments',
    'admin/users',
    'admin/reports',
    'admin/settings'
  ]);
});

test('ADMIN DASHBOARD: Template generates time-aware greeting, subtitle, 4 summary cards, 4 actions, and recent activity', () => {
  const appJs = fs.readFileSync(appJsPath, 'utf8');

  assert.ok(appJs.includes('Good morning') && appJs.includes('Good afternoon') && appJs.includes('Good evening'), 'Must include time-aware greetings');
  assert.ok(appJs.includes("Here's what's happening at BloomCare today."), 'Must include subtitle');

  // Summary Cards: Exactly 4 cards
  assert.ok(appJs.includes('admin-summary-grid'), 'Must have admin-summary-grid');
  assert.ok(appJs.includes('Total Users'), 'Must include Total Users summary card');
  assert.ok(appJs.includes('Medicines'), 'Must include Medicines summary card');
  assert.ok(appJs.includes('Orders'), 'Must include Orders summary card');
  assert.ok(appJs.includes('Appointments'), 'Must include Appointments summary card');

  // Quick Actions: Exactly 4 prominent buttons
  assert.ok(appJs.includes('+ Add Medicine'), 'Must include + Add Medicine action');
  assert.ok(appJs.includes('Manage Orders'), 'Must include Manage Orders action');
  assert.ok(appJs.includes('Manage Users'), 'Must include Manage Users action');
  assert.ok(appJs.includes('View Reports'), 'Must include View Reports action');

  // Recent Activity section with View All
  assert.ok(appJs.includes('admin-activity-card'), 'Must have admin-activity-card');
  assert.ok(appJs.includes('Recent Activity'), 'Must have Recent Activity header');
  assert.ok(appJs.includes('View All &rarr;'), 'Must have View All link');
});

test('ADMIN DASHBOARD CSS: Comprehensive styles for summary grid, actions, activity feed, and responsiveness', () => {
  const css = fs.readFileSync(cssPath, 'utf8');

  assert.ok(css.includes('.admin-summary-grid'), 'styles.css must style .admin-summary-grid');
  assert.ok(css.includes('.admin-summary-card'), 'styles.css must style .admin-summary-card');
  assert.ok(css.includes('.admin-actions-grid'), 'styles.css must style .admin-actions-grid');
  assert.ok(css.includes('.admin-action-btn'), 'styles.css must style .admin-action-btn');
  assert.ok(css.includes('.admin-activity-card'), 'styles.css must style .admin-activity-card');
  assert.ok(css.includes('.admin-activity-row'), 'styles.css must style .admin-activity-row');
  assert.ok(css.includes('.user-profile-dropdown'), 'styles.css must style .user-profile-dropdown');
  assert.ok(css.includes('.notif-dropdown-panel'), 'styles.css must style .notif-dropdown-panel');
});

