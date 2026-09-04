import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  createWhatsAppUrl,
  normalizeWhatsAppPhone,
  validateWhatsAppPhone,
  getConfiguredWhatsAppNumber
} from "../BLOOMCARE-main/whatsapp.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const htmlPath = path.join(rootDir, "BLOOMCARE-main", "index.html");
const cssPath = path.join(rootDir, "BLOOMCARE-main", "styles.css");
const appJsPath = path.join(rootDir, "BLOOMCARE-main", "app.js");

test("formats Ugandan phone numbers for WhatsApp", () => {
  assert.equal(normalizeWhatsAppPhone("+256 750 210 886"), "256750210886");
  assert.deepEqual(validateWhatsAppPhone("0750210886").valid, true);
  assert.equal(normalizeWhatsAppPhone("+256 751 234 567"), "256751234567");
  assert.deepEqual(validateWhatsAppPhone("0751234567").valid, true);
  assert.equal(validateWhatsAppPhone("0750210").valid, false);
});

test("creates an encoded wa.me inquiry URL", () => {
  const urlWithMsg = createWhatsAppUrl("0750210886");
  assert.equal(urlWithMsg, "https://wa.me/256750210886?text=Hello%20BloomCare%20Pharmacy%2C%20I%20would%20like%20to%20make%20an%20inquiry.");

  const directUrl = createWhatsAppUrl("0750210886", "");
  assert.equal(directUrl, "https://wa.me/256750210886");
});

test("TOP CONTACT BAR: Displays WhatsApp Care Desk: 0750210886 in HTML", () => {
  const html = fs.readFileSync(htmlPath, "utf8");

  assert.ok(html.includes("WhatsApp Care Desk: 0750210886"), 'Must display "WhatsApp Care Desk: 0750210886"');
  assert.ok(html.includes('id="top-whatsapp-link"'), 'Must have id="top-whatsapp-link"');
  assert.ok(html.includes('class="announcement-link whatsapp-accent"'), "Must retain styling classes");
});

test("CLICKABLE WHATSAPP LINK: Points to https://wa.me/256750210886 with safe target attributes", () => {
  const html = fs.readFileSync(htmlPath, "utf8");

  assert.ok(html.includes('href="https://wa.me/256750210886"'), "Must link to https://wa.me/256750210886");
  
  const match = html.match(/<a[^>]*id="top-whatsapp-link"[^>]*>([\s\S]*?)<\/a>/);
  assert.ok(match, "top-whatsapp-link tag must be present");
  
  const tag = match[0];
  assert.ok(tag.includes('target="_blank"'), 'Must open in new tab (target="_blank")');
  assert.ok(tag.includes('rel="noopener noreferrer"'), 'Must include rel="noopener noreferrer" for security');
  assert.ok(match[1].includes("WhatsApp Care Desk: 0750210886"), 'Link text must contain "WhatsApp Care Desk: 0750210886"');
});

test("MAIN TELEPHONE: Retains Tel: +256 700 000 000 in top announcement bar", () => {
  const html = fs.readFileSync(htmlPath, "utf8");
  assert.ok(html.includes("Tel: +256 700 000 000"), "Main telephone must be preserved");
  assert.ok(html.includes('href="tel:+256700000000"'), "Telephone click-to-call link must be preserved");
});

test("STYLING & RESPONSIVENESS: CSS contains styling for announcement bar and whatsapp-accent", () => {
  const css = fs.readFileSync(cssPath, "utf8");

  assert.ok(css.includes(".main-top-announcement"), "CSS must style .main-top-announcement");
  assert.ok(css.includes(".announcement-right"), "CSS must style .announcement-right");
  assert.ok(css.includes(".whatsapp-accent"), "CSS must style .whatsapp-accent");
});

test("CENTRAL SETTINGS IN APP.JS: Default systemSettings defines whatsapp as 256750210886", () => {
  const appJs = fs.readFileSync(appJsPath, "utf8");

  assert.ok(appJs.includes('whatsapp: "256750210886"'), 'Default systemSettings in app.js must have whatsapp: "256750210886"');
  assert.ok(appJs.includes("syncWhatsAppLinks"), "app.js must define syncWhatsAppLinks() for central reactivity");
});

test("SETTINGS UTILITY: getConfiguredWhatsAppNumber returns 256750210886 by default", () => {
  const num = getConfiguredWhatsAppNumber({});
  assert.equal(num, "256750210886");

  const custom = getConfiguredWhatsAppNumber({ whatsapp: "0750210886" });
  assert.equal(custom, "256750210886");
});