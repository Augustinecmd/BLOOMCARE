import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const htmlPath = path.join(rootDir, 'BLOOMCARE-main', 'index.html');
const cssPath = path.join(rootDir, 'BLOOMCARE-main', 'styles.css');

test('1. FOOTER POSITION: Copyright footer appears at the very bottom after all page content', () => {
  const html = fs.readFileSync(htmlPath, 'utf8');

  const headerIndex = html.indexOf('id="app-top-header"');
  const mainIndex = html.indexOf('id="app-content-viewport"');
  const footerIndex = html.indexOf('id="main-bottom-footer"');

  assert.ok(headerIndex !== -1, 'app-top-header must exist');
  assert.ok(mainIndex !== -1, 'app-content-viewport must exist');
  assert.ok(footerIndex !== -1, 'main-bottom-footer must exist');

  assert.ok(headerIndex < mainIndex, 'Header must come before main content');
  assert.ok(mainIndex < footerIndex, 'Main content must come before bottom footer');
});

test('2. NO TOP INSTANCE: Footer and copyright do not appear at the top above header', () => {
  const html = fs.readFileSync(htmlPath, 'utf8');

  const headerIndex = html.indexOf('id="app-top-header"');
  const topPart = html.substring(0, headerIndex);

  assert.ok(!topPart.includes('Licensed by National Drug Authority (#NDA/UG/PHARM/2026/894)'), 'Top of page must NOT contain copyright/NDA licensing text');
  assert.ok(!topPart.includes('id="top-site-info-bar"'), 'top-site-info-bar must NOT exist at top of page');
});

test('3. EXACT TEXT & LICENSING: Exact copyright and National Drug Authority text in bottom footer', () => {
  const html = fs.readFileSync(htmlPath, 'utf8');

  const exactLicenseText = '&copy; 2026 BloomCare Pharmacy. All rights reserved. Licensed by National Drug Authority (#NDA/UG/PHARM/2026/894).';
  const footerStart = html.indexOf('id="main-bottom-footer"');
  const footerEnd = html.indexOf('</footer>', footerStart);
  const footerContent = html.substring(footerStart, footerEnd + 9);

  assert.ok(footerContent.includes(exactLicenseText), 'Footer must contain exact licensing text');
  assert.ok(footerContent.includes('Pharmacy Workers:'), 'Footer must contain "Pharmacy Workers:" prefix');
  assert.ok(footerContent.includes('Staff Portal Sign In'), 'Footer must contain "Staff Portal Sign In" label');
});

test('4. CLICKABLE LINK: Staff Portal Sign In links to #staff-login with data-route="staff-login"', () => {
  const html = fs.readFileSync(htmlPath, 'utf8');

  const footerStart = html.indexOf('id="main-bottom-footer"');
  const footerEnd = html.indexOf('</footer>', footerStart);
  const footerContent = html.substring(footerStart, footerEnd + 9);

  assert.ok(
    footerContent.includes('href="#staff-login"') && footerContent.includes('data-route="staff-login"'),
    'Footer link must have href="#staff-login" and data-route="staff-login"'
  );
});

test('5. STICKY FOOTER LAYOUT & CSS: Proper flex-based sticky layout and full width styling', () => {
  const css = fs.readFileSync(cssPath, 'utf8');

  assert.ok(css.includes('.app-main-viewport-container'), 'styles.css must style .app-main-viewport-container');
  assert.ok(css.includes('.main-bottom-footer'), 'styles.css must style .main-bottom-footer');
  assert.ok(css.includes('margin-top: auto'), 'main-bottom-footer must have margin-top: auto for sticky behavior');
  assert.ok(css.includes('width: 100%'), 'main-bottom-footer must be full width');
  assert.ok(css.includes('border-bottom: 3px solid #065f46') || css.includes('#065f46'), 'Footer must feature green border');
});

test('6. SINGLE INSTANCE: Exactly one footer and one copyright block on the page', () => {
  const html = fs.readFileSync(htmlPath, 'utf8');

  const matches = html.match(/Licensed by National Drug Authority \(#NDA\/UG\/PHARM\/2026\/894\)/g) || [];
  assert.equal(matches.length, 1, 'There must be exactly one instance of the copyright/licensing text on the page');

  const footerMatches = html.match(/<footer class="main-bottom-footer"/g) || [];
  assert.equal(footerMatches.length, 1, 'There must be exactly one main-bottom-footer on the page');
});
