import assert from "node:assert/strict";
import test from "node:test";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  BLOOMCARE_PHARMACY_NAME,
  BLOOMCARE_PHARMACY_LOCATION,
  BLOOMCARE_PHONE,
  BLOOMCARE_CENTRAL_LOCATION
} from "../BLOOMCARE-main/mbarara-delivery-areas.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, "..");
const INDEX_HTML_PATH = path.join(ROOT_DIR, "BLOOMCARE-main", "index.html");
const APP_JS_PATH = path.join(ROOT_DIR, "BLOOMCARE-main", "app.js");
const FIREBASE_JS_PATH = path.join(ROOT_DIR, "BLOOMCARE-main", "firebase.js");
const STYLES_CSS_PATH = path.join(ROOT_DIR, "BLOOMCARE-main", "styles.css");

test("1. CENTRALIZED CONSTANTS: Exports canonical pharmacy location and name", () => {
  assert.equal(BLOOMCARE_PHARMACY_NAME, "BloomCare Pharmacy");
  assert.equal(
    BLOOMCARE_PHARMACY_LOCATION,
    "Near Mbarara Regional Referral Hospital, Opposite Rubis Station, Near Mbarara Central Police Station, Mbarara City, Uganda"
  );
  assert.equal(BLOOMCARE_PHONE, "+256 700 000 000");
  assert.equal(BLOOMCARE_CENTRAL_LOCATION.city, "Mbarara City");
  assert.equal(BLOOMCARE_CENTRAL_LOCATION.fullAddress, BLOOMCARE_PHARMACY_LOCATION);
});

test("2. FIREBASE SYSTEM SETTINGS: Fallback address points to Mbarara dispensary", () => {
  const firebaseJs = fs.readFileSync(FIREBASE_JS_PATH, "utf8");
  assert.ok(
    firebaseJs.includes("Near Mbarara Regional Referral Hospital, Opposite Rubis Station, Near Mbarara Central Police Station, Mbarara City, Uganda"),
    "firebase.js getSystemSettings must use Mbarara dispensary location"
  );
  assert.ok(!firebaseJs.includes("Plot 14, Kampala Road"), "firebase.js must not contain Plot 14, Kampala Road");
});

test("3. EXACT RECEIPT/BRANDING HEADER: Contains required brand, tagline, Mbarara address and phone", () => {
  const html = fs.readFileSync(INDEX_HTML_PATH, "utf8");
  const receiptStart = html.indexOf('class="receipt-header"');
  assert.ok(receiptStart !== -1, "index.html must contain receipt-header");
  const receiptHeader = html.slice(receiptStart, receiptStart + 1200);

  assert.ok(receiptHeader.includes("BLOOMCARE PHARMACY"), "Must retain BLOOMCARE PHARMACY brand name");
  assert.match(receiptHeader, /Professional Pharmacy Services/i, "Must retain Professional Pharmacy Services tagline");
  assert.ok(
    receiptHeader.includes("Near Mbarara Regional Referral Hospital, Opposite Rubis Station, Near Mbarara Central Police Station, Mbarara City, Uganda"),
    "Must have the exact Mbarara dispensary address"
  );
  assert.ok(receiptHeader.includes("+256 700 000 000"), "Must keep existing valid phone number +256 700 000 000");
  assert.ok(!receiptHeader.includes("Plot 14, Kampala Road"), "Receipt header must not contain Plot 14, Kampala Road");
  assert.ok(!receiptHeader.includes("Central Kampala"), "Receipt header must not contain Central Kampala");
});

test("4. ANNOUNCEMENT BAR: Displays Mbarara City, Uganda and valid contact numbers", () => {
  const html = fs.readFileSync(INDEX_HTML_PATH, "utf8");
  const annStart = html.indexOf('class="main-top-announcement"');
  const annSection = html.slice(annStart, annStart + 600);

  assert.match(annSection, /BloomCare Pharmacy Uganda.*Mbarara City, Uganda/s);
  assert.ok(!annSection.includes("Kampala, Uganda"));
  assert.ok(annSection.includes("+256 700 000 000"));
  assert.ok(annSection.includes("0750210886"));
});

test("5. CONTACT US: Location card references Mbarara Regional Referral Hospital", () => {
  const html = fs.readFileSync(INDEX_HTML_PATH, "utf8");
  const contactSection = html.slice(html.indexOf('id="view-contact"'), html.indexOf('id="view-about"'));

  assert.ok(contactSection.includes("Near Mbarara Regional Referral Hospital"));
  assert.ok(contactSection.includes("Opposite Rubis Station, Near Mbarara Central Police Station, Mbarara City, Uganda"));
  assert.ok(!contactSection.includes("Plot 14, Kampala Road"));
});

test("6. ABOUT US: Physical Hub references Mbarara Central Dispensary", () => {
  const html = fs.readFileSync(INDEX_HTML_PATH, "utf8");
  const aboutSection = html.slice(html.indexOf('id="view-about"'), html.indexOf('id="view-auth"'));

  assert.ok(aboutSection.includes("Mbarara Central Dispensary"));
  assert.ok(aboutSection.includes("Near Mbarara Regional Referral Hospital, Opposite Rubis Station, Near Mbarara Central Police Station, Mbarara City, Uganda"));
  assert.ok(!aboutSection.includes("Kampala Central Dispensary"));
  assert.ok(!aboutSection.includes("Plot 14, Kampala Road, Central Kampala"));
});

test("7. APP.JS CONTROLLER: Notification, hero, and receipt binding use Mbarara location", () => {
  const appJs = fs.readFileSync(APP_JS_PATH, "utf8");

  assert.ok(!appJs.includes("collection at Plot 14 Kampala Road"), "app.js must not direct pickups to Kampala Road");
  assert.ok(appJs.includes("BloomCare Central Dispensary (Near Mbarara Regional Referral Hospital"), "Pickup notification must reference Mbarara");
  assert.ok(appJs.includes("reliable prescription delivery in Mbarara City"), "Hero tagline must state Mbarara City");
  assert.ok(appJs.includes("BLOOMCARE_PHARMACY_LOCATION"), "app.js must import and reference centralized BLOOMCARE_PHARMACY_LOCATION");
});

test("8. CSS STYLING & MOBILE WRAPPING: Styles receipt-address-line and brand row", () => {
  const css = fs.readFileSync(STYLES_CSS_PATH, "utf8");

  assert.ok(css.includes(".receipt-address-line"), "CSS must style .receipt-address-line");
  assert.ok(css.includes("word-wrap: break-word") || css.includes("overflow-wrap: break-word"), "Must handle word wrapping safely");
  assert.match(css, /@media\s*\(max-width:\s*480px\)/, "Must include mobile breakpoint for small devices");
});
