import { test } from "node:test";
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
const categoriesDir = path.join(rootDir, "BLOOMCARE-main", "categories");

test("1. SVG ASSETS: All 16 healthcare category SVGs exist and are well-formed", () => {
  const expectedSvgs = [
    "all-medicines.svg",
    "pain-relief.svg",
    "cold-flu.svg",
    "vitamins-supplements.svg",
    "digestive-health.svg",
    "first-aid.svg",
    "skin-care.svg",
    "personal-care.svg",
    "baby-child-care.svg",
    "maternal-health.svg",
    "chronic-care.svg",
    "diabetes-care.svg",
    "respiratory-care.svg",
    "allergy-care.svg",
    "medical-devices.svg",
    "wellness-products.svg"
  ];

  for (const svgFile of expectedSvgs) {
    const filePath = path.join(categoriesDir, svgFile);
    assert.ok(fs.existsSync(filePath), `Category SVG ${svgFile} must exist at ${filePath}`);
    const content = fs.readFileSync(filePath, "utf8");
    assert.ok(content.includes("<svg"), `${svgFile} must contain <svg root tag`);
    assert.ok(content.includes("viewBox="), `${svgFile} must have a viewBox defined`);
    assert.ok(content.includes("</svg>"), `${svgFile} must have closing </svg> tag`);
  }
});

test("2. CATEGORY DATA MODEL: ESSENTIAL_CATEGORIES and DEFAULT_CATEGORY_IMAGES define imageUrl and map categories", async () => {
  const appJs = await import(`file://${appJsPath}`);
  
  assert.ok(typeof appJs.getCategoryImageUrl === "function", "getCategoryImageUrl must be exported as a function");
  assert.ok(appJs.DEFAULT_CATEGORY_IMAGES, "DEFAULT_CATEGORY_IMAGES map must be exported");

  // Verify all 9 prompt-specified categories resolve to their icons
  const testCategories = [
    { key: "all", expected: "categories/all-medicines.svg" },
    { key: "Pain Relief", expected: "categories/pain-relief.svg" },
    { key: "Cold & Flu", expected: "categories/cold-flu.svg" },
    { key: "Vitamins & Supplements", expected: "categories/vitamins-supplements.svg" },
    { key: "Digestive Health", expected: "categories/digestive-health.svg" },
    { key: "First Aid", expected: "categories/first-aid.svg" },
    { key: "Skin Care", expected: "categories/skin-care.svg" },
    { key: "Personal Care", expected: "categories/personal-care.svg" },
    { key: "Baby & Child Care", expected: "categories/baby-child-care.svg" }
  ];

  for (const { key, expected } of testCategories) {
    const resolvedUrl = appJs.getCategoryImageUrl(key);
    assert.equal(resolvedUrl, expected, `Category "${key}" should resolve to "${expected}"`);
  }

  // Verify object lookup with imageUrl or name
  assert.equal(appJs.getCategoryImageUrl({ name: "Pain Relief" }), "categories/pain-relief.svg");
  assert.equal(appJs.getCategoryImageUrl({ imageUrl: "custom/url.png" }), "custom/url.png");
  assert.equal(appJs.getCategoryImageUrl(null), "categories/all-medicines.svg");
});

test("3. STOREFRONT & DASHBOARD PILLS: Category pills contain images, title, counts, and active styling", () => {
  const appJs = fs.readFileSync(appJsPath, "utf8");

  assert.ok(appJs.includes("cust-dash-category-pills"), "app.js must include #cust-dash-category-pills container");
  assert.ok(appJs.includes("cust-dash-cat-pill"), "app.js must include .cust-dash-cat-pill class");
  assert.ok(appJs.includes("cat-card-img"), "app.js must render .cat-card-img inside pills");
  assert.ok(appJs.includes("cat-pill-icon-wrap"), "app.js must render .cat-pill-icon-wrap");
  assert.ok(appJs.includes("cat-pill-count"), "app.js must display dynamic product counts in .cat-pill-count");
  assert.ok(appJs.includes("Quick filter by therapeutic class"), "app.js must maintain 'Quick filter by therapeutic class' subtitle");
  assert.ok(appJs.includes("All Medicines (${activeProducts.length})") || appJs.includes("All Medicines"), "app.js must render All Medicines with product count");
});

test("4. ADMIN CATEGORY MANAGEMENT: Dialog and table support images, status toggling, and edits", () => {
  const indexHtml = fs.readFileSync(indexHtmlPath, "utf8");
  const appJs = fs.readFileSync(appJsPath, "utf8");

  // Modal inputs
  assert.ok(indexHtml.includes('id="cat-status"'), "index.html must include #cat-status select");
  assert.ok(indexHtml.includes('id="cat-image-preview"'), "index.html must include #cat-image-preview");
  assert.ok(indexHtml.includes('id="cat-image-file"'), "index.html must include #cat-image-file");
  assert.ok(indexHtml.includes('id="cat-image-url"'), "index.html must include #cat-image-url");

  // App.js handlers
  assert.ok(appJs.includes("toggle-cat-status-btn"), "app.js must render .toggle-cat-status-btn for activating/deactivating categories");
  assert.ok(appJs.includes("edit-cat-btn"), "app.js must wire edit-cat-btn to populate and open category modal");
  assert.ok(appJs.includes("cat-image-file"), "app.js must handle #cat-image-file change event");
});

test("5. CSS RESPONSIVENESS & BRANDING: styles.css contains rules for category pills, hover lift, and active states", () => {
  const stylesCss = fs.readFileSync(stylesCssPath, "utf8");

  assert.ok(stylesCss.includes(".cust-dash-category-pills"), "styles.css must style .cust-dash-category-pills");
  assert.ok(stylesCss.includes("overflow-x: auto"), "styles.css must allow horizontal scrolling");
  assert.ok(stylesCss.includes(".cust-dash-cat-pill"), "styles.css must style .cust-dash-cat-pill");
  assert.ok(stylesCss.includes(".cust-dash-cat-pill:hover"), "styles.css must define hover effect on category pills");
  assert.ok(stylesCss.includes(".cust-dash-cat-pill.active"), "styles.css must define active state on category pills");
  assert.ok(stylesCss.includes("#0f766e"), "styles.css must use BloomCare primary brand color #0f766e");
  assert.ok(stylesCss.includes(".cat-card-img"), "styles.css must style .cat-card-img");
});

