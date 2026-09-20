import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const bloomcareDir = path.join(rootDir, 'BLOOMCARE-main');
const htmlPath = path.join(bloomcareDir, 'index.html');
const appJsPath = path.join(bloomcareDir, 'app.js');
const stylesCssPath = path.join(bloomcareDir, 'styles.css');

const htmlContent = fs.readFileSync(htmlPath, 'utf8');
const appJsContent = fs.readFileSync(appJsPath, 'utf8');
const stylesCssContent = fs.readFileSync(stylesCssPath, 'utf8');

test('1. CUSTOMER PROFILE LOGOUT: Profile view contains prominent Sign Out card and action button', () => {
  assert.ok(htmlContent.includes('id="btn-profile-logout"'), 'Profile view must contain #btn-profile-logout button');
  assert.ok(htmlContent.includes('data-action="logout"'), 'Profile logout button must define data-action="logout"');
  assert.ok(htmlContent.includes('Sign Out of BloomCare'), 'Profile view must feature "Sign Out of BloomCare" card');
  assert.ok(htmlContent.includes('logout-account-card'), 'Profile view must have .logout-account-card class');
});

test('2. CUSTOMER SETTINGS & DASHBOARD LOGOUT: Prominent logout triggers available in settings and dashboard', () => {
  assert.ok(htmlContent.includes('id="btn-settings-logout"'), 'Settings view must contain #btn-settings-logout button');
  assert.ok(appJsContent.includes('btn-cust-dash-logout'), 'Customer dashboard must contain #btn-cust-dash-logout button');
  assert.ok(appJsContent.includes('customer-logout-trigger-btn'), 'Dashboard must use .customer-logout-trigger-btn');
});

test('3. SIDEBAR NAVIGATION: Customer sidebar config contains Sign Out item', () => {
  // Check customer sidebar config in app.js
  assert.ok(appJsContent.includes('{ route: "logout"'), 'Customer sidebar config must contain route: "logout"');
  assert.ok(appJsContent.includes('label: "Sign Out"'), 'Sidebar config must have label: "Sign Out"');
});

test('4. ROUTING & CONFIRMATION MODAL: Intercepts logout route and opens #logout-confirm-dialog', () => {
  assert.ok(appJsContent.includes('clean === "logout"'), 'checkRouteAccess and navigateTo must handle clean === "logout"');
  assert.ok(appJsContent.includes('$("#logout-confirm-dialog")?.showModal()'), 'Must show #logout-confirm-dialog modal');
  assert.ok(appJsContent.includes('closest(\'[data-action="logout"]'), 'Global click handler must intercept data-action="logout"');
});

test('5. 4K ULTRA-HD BRAND & STOREFRONT IMAGES: Core banners and logos meet 4K resolution standards', () => {
  // Read binary header to check dimensions of pharmacy-hero.jpg (JPEG)
  const heroPath = path.join(bloomcareDir, 'pharmacy-hero.jpg');
  assert.ok(fs.existsSync(heroPath), 'pharmacy-hero.jpg must exist');
  const heroStats = fs.statSync(heroPath);
  assert.ok(heroStats.size > 500000, 'pharmacy-hero.jpg 4K image must be substantial in size');

  const logoPath = path.join(bloomcareDir, 'bloomcare-logo.png');
  assert.ok(fs.existsSync(logoPath), 'bloomcare-logo.png must exist');
  const logoStats = fs.statSync(logoPath);
  assert.ok(logoStats.size > 500000, 'bloomcare-logo.png 4K logo must exist and be high resolution');

  const customerHeroPath = path.join(bloomcareDir, 'bloomcare-customer-hero.png');
  assert.ok(fs.existsSync(customerHeroPath), 'bloomcare-customer-hero.png must exist');
  const customerHeroStats = fs.statSync(customerHeroPath);
  assert.ok(customerHeroStats.size > 500000, 'bloomcare-customer-hero.png 4K image must exist');
});

test('6. 4K CSS RENDERING OPTIMIZATIONS: Stylesheet includes high-DPI and crisp-contrast rendering rules', () => {
  assert.ok(stylesCssContent.includes('image-rendering: -webkit-optimize-contrast'), 'CSS must include -webkit-optimize-contrast');
  assert.ok(stylesCssContent.includes('.logout-account-card'), 'CSS must style .logout-account-card');
  assert.ok(stylesCssContent.includes('.customer-logout-trigger-btn'), 'CSS must style .customer-logout-trigger-btn');
});
