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

test('TOP BAR LAYOUT: Information bar exists at top of website above navigation header', () => {
  const html = fs.readFileSync(htmlPath, 'utf8');

  // Verify top information bar container exists
  assert.ok(html.includes('id="top-site-info-bar"'), 'top-site-info-bar must exist in index.html');
  assert.ok(html.includes('class="top-site-info-bar"'), 'top-site-info-bar class must exist');

  // Verify position: must appear before app-top-header in DOM order
  const topBarIndex = html.indexOf('id="top-site-info-bar"');
  const headerIndex = html.indexOf('id="app-top-header"');
  assert.ok(topBarIndex !== -1, 'Top information bar not found in index.html');
  assert.ok(headerIndex !== -1, 'app-top-header not found in index.html');
  assert.ok(topBarIndex < headerIndex, 'Top information bar must be positioned above app-top-header');
});

test('EXACT TEXT & LICENSING: Exact copyright and National Drug Authority text is present at top', () => {
  const html = fs.readFileSync(htmlPath, 'utf8');

  const exactLicenseText = '&copy; 2026 BloomCare Pharmacy. All rights reserved. Licensed by National Drug Authority (#NDA/UG/PHARM/2026/894).';
  assert.ok(html.includes(exactLicenseText), 'Must contain exact licensing text');
  assert.ok(html.includes('Pharmacy Workers:'), 'Must contain "Pharmacy Workers:" prefix');
  assert.ok(html.includes('Staff Portal Sign In'), 'Must contain "Staff Portal Sign In" label');
});

test('CLICKABLE LINK: Staff Portal Sign In links to #staff-login with data-route="staff-login"', () => {
  const html = fs.readFileSync(htmlPath, 'utf8');

  assert.ok(
    html.includes('href="#staff-login"') && html.includes('data-route="staff-login"'),
    'Must link to #staff-login with data-route="staff-login"'
  );
  assert.ok(
    html.includes('id="top-staff-portal-link"'),
    'Link must have id="top-staff-portal-link"'
  );
});

test('NO DUPLICATION: Bottom footer does not contain copyright or staff portal link', () => {
  const html = fs.readFileSync(htmlPath, 'utf8');

  const footerStart = html.indexOf('<footer class="main-bottom-footer"');
  assert.ok(footerStart !== -1, 'main-bottom-footer must exist');
  const footerEnd = html.indexOf('</footer>', footerStart);
  assert.ok(footerEnd !== -1, 'footer closing tag must exist');

  const footerContent = html.substring(footerStart, footerEnd + 9);
  assert.ok(!footerContent.includes('Licensed by National Drug Authority'), 'Footer must not duplicate NDA license');
  assert.ok(!footerContent.includes('Staff Portal Sign In'), 'Footer must not duplicate Staff Portal link');
  assert.ok(!footerContent.includes('&copy; 2026 BloomCare Pharmacy'), 'Footer must not duplicate copyright');
});

test('RESPONSIVE CSS: styles.css contains rules for top-site-info-bar and empty footer handling', () => {
  const css = fs.readFileSync(cssPath, 'utf8');

  assert.ok(css.includes('.top-site-info-bar'), 'styles.css must style .top-site-info-bar');
  assert.ok(css.includes('.top-site-info-inner'), 'styles.css must style .top-site-info-inner');
  assert.ok(css.includes('.top-staff-portal-link'), 'styles.css must style .top-staff-portal-link');
  assert.ok(css.includes('.main-bottom-footer:empty'), 'styles.css must handle .main-bottom-footer:empty');
});

