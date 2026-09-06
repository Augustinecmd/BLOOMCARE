import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const appJsPath = path.join(rootDir, 'BLOOMCARE-main', 'app.js');
const indexHtmlPath = path.join(rootDir, 'BLOOMCARE-main', 'index.html');
const stylesCssPath = path.join(rootDir, 'BLOOMCARE-main', 'styles.css');

// Import functions dynamically
const appModule = await import(`file://${appJsPath.replace(/\\/g, '/')}`);
const {
  renderAdminWalkinSection,
  calculateSalesOverviewData,
  renderSalesLineChartSvg,
  formatUGXShort,
  isWalkinOrder,
  STATE
} = appModule;

test('1. ADMIN WALKIN SALES PANEL: Exports renderAdminWalkinSection and has required DOM structure', () => {
  assert.equal(typeof renderAdminWalkinSection, 'function', 'renderAdminWalkinSection must be exported as a function');

  const appJs = fs.readFileSync(appJsPath, 'utf8');
  assert.ok(appJs.includes('admin-walkin-overview-section'), 'Admin overview section ID must be present in app.js');
  assert.ok(appJs.includes('admin-walkin-panel'), 'Admin walkin panel container class must be present');
  assert.ok(appJs.includes('admin-walkin-hub-launch-btn'), 'Direct launch walk-in POS button must be present');
  assert.ok(appJs.includes('admin-walkin-hub-history-btn'), 'Counter sales history button must be present');
  assert.ok(appJs.includes('admin-walkin-hub-calc-btn'), 'Scratchpad calculator button must be present');
});

test('2. ADMIN WALKIN KPIS: Calculates and renders live counter metrics', () => {
  const appJs = fs.readFileSync(appJsPath, 'utf8');
  assert.ok(appJs.includes('Today\'s Counter Revenue'), 'Must display Today Counter Revenue label');
  assert.ok(appJs.includes('Completed Counter Sales'), 'Must display Completed Counter Sales count');
  assert.ok(appJs.includes('Cash vs Mobile Money'), 'Must display Cash vs MoMo distribution');
  assert.ok(appJs.includes('admin-walkin-row-receipt-btn'), 'Must include 1-click receipt viewer buttons for walk-in transactions');
});

test('3. DUAL-CHANNEL ANALYTICS DATA: calculateSalesOverviewData computes walkinSales and onlineSales per bucket', () => {
  const data = calculateSalesOverviewData('month', 'all');
  assert.ok(data, 'calculateSalesOverviewData must return an analytics object');
  assert.ok(Array.isArray(data.breakdown), 'Analytics data must contain a breakdown array');
  assert.ok(data.breakdown.length > 0, 'Breakdown must have data points');

  const firstPt = data.breakdown[0];
  assert.ok('walkinSales' in firstPt, 'Breakdown points must include walkinSales');
  assert.ok('walkinOrders' in firstPt, 'Breakdown points must include walkinOrders');
  assert.ok('onlineSales' in firstPt, 'Breakdown points must include onlineSales');
  assert.ok('onlineOrders' in firstPt, 'Breakdown points must include onlineOrders');
  assert.ok('totalSales' in firstPt, 'Breakdown points must include totalSales');

  // Verify total sums match
  assert.equal(typeof data.walkinSales, 'number', 'Summary walkinSales must be a number');
  assert.equal(typeof data.onlineSales, 'number', 'Summary onlineSales must be a number');
  assert.equal(data.totalSales, data.walkinSales + data.onlineSales, 'Total sales must equal walkin + online');
});

test('4. IMPROVED SALES GRAPH SVG: Renders dual-channel curves, legend, crosshair, and multi-channel tooltip', () => {
  const dummyData = {
    period: 'week',
    sourceFilter: 'all',
    totalSales: 250000,
    totalOrders: 4,
    onlineSales: 150000,
    onlineOrders: 2,
    walkinSales: 100000,
    walkinOrders: 2,
    breakdown: [
      { label: 'Mon', day: 0, sales: 120000, orders: 2, onlineSales: 70000, onlineOrders: 1, walkinSales: 50000, walkinOrders: 1, totalSales: 120000 },
      { label: 'Tue', day: 1, sales: 130000, orders: 2, onlineSales: 80000, onlineOrders: 1, walkinSales: 50000, walkinOrders: 1, totalSales: 130000 }
    ]
  };

  const svgHtml = renderSalesLineChartSvg(dummyData);

  // SVG and curve strokes
  assert.ok(svgHtml.includes('sales-line-chart-svg'), 'Must render SVG chart');
  assert.ok(svgHtml.includes('sales-chart-stroke-online'), 'Must render emerald curve for online store orders');
  assert.ok(svgHtml.includes('sales-chart-stroke-walkin'), 'Must render cyan curve for physical walk-in sales');
  assert.ok(svgHtml.includes('sales-chart-stroke'), 'Must maintain baseline sales-chart-stroke class');

  // Channel legend & peak badge
  assert.ok(svgHtml.includes('sales-chart-legend'), 'Must render multi-channel legend bar');
  assert.ok(svgHtml.includes('Online Store:'), 'Must show Online Store in legend');
  assert.ok(svgHtml.includes('Walk-in Counter:'), 'Must show Walk-in Counter in legend');
  assert.ok(svgHtml.includes('peak-badge'), 'Must include peak sales badge');

  // Interactive guide crosshair & comparison tooltip
  assert.ok(svgHtml.includes('sales-chart-crosshair'), 'Must render mouse-tracking crosshair guideline');
  assert.ok(svgHtml.includes('sales-chart-tooltip'), 'Must render floating tooltip');
  assert.ok(svgHtml.includes('tooltip-online-val'), 'Tooltip must detail online revenue');
  assert.ok(svgHtml.includes('tooltip-walkin-val'), 'Tooltip must detail walkin revenue');
  assert.ok(svgHtml.includes('tooltip-sales'), 'Tooltip must detail total sales');
});

test('5. ORDERS CHANNEL FILTER: index.html contains orders-filter-channel selector', () => {
  const html = fs.readFileSync(indexHtmlPath, 'utf8');
  assert.ok(html.includes('id="orders-filter-channel"'), 'Must define orders-filter-channel in index.html');
  assert.ok(html.includes('value="all"'), 'Channel filter must support all channels');
  assert.ok(html.includes('value="walk_in"'), 'Channel filter must support walk-in counter sales');
  assert.ok(html.includes('value="online"'), 'Channel filter must support online store orders');
});

test('6. CSS STYLING: styles.css contains rules for walkin overview panel and dual chart curves', () => {
  const css = fs.readFileSync(stylesCssPath, 'utf8');
  assert.ok(css.includes('.admin-walkin-panel'), 'CSS must define .admin-walkin-panel');
  assert.ok(css.includes('.admin-walkin-kpi-grid'), 'CSS must define .admin-walkin-kpi-grid');
  assert.ok(css.includes('.sales-chart-stroke-online'), 'CSS must style .sales-chart-stroke-online');
  assert.ok(css.includes('.sales-chart-stroke-walkin'), 'CSS must style .sales-chart-stroke-walkin');
  assert.ok(css.includes('.sales-chart-crosshair'), 'CSS must style .sales-chart-crosshair');
  assert.ok(css.includes('.sales-chart-legend'), 'CSS must style .sales-chart-legend');
});
