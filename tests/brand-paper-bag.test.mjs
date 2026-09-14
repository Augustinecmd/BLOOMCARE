import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const appJsPath = path.join(rootDir, "BLOOMCARE-main", "app.js");
const indexHtmlPath = path.join(rootDir, "BLOOMCARE-main", "index.html");
const stylesCssPath = path.join(rootDir, "BLOOMCARE-main", "styles.css");
const bagImgPath = path.join(rootDir, "BLOOMCARE-main", "bloomcare-paper-bag.jpg");

test("1. BRAND ASSET INTEGRITY: bloomcare-paper-bag.jpg exists and is non-empty", () => {
  assert.ok(fs.existsSync(bagImgPath), "bloomcare-paper-bag.jpg must exist in BLOOMCARE-main directory");
  const stats = fs.statSync(bagImgPath);
  assert.ok(stats.size > 50000, `Expected image file to be substantial (>50KB), got ${stats.size} bytes`);
});

test("2. CUSTOMER DASHBOARD HERO: Contains motto, 4 service tags, and paper bag image", () => {
  const appJs = fs.readFileSync(appJsPath, "utf8");
  
  // Check motto
  assert.ok(appJs.includes("Your Health, Our Priority"), "Hero must communicate 'Your Health, Our Priority'");
  
  // Check 4 pillars / service tags
  assert.ok(appJs.includes("Medicines"), "Hero must include Medicines pillar");
  assert.ok(appJs.includes("Wellness"), "Hero must include Wellness pillar");
  assert.ok(appJs.includes("Personal Care"), "Hero must include Personal Care pillar");
  assert.ok(appJs.includes("Health Advice"), "Hero must include Health Advice pillar");
  
  // Check bag image in hero
  assert.ok(appJs.includes('src="bloomcare-paper-bag.jpg"'), "Hero must display bloomcare-paper-bag.jpg");
  assert.ok(appJs.includes('alt="BloomCare Pharmacy branded paper bag"'), "Hero bag must have accessible alt text");
});

test("3. BLOOMCARE TRUST SECTION: Contains 'Why Choose BloomCare?' and 4 trust pillars", () => {
  const appJs = fs.readFileSync(appJsPath, "utf8");
  
  assert.ok(appJs.includes("Why Choose BloomCare?"), "Dashboard must contain 'Why Choose BloomCare?' section");
  assert.ok(appJs.includes("Quality Medicines"), "Trust section must feature Quality Medicines");
  assert.ok(appJs.includes("Health &amp; Wellness") || appJs.includes("Health & Wellness"), "Trust section must feature Health & Wellness");
  assert.ok(appJs.includes("Trusted Care"), "Trust section must feature Trusted Care");
  assert.ok(appJs.includes("Our Community"), "Trust section must feature Our Community");
  assert.ok(appJs.includes("Official Dispensary Bag"), "Trust section must highlight official dispensary bag");
});

test("4. DELIVERY REASSURANCE & PACKAGING: App and Order Confirmation contain reassurance message", () => {
  const appJs = fs.readFileSync(appJsPath, "utf8");
  const indexHtml = fs.readFileSync(indexHtmlPath, "utf8");
  
  // Active tracking reassurance in app.js
  assert.ok(
    appJs.includes("Your order will be carefully prepared and packed by BloomCare Pharmacy"),
    "Active tracking must contain delivery packaging reassurance"
  );
  
  // Order confirmation dialog banner in index.html
  assert.ok(
    indexHtml.includes("order-confirm-packaging-banner"),
    "index.html must include order confirmation packaging banner"
  );
  assert.ok(
    indexHtml.includes("Authentic BloomCare Dispensary Packaging"),
    "Order confirmation banner must reassure authentic dispensary packaging"
  );
  assert.ok(
    indexHtml.includes("bloomcare-paper-bag.jpg"),
    "Order confirmation banner must reference bloomcare-paper-bag.jpg"
  );
});

test("5. PHARMACY CONTACT DETAILS: Dynamic settings used with Care Beyond Medicines branding", () => {
  const appJs = fs.readFileSync(appJsPath, "utf8");
  
  assert.ok(appJs.includes("getConfiguredWhatsAppNumber"), "Contact block must use dynamic system settings for phone/WhatsApp");
  assert.ok(appJs.includes("www.bloomcare.ug"), "Contact block must include www.bloomcare.ug");
  assert.ok(appJs.includes("Care Beyond Medicines"), "Contact block must include official tagline 'Care Beyond Medicines'");
});

test("6. PRODUCT CARDS PURITY: Paper bag is NOT used inside product cards or recommendation items", () => {
  const appJs = fs.readFileSync(appJsPath, "utf8");
  
  // Function renderRecommendedProductCardHtml
  const recCardStart = appJs.indexOf("function renderRecommendedProductCardHtml");
  assert.ok(recCardStart !== -1, "renderRecommendedProductCardHtml must exist");
  const recCardEnd = appJs.indexOf("}", recCardStart + 200);
  const recCardSlice = appJs.slice(recCardStart, recCardEnd + 400);
  assert.strictEqual(
    recCardSlice.includes("bloomcare-paper-bag.jpg"),
    false,
    "Individual recommendation cards must NEVER use the paper bag image"
  );
});

test("7. RESPONSIVE CSS RULES: styles.css defines styles for hero, bag, and media queries", () => {
  const stylesCss = fs.readFileSync(stylesCssPath, "utf8");
  
  assert.ok(stylesCss.includes(".customer-hero-brand-card"), "styles.css must style customer-hero-brand-card");
  assert.ok(stylesCss.includes(".customer-hero-bag-img"), "styles.css must style customer-hero-bag-img");
  assert.ok(stylesCss.includes(".bloomcare-trust-card"), "styles.css must style bloomcare-trust-card");
  assert.ok(stylesCss.includes(".order-confirm-packaging-banner"), "styles.css must style order-confirm-packaging-banner");
});

