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
const cssPath = path.join(bloomcareDir, 'styles.css');

test('ABOUT US: #view-about pane exists in index.html', () => {
  const html = fs.readFileSync(htmlPath, 'utf8');
  assert.ok(html.includes('id="view-about"'), 'About Us pane must exist with id="view-about"');
});

test('ABOUT US: Header displays official NDA Accreditation badge', () => {
  const html = fs.readFileSync(htmlPath, 'utf8');
  const aboutSection = html.slice(html.indexOf('id="view-about"'), html.indexOf('id="view-auth"'));
  assert.ok(
    aboutSection.includes('#NDA/UG/PHARM/2026/894'),
    'About Us header must display the official NDA license #NDA/UG/PHARM/2026/894'
  );
  assert.ok(
    aboutSection.includes('about-nda-badge'),
    'Must have .about-nda-badge styling element'
  );
});

test('ABOUT US: Section 1 (Hero Facility Story & Metrics) features 4K hero image and stats grid', () => {
  const html = fs.readFileSync(htmlPath, 'utf8');
  const aboutSection = html.slice(html.indexOf('id="view-about"'), html.indexOf('id="view-auth"'));

  assert.ok(aboutSection.includes('about-hero-grid'), 'Must include .about-hero-grid layout');
  assert.ok(aboutSection.includes('src="pharmacy-hero.jpg"'), 'Must reference pharmacy-hero.jpg');
  assert.ok(aboutSection.includes('about-stats-grid'), 'Must include .about-stats-grid');
  assert.ok(aboutSection.includes('100%'), 'Must include 100% Genuine stat');
  assert.ok(aboutSection.includes('&lt; 15m'), 'Must include < 15m stat');
  assert.ok(aboutSection.includes('Same-Day'), 'Must include Same-Day Delivery stat');
  assert.ok(aboutSection.includes('3 Hubs'), 'Must include 3 Hubs stat');
});

test('ABOUT US: Section 2 (Clinical Standards) features 4K cold-chain image and quality features', () => {
  const html = fs.readFileSync(htmlPath, 'utf8');
  const aboutSection = html.slice(html.indexOf('id="view-about"'), html.indexOf('id="view-auth"'));

  assert.ok(aboutSection.includes('about-standards-grid'), 'Must include .about-standards-grid');
  assert.ok(aboutSection.includes('src="pharmacy-cold-chain.jpg"'), 'Must reference pharmacy-cold-chain.jpg');
  assert.ok(aboutSection.includes('2°C – 8°C Digital Telemetry Validated'), 'Must include cold-chain telemetry badge');
  assert.ok(aboutSection.includes('Prescription Clinical Gate'), 'Must mention Prescription Clinical Gate');
  assert.ok(aboutSection.includes('One-on-One Patient Counseling'), 'Must mention Patient Counseling');
});

test('ABOUT US: Section 3 (Clinical Team) displays 3 licensed pharmacists with 4K portraits and consultation buttons', () => {
  const html = fs.readFileSync(htmlPath, 'utf8');
  const aboutSection = html.slice(html.indexOf('id="view-about"'), html.indexOf('id="view-auth"'));

  assert.ok(aboutSection.includes('about-team-grid'), 'Must have .about-team-grid');
  
  // Pharmacist 1
  assert.ok(aboutSection.includes('Dr. Amina Nanyonga'), 'Must feature Dr. Amina Nanyonga');
  assert.ok(aboutSection.includes('src="pharmacist-amina.jpg"'), 'Must have pharmacist-amina.jpg');
  
  // Pharmacist 2
  assert.ok(aboutSection.includes('Pharm. David Mukasa'), 'Must feature Pharm. David Mukasa');
  assert.ok(aboutSection.includes('src="pharmacist-david.jpg"'), 'Must have pharmacist-david.jpg');

  // Pharmacist 3
  assert.ok(aboutSection.includes('Pharm. Sarah Namusoke'), 'Must feature Pharm. Sarah Namusoke');
  assert.ok(aboutSection.includes('src="pharmacist-sarah.jpg"'), 'Must have pharmacist-sarah.jpg');

  // Consultation triggers
  const bookSessionMatches = aboutSection.match(/data-route="consultations"/g) || [];
  assert.ok(
    bookSessionMatches.length >= 3,
    'Each pharmacist card must have a Book Session button linking to data-route="consultations"'
  );
});

test('ABOUT US: Section 4 (Physical Hubs) includes Kampala Dispensary, Western Hub, and Care Desk with vector icons', () => {
  const html = fs.readFileSync(htmlPath, 'utf8');
  const aboutSection = html.slice(html.indexOf('id="view-about"'), html.indexOf('id="view-auth"'));

  assert.ok(aboutSection.includes('about-hubs-grid'), 'Must have .about-hubs-grid');
  assert.ok(aboutSection.includes('Kampala Central Dispensary'), 'Must include Kampala Central Dispensary');
  assert.ok(aboutSection.includes('Western Uganda Regional Hub'), 'Must include Western Uganda Regional Hub');
  assert.ok(aboutSection.includes('Direct Pharmacy Care Desk'), 'Must include Direct Pharmacy Care Desk');
});

test('ABOUT US: Section 5 (Regulatory Accreditations) showcases NDA, PSU, GPP, and GDP Cold-Chain', () => {
  const html = fs.readFileSync(htmlPath, 'utf8');
  const aboutSection = html.slice(html.indexOf('id="view-about"'), html.indexOf('id="view-auth"'));

  assert.ok(aboutSection.includes('about-accred-strip'), 'Must have .about-accred-strip');
  assert.ok(aboutSection.includes('National Drug Authority'), 'Must include National Drug Authority');
  assert.ok(aboutSection.includes('Pharmaceutical Society of Uganda'), 'Must include Pharmaceutical Society of Uganda');
  assert.ok(aboutSection.includes('Good Pharmacy Practice (GPP)'), 'Must include Good Pharmacy Practice');
  assert.ok(aboutSection.includes('GDP Cold-Chain Protocol'), 'Must include GDP Cold-Chain Protocol');
});

test('ABOUT US: Zero raw emojis in #view-about (Professional Healthcare Vector SVG Standard)', () => {
  const html = fs.readFileSync(htmlPath, 'utf8');
  const aboutSection = html.slice(html.indexOf('id="view-about"'), html.indexOf('id="view-auth"'));

  // Regex detecting common emojis and emoji ranges
  const emojiRegex = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{1F000}-\u{1F02F}\u{1F0A0}-\u{1F0FF}]/u;
  const match = aboutSection.match(emojiRegex);
  assert.equal(
    match,
    null,
    `Found raw emoji in #view-about: "${match?.[0]}". BloomCare standard requires vector SVGs.`
  );
});

test('ABOUT US: All 5 4K image assets exist on disk in BLOOMCARE-main directory', () => {
  const requiredImages = [
    'pharmacy-hero.jpg',
    'pharmacy-cold-chain.jpg',
    'pharmacist-amina.jpg',
    'pharmacist-david.jpg',
    'pharmacist-sarah.jpg'
  ];

  for (const imgName of requiredImages) {
    const imgPath = path.join(bloomcareDir, imgName);
    assert.ok(fs.existsSync(imgPath), `Image file ${imgName} must exist on disk at ${imgPath}`);
    const stats = fs.statSync(imgPath);
    assert.ok(stats.size > 10000, `Image file ${imgName} must be substantial (>10KB), found ${stats.size} bytes`);
  }
});

test('ABOUT US: Responsive CSS rules exist for desktop, tablet, and mobile', () => {
  const css = fs.readFileSync(cssPath, 'utf8');

  // Base rules
  assert.ok(css.includes('.about-hero-grid'), 'Must define .about-hero-grid');
  assert.ok(css.includes('.about-stats-grid'), 'Must define .about-stats-grid');
  assert.ok(css.includes('.about-standards-grid'), 'Must define .about-standards-grid');
  assert.ok(css.includes('.about-team-grid'), 'Must define .about-team-grid');
  assert.ok(css.includes('.about-team-card'), 'Must define .about-team-card');
  assert.ok(css.includes('.about-hubs-grid'), 'Must define .about-hubs-grid');
  assert.ok(css.includes('.about-accred-strip'), 'Must define .about-accred-strip');

  // Responsive breakpoints
  assert.ok(css.includes('@media (max-width: 1024px)'), 'Must include 1024px breakpoint');
  assert.ok(css.includes('@media (max-width: 640px)'), 'Must include 640px breakpoint');
});

