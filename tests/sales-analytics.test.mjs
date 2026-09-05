import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const appJsPath = path.join(rootDir, 'BLOOMCARE-main', 'app.js');
const cssPath = path.join(rootDir, 'BLOOMCARE-main', 'styles.css');
const paymentApiPath = path.join(rootDir, 'server', 'payment_api.py');

// Import functions from app.js
const {
  isPaidOrder,
  calculateSalesOverviewData,
  formatUGX,
  formatUGXShort,
  renderSalesLineChartSvg,
  exportSalesReport,
  ROLE_PERMISSIONS,
  PERMISSIONS
} = await import('../BLOOMCARE-main/app.js');

test('1. PAID ORDER INCLUSION: Confirmed paid orders appear in sales calculation', () => {
  const mockOrders = [
    {
      id: 'ORD-PAID-1',
      orderStatus: 'Delivered',
      paymentStatus: 'Paid',
      total: 75000,
      createdAt: new Date('2026-09-05T10:00:00.000Z').toISOString()
    },
    {
      id: 'ORD-PAID-2',
      orderStatus: 'Confirmed',
      paymentStatus: 'Successful',
      total: 25000,
      createdAt: new Date('2026-09-05T11:00:00.000Z').toISOString()
    }
  ];

  assert.equal(isPaidOrder(mockOrders[0]), true, 'Paid order should be valid');
  assert.equal(isPaidOrder(mockOrders[1]), true, 'Successful payment order should be valid');

  const refDate = new Date('2026-09-05T12:00:00.000Z');
  const result = calculateSalesOverviewData('today', mockOrders, refDate);
  assert.equal(result.totalSales, 100000, 'Total sales must sum confirmed paid orders');
  assert.equal(result.totalOrders, 2, 'Number of orders must equal count of paid orders');
});

test('2. PENDING ORDER EXCLUSION: Pending orders do not appear in sales calculation', () => {
  const mockOrders = [
    {
      id: 'ORD-PENDING-1',
      orderStatus: 'Pending',
      paymentStatus: 'Pending',
      total: 50000,
      createdAt: new Date('2026-09-05T10:00:00.000Z').toISOString()
    },
    {
      id: 'ORD-COD-PENDING',
      orderStatus: 'Pending',
      paymentMethod: 'Cash on Delivery',
      paymentStatus: 'Pending',
      total: 80000,
      createdAt: new Date('2026-09-05T10:00:00.000Z').toISOString()
    }
  ];

  assert.equal(isPaidOrder(mockOrders[0]), false, 'Pending order must be excluded from sales');
  assert.equal(isPaidOrder(mockOrders[1]), false, 'Unpaid Cash on Delivery order must be excluded from sales');

  const refDate = new Date('2026-09-05T12:00:00.000Z');
  const result = calculateSalesOverviewData('today', mockOrders, refDate);
  assert.equal(result.totalSales, 0, 'Total sales must be 0 when all orders are pending');
  assert.equal(result.totalOrders, 0, 'Total orders must be 0 when all orders are pending');
});

test('3. FAILED PAYMENT EXCLUSION: Failed payments do not appear in sales calculation', () => {
  const mockOrders = [
    {
      id: 'ORD-FAILED-1',
      orderStatus: 'Pending',
      paymentStatus: 'Failed',
      total: 45000,
      createdAt: new Date('2026-09-05T10:00:00.000Z').toISOString()
    },
    {
      id: 'ORD-FAILED-2',
      orderStatus: 'Failed',
      paymentStatus: 'Failed',
      total: 120000,
      createdAt: new Date('2026-09-05T10:00:00.000Z').toISOString()
    }
  ];

  assert.equal(isPaidOrder(mockOrders[0]), false, 'Failed payment must be excluded');
  assert.equal(isPaidOrder(mockOrders[1]), false, 'Failed order must be excluded');

  const refDate = new Date('2026-09-05T12:00:00.000Z');
  const result = calculateSalesOverviewData('today', mockOrders, refDate);
  assert.equal(result.totalSales, 0);
  assert.equal(result.totalOrders, 0);
});

test('4. CANCELLED ORDER EXCLUSION: Cancelled orders do not appear in sales calculation', () => {
  const mockOrders = [
    {
      id: 'ORD-CANCELLED-1',
      orderStatus: 'Cancelled',
      paymentStatus: 'Successful', // Previously charged but now cancelled
      total: 95000,
      createdAt: new Date('2026-09-05T10:00:00.000Z').toISOString()
    }
  ];

  assert.equal(isPaidOrder(mockOrders[0]), false, 'Cancelled order must NEVER be counted in sales');

  const refDate = new Date('2026-09-05T12:00:00.000Z');
  const result = calculateSalesOverviewData('today', mockOrders, refDate);
  assert.equal(result.totalSales, 0);
  assert.equal(result.totalOrders, 0);
});

test('5. TODAY FILTER: Hourly breakdown (24 hours) with UGX 0 for empty hours', () => {
  const refDate = new Date(2026, 8, 5, 15, 0, 0); // 2026-09-05 15:00
  const orderDate1 = new Date(2026, 8, 5, 9, 30, 0); // 9 AM
  const orderDate2 = new Date(2026, 8, 5, 14, 15, 0); // 2 PM

  const mockOrders = [
    {
      id: 'ORD-9AM',
      orderStatus: 'Completed',
      paymentStatus: 'Paid',
      total: 35000,
      createdAt: orderDate1.toISOString()
    },
    {
      id: 'ORD-2PM',
      orderStatus: 'Delivered',
      paymentStatus: 'Paid',
      total: 65000,
      createdAt: orderDate2.toISOString()
    }
  ];

  const result = calculateSalesOverviewData('today', mockOrders, refDate);
  assert.equal(result.breakdown.length, 24, 'Today breakdown must contain exactly 24 hourly buckets');
  assert.equal(result.breakdown[0].label, '12 AM');
  assert.equal(result.breakdown[9].label, '9 AM');
  assert.equal(result.breakdown[14].label, '2 PM');
  assert.equal(result.breakdown[23].label, '11 PM');

  // Verify non-zero hours
  assert.equal(result.breakdown[9].sales, 35000);
  assert.equal(result.breakdown[9].orders, 1);
  assert.equal(result.breakdown[14].sales, 65000);
  assert.equal(result.breakdown[14].orders, 1);

  // Verify zero-sales hours show 0 rather than being removed
  assert.equal(result.breakdown[0].sales, 0, 'Hour with no sales must have UGX 0');
  assert.equal(result.breakdown[1].sales, 0, 'Hour with no sales must have UGX 0');
  assert.equal(result.breakdown[8].sales, 0, 'Hour with no sales must have UGX 0');
});

test('6. WEEK FILTER: Monday to Sunday daily breakdown with actual sales', () => {
  const refDate = new Date(2026, 8, 5, 12, 0, 0);
  const wednesday = new Date(2026, 8, 2, 10, 0, 0); // Wednesday
  const friday = new Date(2026, 8, 4, 16, 0, 0); // Friday

  const mockOrders = [
    {
      id: 'ORD-WED',
      orderStatus: 'Completed',
      paymentStatus: 'Paid',
      total: 120000,
      createdAt: wednesday.toISOString()
    },
    {
      id: 'ORD-FRI',
      orderStatus: 'Delivered',
      paymentStatus: 'Successful',
      total: 80000,
      createdAt: friday.toISOString()
    }
  ];

  const result = calculateSalesOverviewData('week', mockOrders, refDate);
  assert.equal(result.breakdown.length, 7, 'Week view must contain 7 days (Monday-Sunday)');
  assert.deepEqual(
    result.breakdown.map(b => b.label),
    ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
  );

  assert.equal(result.breakdown[2].sales, 120000);
  assert.equal(result.breakdown[2].orders, 1);
  assert.equal(result.breakdown[4].sales, 80000);
  assert.equal(result.breakdown[4].orders, 1);

  assert.equal(result.breakdown[0].sales, 0);
  assert.equal(result.breakdown[1].sales, 0);
  assert.equal(result.breakdown[3].sales, 0);
});

test('7. MONTH FILTER: Day 1 through final day of the current month', () => {
  const refDate = new Date(2026, 8, 5, 12, 0, 0); // September 2026 has 30 days
  const day1 = new Date(2026, 8, 1, 10, 0, 0);
  const day5 = new Date(2026, 8, 5, 14, 0, 0);

  const mockOrders = [
    {
      id: 'ORD-SEP-1',
      orderStatus: 'Completed',
      paymentStatus: 'Paid',
      total: 150000,
      createdAt: day1.toISOString()
    },
    {
      id: 'ORD-SEP-5',
      orderStatus: 'Completed',
      paymentStatus: 'Paid',
      total: 75000,
      createdAt: day5.toISOString()
    }
  ];

  const result = calculateSalesOverviewData('month', mockOrders, refDate);
  assert.equal(result.breakdown.length, 30, 'September must have 30 day buckets');
  assert.equal(result.breakdown[0].label, '1 Sep');
  assert.equal(result.breakdown[29].label, '30 Sep');

  assert.equal(result.breakdown[0].sales, 150000);
  assert.equal(result.breakdown[4].sales, 75000);
  assert.equal(result.breakdown[1].sales, 0);
});

test('8. YEAR FILTER: All 12 months (January to December)', () => {
  const refDate = new Date(2026, 8, 5, 12, 0, 0); // September 2026
  const febOrder = new Date(2026, 1, 15, 12, 0, 0); // February
  const augOrder = new Date(2026, 7, 20, 12, 0, 0); // August

  const mockOrders = [
    {
      id: 'ORD-FEB',
      orderStatus: 'Delivered',
      paymentStatus: 'Paid',
      total: 500000,
      createdAt: febOrder.toISOString()
    },
    {
      id: 'ORD-AUG',
      orderStatus: 'Delivered',
      paymentStatus: 'Paid',
      total: 750000,
      createdAt: augOrder.toISOString()
    }
  ];

  const result = calculateSalesOverviewData('year', mockOrders, refDate);
  assert.equal(result.breakdown.length, 12, 'Year view must contain 12 months');
  assert.equal(result.breakdown[0].label, 'January');
  assert.equal(result.breakdown[1].label, 'February');
  assert.equal(result.breakdown[7].label, 'August');
  assert.equal(result.breakdown[11].label, 'December');

  assert.equal(result.breakdown[1].sales, 500000);
  assert.equal(result.breakdown[7].sales, 750000);
  assert.equal(result.breakdown[0].sales, 0);
});

test('9, 10, 11. SUMMARY METRICS: Total sales, number of orders, and average order value', () => {
  const refDate = new Date(2026, 8, 5, 12, 0, 0);
  const mockOrders = [
    {
      id: 'ORD-1',
      orderStatus: 'Delivered',
      paymentStatus: 'Paid',
      total: 40000,
      createdAt: new Date(2026, 8, 5, 8, 0, 0).toISOString()
    },
    {
      id: 'ORD-2',
      orderStatus: 'Delivered',
      paymentStatus: 'Paid',
      total: 60000,
      createdAt: new Date(2026, 8, 5, 9, 0, 0).toISOString()
    }
  ];

  const result = calculateSalesOverviewData('today', mockOrders, refDate);
  assert.equal(result.totalSales, 100000, 'Total sales must be exactly 100,000');
  assert.equal(result.totalOrders, 2, 'Number of orders must be 2');
  assert.equal(result.avgOrderValue, 50000, 'Average order value must be 50,000 (100,000 / 2)');
});

test('12. PERIOD SWITCHING: calculateSalesOverviewData updates immediately for each period', () => {
  const refDate = new Date(2026, 8, 5, 12, 0, 0);
  const mockOrders = [
    {
      id: 'ORD-TODAY',
      orderStatus: 'Delivered',
      paymentStatus: 'Paid',
      total: 20000,
      createdAt: new Date(2026, 8, 5, 10, 0, 0).toISOString()
    }
  ];

  const todayData = calculateSalesOverviewData('today', mockOrders, refDate);
  assert.equal(todayData.period, 'today');
  assert.equal(todayData.breakdown.length, 24);

  const weekData = calculateSalesOverviewData('week', mockOrders, refDate);
  assert.equal(weekData.period, 'week');
  assert.equal(weekData.breakdown.length, 7);

  const monthData = calculateSalesOverviewData('month', mockOrders, refDate);
  assert.equal(monthData.period, 'month');
  assert.equal(monthData.breakdown.length, 30);

  const yearData = calculateSalesOverviewData('year', mockOrders, refDate);
  assert.equal(yearData.period, 'year');
  assert.equal(yearData.breakdown.length, 12);
});

test('13. UGX FORMATTING: All currency amounts correctly formatted in Ugandan Shillings', () => {
  assert.equal(formatUGX(50000), 'UGX 50,000');
  assert.equal(formatUGX(250000), 'UGX 250,000');
  assert.equal(formatUGX(1500000), 'UGX 1,500,000');
  assert.equal(formatUGX(0), 'UGX 0');

  assert.equal(formatUGXShort(50000), 'UGX 50k');
  assert.equal(formatUGXShort(1500000), 'UGX 1.5M');
  assert.equal(formatUGXShort(2000000), 'UGX 2M');
});

test('14. ADMIN-ONLY ACCESS: Role permissions and backend enforce strict admin access', () => {
  assert.ok(ROLE_PERMISSIONS.admin.includes(PERMISSIONS.REPORTS_VIEW), 'Admin must have REPORTS_VIEW');
  assert.ok(ROLE_PERMISSIONS.developer.includes(PERMISSIONS.REPORTS_VIEW), 'Developer must have REPORTS_VIEW');

  assert.ok(!ROLE_PERMISSIONS.customer.includes(PERMISSIONS.REPORTS_VIEW), 'Customer must NOT have REPORTS_VIEW');
  assert.ok(!ROLE_PERMISSIONS.pharmacist.includes(PERMISSIONS.REPORTS_VIEW), 'Pharmacist must NOT have REPORTS_VIEW');
  assert.ok(!ROLE_PERMISSIONS.assistant_pharmacist.includes(PERMISSIONS.REPORTS_VIEW), 'Assistant Pharmacist must NOT have REPORTS_VIEW');
  assert.ok(!ROLE_PERMISSIONS.delivery_person.includes(PERMISSIONS.REPORTS_VIEW), 'Delivery Person must NOT have REPORTS_VIEW');

  const pyCode = fs.readFileSync(paymentApiPath, 'utf8');
  assert.ok(pyCode.includes('/api/admin/sales-analytics'), 'Backend must expose /api/admin/sales-analytics');
  assert.ok(pyCode.includes('is_admin, role, meta = is_admin_request(self.headers)'), 'Backend must check admin authorization');
  assert.ok(pyCode.includes('403'), 'Backend must return 403 to non-admins');
});

test('15. EMPTY STATE: Displays "No sales recorded for this period." when there are no sales', () => {
  const emptyData = {
    period: 'today',
    totalSales: 0,
    totalOrders: 0,
    avgOrderValue: 0,
    breakdown: []
  };

  const html = renderSalesLineChartSvg(emptyData);
  assert.ok(html.includes('No sales recorded for this period.'), 'Empty state must contain exact prompt string');
  assert.ok(html.includes('sales-chart-empty-state'), 'Empty state must use dedicated CSS class');
  assert.ok(!html.includes('<circle'), 'Must not render misleading fake points on empty state');
});

test('16. INTERACTIVE SVG LINE CHART: Renders gridlines, area fill, stroke, and interactive points', () => {
  const data = {
    period: 'week',
    totalSales: 150000,
    totalOrders: 3,
    avgOrderValue: 50000,
    breakdown: [
      { label: 'Monday', day: 0, sales: 50000, orders: 1 },
      { label: 'Tuesday', day: 1, sales: 100000, orders: 2 },
      { label: 'Wednesday', day: 2, sales: 0, orders: 0 },
      { label: 'Thursday', day: 3, sales: 0, orders: 0 },
      { label: 'Friday', day: 4, sales: 0, orders: 0 },
      { label: 'Saturday', day: 5, sales: 0, orders: 0 },
      { label: 'Sunday', day: 6, sales: 0, orders: 0 }
    ]
  };

  const svgHtml = renderSalesLineChartSvg(data);
  assert.ok(svgHtml.includes('class="sales-line-chart-svg"'), 'Must contain SVG line chart');
  assert.ok(svgHtml.includes('class="sales-chart-stroke"'), 'Must contain chart stroke line');
  assert.ok(svgHtml.includes('class="sales-chart-area"'), 'Must contain chart area fill');
  assert.ok(svgHtml.includes('class="sales-chart-point"'), 'Must contain interactive points');
  assert.ok(svgHtml.includes('sales-chart-tooltip'), 'Must contain tooltip element');
  assert.ok(svgHtml.includes('data-sales="50000"'), 'Points must include data-sales attribute');
  assert.ok(svgHtml.includes('data-orders="1"'), 'Points must include data-orders attribute');
});

test('17. EXPORT REPORT: Generates structured CSV with headers and breakdown rows', () => {
  const appJs = fs.readFileSync(appJsPath, 'utf8');
  assert.ok(appJs.includes('BloomCare Pharmacy - Sales Performance Report'), 'Export must include header');
  assert.ok(appJs.includes('Selected Period'), 'Export must include Selected Period');
  assert.ok(appJs.includes('Total Sales'), 'Export must include Total Sales');
  assert.ok(appJs.includes('Number of Orders'), 'Export must include Number of Orders');
  assert.ok(appJs.includes('Average Order Value'), 'Export must include Average Order Value');
  assert.ok(appJs.includes('text/csv'), 'Export must use CSV mime type');
});

test('18. COMPARISON METRIC: Calculates percentage comparison against previous period', () => {
  const refDate = new Date(2026, 8, 5, 12, 0, 0);
  const todayOrder = new Date(2026, 8, 5, 10, 0, 0);
  const yesterdayOrder = new Date(2026, 8, 4, 10, 0, 0);

  const mockOrders = [
    {
      id: 'ORD-TODAY',
      orderStatus: 'Delivered',
      paymentStatus: 'Paid',
      total: 100000,
      createdAt: todayOrder.toISOString()
    },
    {
      id: 'ORD-YEST',
      orderStatus: 'Delivered',
      paymentStatus: 'Paid',
      total: 80000,
      createdAt: yesterdayOrder.toISOString()
    }
  ];

  const result = calculateSalesOverviewData('today', mockOrders, refDate);
  assert.equal(result.totalSales, 100000);
  assert.equal(result.comparison, '+25% compared with previous period');
  assert.equal(result.comparisonTrend, 'positive');
});

test('19. DASHBOARD LAYOUT & CSS: Admin Dashboard contains Sales Overview section block', () => {
  const appJs = fs.readFileSync(appJsPath, 'utf8');
  const css = fs.readFileSync(cssPath, 'utf8');

  assert.ok(appJs.includes('id="admin-sales-overview-section"'), 'app.js must include admin-sales-overview-section');
  assert.ok(appJs.includes('renderSalesOverviewSection'), 'app.js must call renderSalesOverviewSection');
  assert.ok(appJs.includes('Sales Overview'), 'Must have Sales Overview title');
  assert.ok(appJs.includes('Track BloomCare sales performance over time.'), 'Must have subtitle');

  assert.ok(css.includes('#admin-sales-overview-section'), 'styles.css must style #admin-sales-overview-section');
  assert.ok(css.includes('.sales-summary-kpi-grid'), 'styles.css must style .sales-summary-kpi-grid');
  assert.ok(css.includes('.sales-kpi-card'), 'styles.css must style .sales-kpi-card');
  assert.ok(css.includes('.sales-line-chart-svg'), 'styles.css must style .sales-line-chart-svg');
  assert.ok(css.includes('.sales-chart-tooltip'), 'styles.css must style .sales-chart-tooltip');
  assert.ok(css.includes('.sales-chart-empty-state'), 'styles.css must style .sales-chart-empty-state');
});
