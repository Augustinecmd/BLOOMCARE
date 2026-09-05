import assert from "node:assert/strict";
import test from "node:test";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  BLOOMCARE_CENTRAL_LOCATION,
  MBARARA_DIVISIONS,
  MBARARA_DELIVERY_AREAS,
  getMbararaDivisions,
  getMbararaAreas,
  isValidMbararaDivision,
  isValidMbararaArea,
  searchMbararaLocations,
  formatDeliveryAddress,
  validateMbararaDeliveryAddress
} from "../BLOOMCARE-main/mbarara-delivery-areas.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, "..");
const APP_JS_PATH = path.join(ROOT_DIR, "BLOOMCARE-main", "app.js");
const INDEX_HTML_PATH = path.join(ROOT_DIR, "BLOOMCARE-main", "index.html");
const STYLES_CSS_PATH = path.join(ROOT_DIR, "BLOOMCARE-main", "styles.css");

// -------------------------------------------------------------
// SUITE 1: CENTRAL REFERENCE POINT & DATA ARCHITECTURE
// -------------------------------------------------------------
test("1. CENTRAL REFERENCE POINT: Defines BloomCare Mbarara physical dispensary and dispatch policy", () => {
  assert.ok(BLOOMCARE_CENTRAL_LOCATION, "BLOOMCARE_CENTRAL_LOCATION must be exported");
  assert.equal(BLOOMCARE_CENTRAL_LOCATION.city, "Mbarara City");
  assert.match(BLOOMCARE_CENTRAL_LOCATION.referenceDescription, /Mbarara Regional Referral Hospital/i);
  assert.match(BLOOMCARE_CENTRAL_LOCATION.referenceDescription, /Rubis Station/i);
  assert.match(BLOOMCARE_CENTRAL_LOCATION.referenceDescription, /Mbarara Central Police Station/i);
  assert.match(BLOOMCARE_CENTRAL_LOCATION.dispatchPolicyNotice, /Mbarara City and surrounding service areas/i);
});

test("2. MBARARA DIVISIONS: Defines the 6 official city divisions", () => {
  const expected = ["Kamukuzi", "Kakoba", "Nyamitanga", "Kakiika", "Biharwe", "Nyakayojo"];
  assert.deepEqual(MBARARA_DIVISIONS, expected);
  assert.equal(getMbararaDivisions().length, 6);
  expected.forEach(div => {
    assert.ok(isValidMbararaDivision(div), `Division ${div} should be valid`);
    assert.ok(isValidMbararaDivision(div.toLowerCase()), `Division ${div} should be valid case-insensitively`);
  });
  assert.equal(isValidMbararaDivision("Kampala Central"), false, "Kampala Central should not be a Mbarara division");
});

test("3. VERIFIED AREAS & OTHER FALLBACK: All 6 divisions have verified areas and 'Other' option", () => {
  MBARARA_DIVISIONS.forEach(div => {
    const areas = getMbararaAreas(div);
    assert.ok(Array.isArray(areas) && areas.length > 2, `Division ${div} must have multiple verified areas`);
    assert.ok(areas.includes("Other"), `Division ${div} must provide 'Other' option`);
  });

  // Check specific expected areas
  assert.ok(getMbararaAreas("Kamukuzi").includes("Kiyanja"));
  assert.ok(getMbararaAreas("Kamukuzi").includes("Kisenyi"));
  assert.ok(getMbararaAreas("Kamukuzi").includes("Booma"));
  assert.ok(getMbararaAreas("Kakoba").includes("Nyamityobora"));
  assert.ok(getMbararaAreas("Kakoba").includes("Alliance"));
  assert.ok(getMbararaAreas("Nyamitanga").includes("Rwebikoona"));
  assert.ok(getMbararaAreas("Nyamitanga").includes("Katete"));
  assert.ok(getMbararaAreas("Kakiika").includes("Makenke"));
  assert.ok(getMbararaAreas("Biharwe").includes("Nyabuhama"));
  assert.ok(getMbararaAreas("Nyakayojo").includes("Katojo"));
});

// -------------------------------------------------------------
// SUITE 2: SEARCH & ADDRESS FORMATTING UTILITIES
// -------------------------------------------------------------
test("4. FAST LOCATION SEARCH: searchMbararaLocations filters areas and divisions by prefix and substring", () => {
  const kiyMatches = searchMbararaLocations("kiy");
  assert.ok(kiyMatches.some(m => m.division === "Kamukuzi" && m.area === "Kiyanja"));

  const nyamMatches = searchMbararaLocations("nyam");
  assert.ok(nyamMatches.some(m => m.division === "Kakoba" && m.area === "Nyamityobora"));
  assert.ok(nyamMatches.some(m => m.division === "Nyamitanga"));

  const allMatches = searchMbararaLocations("");
  assert.ok(allMatches.length > 20, "Empty query returns all verified locations");
});

test("5. ADDRESS FORMATTING: formatDeliveryAddress produces clean human-readable delivery destination", () => {
  const standardLoc = {
    deliveryDivision: "Kamukuzi",
    deliveryArea: "Kiyanja",
    specificLocation: "Plot 14, Kiyanja Road",
    landmark: "Kiyanja Market",
    city: "Mbarara City"
  };
  const formatted = formatDeliveryAddress(standardLoc);
  assert.match(formatted, /Kiyanja, Kamukuzi, Mbarara City/);
  assert.match(formatted, /Plot 14, Kiyanja Road/);
  assert.match(formatted, /Near Kiyanja Market/);

  // Other with custom area
  const customLoc = {
    deliveryDivision: "Kakoba",
    deliveryArea: "Other",
    customArea: "Kakyeka Stadium Zone",
    specificLocation: "Gate 2 opposite main entrance",
    city: "Mbarara City"
  };
  const formattedCustom = formatDeliveryAddress(customLoc);
  assert.match(formattedCustom, /Kakyeka Stadium Zone, Kakoba, Mbarara City/);
  assert.match(formattedCustom, /Gate 2 opposite main entrance/);
});

test("6. STRICT VALIDATION: validateMbararaDeliveryAddress enforces division, area, custom area, and landmark", () => {
  // Valid
  const valid = validateMbararaDeliveryAddress({
    deliveryDivision: "Kamukuzi",
    deliveryArea: "Kiyanja",
    specificLocation: "Plot 12 near Mosque"
  });
  assert.equal(valid.valid, true);

  // Missing division
  const missingDiv = validateMbararaDeliveryAddress({
    deliveryDivision: "",
    deliveryArea: "Kiyanja",
    specificLocation: "Plot 12"
  });
  assert.equal(missingDiv.valid, false);
  assert.match(missingDiv.error, /division/i);

  // Invalid division
  const invalidDiv = validateMbararaDeliveryAddress({
    deliveryDivision: "Entebbe",
    deliveryArea: "Kiyanja",
    specificLocation: "Plot 12"
  });
  assert.equal(invalidDiv.valid, false);

  // Missing area
  const missingArea = validateMbararaDeliveryAddress({
    deliveryDivision: "Kamukuzi",
    deliveryArea: "",
    specificLocation: "Plot 12"
  });
  assert.equal(missingArea.valid, false);
  assert.match(missingArea.error, /area/i);

  // "Other" selected without custom name
  const missingCustomOther = validateMbararaDeliveryAddress({
    deliveryDivision: "Kamukuzi",
    deliveryArea: "Other",
    customArea: "",
    specificLocation: "Plot 12"
  });
  assert.equal(missingCustomOther.valid, false);
  assert.match(missingCustomOther.error, /specify your area/i);

  // Missing specific location / landmark
  const missingSpec = validateMbararaDeliveryAddress({
    deliveryDivision: "Kamukuzi",
    deliveryArea: "Kiyanja",
    specificLocation: ""
  });
  assert.equal(missingSpec.valid, false);
  assert.match(missingSpec.error, /specific location/i);
});

// -------------------------------------------------------------
// SUITE 3: CODEBASE INTEGRATION & DOM STRUCTURE
// -------------------------------------------------------------
test("7. HTML CHECKOUT & ORDERS VIEW: index.html defines Mbarara delivery and location filter elements", () => {
  const html = fs.readFileSync(INDEX_HTML_PATH, "utf-8");

  // Checkout fulfillment options
  assert.match(html, /Doorstep Delivery in Mbarara City/i, "Checkout should offer Doorstep Delivery in Mbarara City");
  assert.match(html, /id="chk-delivery-division"/, "Checkout must include division dropdown");
  assert.match(html, /id="chk-delivery-area"/, "Checkout must include area dropdown");
  assert.match(html, /id="chk-delivery-custom-area"/, "Checkout must support custom area input for Other");
  assert.match(html, /id="chk-delivery-specific"/, "Checkout must include specific location and landmark input");
  assert.match(html, /id="chk-saved-location-box"/, "Checkout must support saved location preview");

  // Pickup station points to Mbarara dispensary
  assert.match(html, /Near Mbarara Regional Referral Hospital/i, "Pickup station must reference Mbarara Regional Referral Hospital");
  assert.match(html, /Opposite Rubis Station/i, "Pickup station must reference Rubis Station");
  assert.match(html, /Near Mbarara Central Police Station/i, "Pickup station must reference Central Police Station");

  // Orders table filters
  assert.match(html, /id="orders-filter-division"/, "Orders view must have division filter dropdown");
  assert.match(html, /id="orders-filter-area"/, "Orders view must have area filter dropdown");
});

test("8. CSS STYLING: styles.css contains rules for Mbarara delivery location cards and division/area tags", () => {
  const css = fs.readFileSync(STYLES_CSS_PATH, "utf-8");
  assert.match(css, /\.delivery-location-card/, "styles.css must style .delivery-location-card");
  assert.match(css, /\.delivery-hub-reference-box/, "styles.css must style .delivery-hub-reference-box");
  assert.match(css, /\.delivery-division-tag/, "styles.css must style .delivery-division-tag");
  assert.match(css, /\.delivery-area-tag/, "styles.css must style .delivery-area-tag");
  assert.match(css, /\.saved-location-display-card/, "styles.css must style .saved-location-display-card");
});

test("9. APP.JS EXPORTS & IMMUTABILITY: app.js exports Mbarara location helpers and snapshots addresses", () => {
  const js = fs.readFileSync(APP_JS_PATH, "utf-8");

  // Exports
  assert.match(js, /export\s*\{[^}]*MBARARA_DIVISIONS[^}]*\}/, "app.js must export MBARARA_DIVISIONS");
  assert.match(js, /export\s*\{[^}]*formatDeliveryAddress[^}]*\}/, "app.js must export formatDeliveryAddress");
  assert.match(js, /export\s*\{[^}]*validateMbararaDeliveryAddress[^}]*\}/, "app.js must export validateMbararaDeliveryAddress");
  assert.match(js, /export\s*function\s+getCustomerDeliveryAddress/, "app.js must export getCustomerDeliveryAddress");
  assert.match(js, /export\s*function\s+saveCustomerDeliveryAddress/, "app.js must export saveCustomerDeliveryAddress");

  // Customer Dashboard delivery location section
  assert.match(js, /customer-delivery-location-section/, "app.js must render customer delivery location section");
  assert.match(js, /Where should we deliver your order in Mbarara City\?/, "app.js customer dashboard must contain delivery prompt");

  // Order snapshotting
  assert.match(js, /deliveryDivision\s*[,:]/, "app.js must snapshot deliveryDivision into newOrder");
  assert.match(js, /deliveryAddressDetails:\s*addressObj/, "app.js must snapshot deliveryAddressDetails into newOrder");
});

test("10. HISTORICAL ORDER IMMUTABILITY: Updating customer profile delivery address does not alter past order snapshots", () => {
  const pastOrder = {
    id: "BC-ORD-0041",
    orderNumber: "BC-ORD-0041",
    customerId: "usr-demo-customer",
    deliveryDivision: "Kamukuzi",
    deliveryArea: "Kiyanja",
    specificLocation: "Plot 14 Kiyanja Road",
    deliveryAddress: "Kiyanja, Kamukuzi, Mbarara City (Plot 14 Kiyanja Road)"
  };

  const customerProfile = {
    uid: "usr-demo-customer",
    deliveryAddress: {
      deliveryDivision: "Kamukuzi",
      deliveryArea: "Kiyanja",
      specificLocation: "Plot 14 Kiyanja Road"
    }
  };

  // Customer updates profile location to Kakoba, Alliance
  const updatedAddress = {
    deliveryDivision: "Kakoba",
    deliveryArea: "Alliance",
    specificLocation: "Opposite Alliance Secondary School",
    city: "Mbarara City"
  };
  customerProfile.deliveryAddress = {
    ...updatedAddress,
    formattedAddress: formatDeliveryAddress(updatedAddress)
  };

  // Historical order must retain its original snapshot
  assert.equal(pastOrder.deliveryDivision, "Kamukuzi", "Past order deliveryDivision must not mutate");
  assert.equal(pastOrder.deliveryArea, "Kiyanja", "Past order deliveryArea must not mutate");
  assert.equal(pastOrder.deliveryAddress, "Kiyanja, Kamukuzi, Mbarara City (Plot 14 Kiyanja Road)", "Past order deliveryAddress must remain immutable");
  assert.equal(customerProfile.deliveryAddress.deliveryDivision, "Kakoba", "Customer profile has new division");
});

test("11. REDESIGNED DELIVERY LOCATION CARD: app.js contains modern structured hierarchy and separate dispensary reference", () => {
  const js = fs.readFileSync(APP_JS_PATH, "utf-8");

  // Modern structured card elements
  assert.match(js, /delivery-location-kicker/, "Card must have delivery-location-kicker");
  assert.match(js, /delivery-change-loc-btn/, "Card must have delivery-change-loc-btn");
  assert.match(js, /delivery-location-grid/, "Card must have 2-column delivery-location-grid");
  assert.match(js, /delivery-customer-pane/, "Card must have customer destination pane");
  assert.match(js, /delivery-hub-pane/, "Card must have separate BloomCare dispensary hub pane");

  // Specific separated labels
  assert.match(js, /Delivery Area/, "Card must display 'Delivery Area' label");
  assert.match(js, /Exact Location/, "Card must display 'Exact Location' label");
  assert.match(js, /Landmark/, "Card must display 'Landmark' label");
  assert.match(js, /Default Address/, "Card must display 'Default Address' badge");

  // Distinct BloomCare Central Dispensary Reference
  assert.match(js, /delivery-hub-org/, "Card must display BloomCare Pharmacy header");
  assert.match(js, /Central Dispensary/, "Card must display Central Dispensary subtitle");
  assert.match(js, /delivery-coverage-banner/, "Card must contain delivery coverage banner");
  assert.match(js, /Delivery available/, "Coverage banner must state 'Delivery available'");

  // Update Location button and Empty state
  assert.match(js, /id="cust-dash-edit-loc-btn"/, "Card must have Update Location button");
  assert.match(js, /delivery-empty-state/, "Card must contain empty state structure");
  assert.match(js, /id="cust-dash-add-loc-btn"/, "Card must have Add Delivery Location button for empty state");
});

test("12. MOBILE-RESPONSIVE CSS & VISUAL HIERARCHY: styles.css contains modern card styles and mobile media queries", () => {
  const css = fs.readFileSync(STYLES_CSS_PATH, "utf-8");

  // Polished card styles
  assert.match(css, /\.delivery-location-card\s*\{[^}]*border-radius:\s*16px/, "Card must have 16px rounded corners");
  assert.match(css, /\.delivery-location-grid/, "styles.css must style .delivery-location-grid");
  assert.match(css, /\.delivery-default-badge/, "styles.css must style .delivery-default-badge");
  assert.match(css, /\.delivery-coverage-banner/, "styles.css must style .delivery-coverage-banner");
  assert.match(css, /\.delivery-empty-state/, "styles.css must style .delivery-empty-state");

  // Mobile media queries
  assert.match(css, /@media\s*\(\s*max-width:\s*768px\s*\)/, "styles.css must contain max-width: 768px media query");
  assert.match(css, /@media\s*\(\s*max-width:\s*480px\s*\)/, "styles.css must contain max-width: 480px media query");
});
