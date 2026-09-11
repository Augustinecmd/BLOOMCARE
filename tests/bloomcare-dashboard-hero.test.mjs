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

const indexHtml = fs.readFileSync(htmlPath, 'utf8');
const appJs = fs.readFileSync(appJsPath, 'utf8');
const stylesCss = fs.readFileSync(cssPath, 'utf8');

// Import exported functions from app.js
const {
  renderBloomCareDashboardHero,
  openBloomCareHeroLightbox,
  closeBloomCareHeroLightbox
} = await import('../BLOOMCARE-main/app.js');

test('1. SHARED HERO CONTAINER: index.html contains #bloomcare-dashboard-hero above #role-dashboard-container', () => {
  assert.ok(indexHtml.includes('id="bloomcare-dashboard-hero"'), 'index.html must contain #bloomcare-dashboard-hero container');
  assert.ok(indexHtml.includes('id="role-dashboard-container"'), 'index.html must contain #role-dashboard-container');
  
  const heroIndex = indexHtml.indexOf('id="bloomcare-dashboard-hero"');
  const roleIndex = indexHtml.indexOf('id="role-dashboard-container"');
  assert.ok(heroIndex < roleIndex, '#bloomcare-dashboard-hero must appear before #role-dashboard-container in the dashboard pane');
});

test('2. HERO LIGHTBOX MODAL: index.html contains #bloomcare-hero-lightbox dialog with close button and caption', () => {
  assert.ok(indexHtml.includes('id="bloomcare-hero-lightbox"'), 'index.html must contain #bloomcare-hero-lightbox dialog');
  assert.ok(indexHtml.includes('id="close-hero-lightbox"'), 'index.html must contain #close-hero-lightbox close button');
  assert.ok(indexHtml.includes('bloomcare-customer-hero.png'), 'Lightbox must reference bloomcare-customer-hero.png');
});

test('3. HERO CONTROLLER FUNCTIONS: app.js exports renderBloomCareDashboardHero, open/close lightbox', () => {
  assert.equal(typeof renderBloomCareDashboardHero, 'function', 'renderBloomCareDashboardHero must be an exported function');
  assert.equal(typeof openBloomCareHeroLightbox, 'function', 'openBloomCareHeroLightbox must be an exported function');
  assert.equal(typeof closeBloomCareHeroLightbox, 'function', 'closeBloomCareHeroLightbox must be an exported function');
});

test('4. ROLE DASHBOARD INTEGRATION: renderRoleDashboard automatically invokes renderBloomCareDashboardHero for all roles', () => {
  assert.ok(
    appJs.includes('renderBloomCareDashboardHero()'),
    'renderRoleDashboard must invoke renderBloomCareDashboardHero() so every authenticated user sees it'
  );
});

test('5. REQUIRED BRAND COPY & CHECKLIST: app.js generates exact headline, supporting text, and values', () => {
  assert.ok(appJs.includes('BLOOMCARE PHARMACY'), 'Must include badge BLOOMCARE PHARMACY');
  assert.ok(appJs.includes('Care That Goes'), 'Must include Care That Goes');
  assert.ok(appJs.includes('Beyond Medicine.'), 'Must include Beyond Medicine.');
  assert.ok(appJs.includes('Quality medicines, trusted healthcare and a healthier community'), 'Must include supporting text');
  assert.ok(appJs.includes('Quality Medicines'), 'Must include Quality Medicines check');
  assert.ok(appJs.includes('Trusted Healthcare'), 'Must include Trusted Healthcare check');
  assert.ok(appJs.includes('Better Community'), 'Must include Better Community check');
  assert.ok(appJs.includes('Explore BloomCare'), 'Must include Explore BloomCare button text');
  assert.ok(appJs.includes('"Your Health, Our Priority"'), 'Must include "Your Health, Our Priority" tagline');
});

test('6. HERO IMAGE INTERACTION: app.js wires click on image container to open lightbox and explore action', () => {
  assert.ok(appJs.includes('id="bloomcare-hero-img-container"'), 'Must contain #bloomcare-hero-img-container');
  assert.ok(appJs.includes('id="btn-hero-explore"'), 'Must contain #btn-hero-explore');
  assert.ok(appJs.includes('bloomcare-customer-hero.png'), 'Must use the official bloomcare-customer-hero.png image');
  assert.ok(appJs.includes('openBloomCareHeroLightbox'), 'Must bind openBloomCareHeroLightbox to image click');
});

test('7. CSS STYLING & DESIGN QUALITY: styles.css contains rules for card, layout, ambient glow, and hover', () => {
  assert.ok(stylesCss.includes('.bloomcare-hero-card'), 'styles.css must style .bloomcare-hero-card');
  assert.ok(stylesCss.includes('.bloomcare-hero-layout'), 'styles.css must style .bloomcare-hero-layout');
  assert.ok(stylesCss.includes('.bloomcare-hero-glow-1'), 'styles.css must style .bloomcare-hero-glow-1');
  assert.ok(stylesCss.includes('.bloomcare-customer-hero-img'), 'styles.css must style .bloomcare-customer-hero-img');
  assert.ok(stylesCss.includes('.bloomcare-hero-img-container:hover'), 'styles.css must include hover effect');
  assert.ok(stylesCss.includes('.bloomcare-lightbox-dialog'), 'styles.css must style .bloomcare-lightbox-dialog');
});

test('8. RESPONSIVE BREAKPOINTS: styles.css includes tablet (899px) and mobile (640px) vertical stacking rules', () => {
  assert.ok(stylesCss.includes('@media (max-width: 899px)'), 'styles.css must have tablet breakpoint');
  assert.ok(stylesCss.includes('@media (max-width: 640px)'), 'styles.css must have mobile breakpoint');
});

