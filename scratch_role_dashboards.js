function renderRoleDashboard() {
  const container = $("#role-dashboard-container");
  if (!container) return;

  renderBloomCareDashboardHero();

  const role = getEffectiveRole();
  const todayStr = new Date().toISOString().slice(0, 10);
  const todaySales = STATE.orders.filter(o => o.orderStatus !== "Cancelled" && o.createdAt.slice(0, 10) === todayStr).reduce((sum, o) => sum + (o.total || 0), 0);
  const totalRev = STATE.orders.filter(o => o.orderStatus !== "Cancelled").reduce((sum, o) => sum + (o.total || 0), 0);
  const lowStockCount = STATE.products.filter(p => p.stockQuantity <= p.reorderLevel).length;
  const pendingRxCount = STATE.prescriptions.filter(p => p.status === "Pending" || p.status === "Pending Review" || p.status === "Under Review").length;
  const pendingRefillsCount = STATE.refills.filter(r => r.status === "Pending" || r.status === "Under Review").length;

  if (role === "developer") {
    // 0. DEVELOPER DASHBOARD
    container.innerHTML = `
      <div class="page-header-block flex-between">
        <div>
          <h1 class="page-title">Developer Workspace &amp; RBAC Simulation Console</h1>
          <p class="page-desc">Real-time architecture status, role preview simulation, audit traces, and system diagnostics.</p>
        </div>
        <div style="display:flex; gap:10px;">
          <button class="btn btn-primary btn-sm" id="dev-btn-walkin-sale" type="button">+ New Walk-in Sale</button>
          <button class="btn btn-outline btn-sm" id="dev-btn-manage-users" type="button" data-route="admin/users">Manage Staff Accounts</button>
        </div>
      </div>

      <!-- ROLE PREVIEW / TESTING MODE SUITE -->
      <div class="content-card" style="border-left: 4px solid #f59e0b; margin-bottom: 24px;">
        <div class="flex-between">
          <div>
            <h3 style="display:flex; align-items:center; gap:8px;">
              <span class="dev-mode-pill">DEVELOPER TESTING MODE</span>
              <span>View Dashboard As (Role Simulation)</span>
            </h3>
            <p class="muted" style="margin:4px 0 0; font-size:13px;">
              Select any role below to test their complete dashboard, permissions, and sidebar navigation without changing your database credentials.
            </p>
          </div>
        </div>

        <div class="dev-sim-grid">
          <div class="dev-sim-card">
            <div>
              <div class="dev-sim-role-title">Administrator</div>
              <div class="dev-sim-role-desc">Financial analytics, staff management, inventory control, and system configuration.</div>
            </div>
            <button class="btn btn-primary btn-sm dev-sim-trigger-btn" data-preview-role="admin" type="button">Preview as Admin</button>
          </div>

          <div class="dev-sim-card">
            <div>
              <div class="dev-sim-role-title">Pharmacist</div>
              <div class="dev-sim-role-desc">Clinical prescription verification queue, consultations schedule, and refill approvals.</div>
            </div>
            <button class="btn btn-primary btn-sm dev-sim-trigger-btn" data-preview-role="pharmacist" type="button">Preview as Pharmacist</button>
          </div>

          <div class="dev-sim-card">
            <div>
              <div class="dev-sim-role-title">Assistant Pharmacist</div>
              <div class="dev-sim-role-desc">Order packing, stock control, customer assist, and OTC inventory fulfillment.</div>
            </div>
            <button class="btn btn-primary btn-sm dev-sim-trigger-btn" data-preview-role="assistant_pharmacist" type="button">Preview as Asst. Pharmacist</button>
          </div>

          <div class="dev-sim-card">
            <div>
              <div class="dev-sim-role-title">Delivery Person</div>
              <div class="dev-sim-role-desc">Doorstep dispatch runs, customer locations, and delivery status updates.</div>
            </div>
            <button class="btn btn-primary btn-sm dev-sim-trigger-btn" data-preview-role="delivery_person" type="button">Preview as Delivery</button>
          </div>

          <div class="dev-sim-card">
            <div>
              <div class="dev-sim-role-title">Customer</div>
              <div class="dev-sim-role-desc">Retail medicine catalog, cart checkout, order tracking, and customer profile.</div>
            </div>
            <button class="btn btn-primary btn-sm dev-sim-trigger-btn" data-preview-role="customer" type="button">Preview as Customer</button>
          </div>
        </div>
      </div>

      <!-- ENVIRONMENT & ARCHITECTURE HEALTH STATUS -->
      <div class="kpi-grid-4">
        <div class="kpi-card">
          <div>
            <span class="kpi-label"><span class="env-health-indicator"></span>Frontend Engine</span>
            <strong class="kpi-value" style="font-size:18px;">Vite 5 (ESM)</strong>
            <small class="muted">Live at :8080</small>
          </div>
        </div>
        <div class="kpi-card">
          <div>
            <span class="kpi-label"><span class="env-health-indicator"></span>Cloud Database</span>
            <strong class="kpi-value" style="font-size:18px;">Firestore (v2)</strong>
            <small class="muted">Active &amp; Rules Enforced</small>
          </div>
        </div>
        <div class="kpi-card">
          <div>
            <span class="kpi-label"><span class="env-health-indicator"></span>Auth Provider</span>
            <strong class="kpi-value" style="font-size:18px;">Firebase RBAC</strong>
            <small class="muted">Profile Role Verification</small>
          </div>
        </div>
        <div class="kpi-card">
          <div>
            <span class="kpi-label"><span class="env-health-indicator"></span>Payment Gateway</span>
            <strong class="kpi-value" style="font-size:18px;">Python API</strong>
            <small class="muted">Live at :8787/health</small>
          </div>
        </div>
      </div>

      <!-- LIVE SYSTEM DATA METRICS -->
      <div class="kpi-grid-4" style="margin-top:16px;">
        <div class="kpi-card" data-route="admin/users"><div class="kpi-icon-wrap">${ICONS.users}</div><div><strong class="kpi-value">${STATE.users.length}</strong><span class="kpi-label">Registered Users</span></div></div>
        <div class="kpi-card" data-route="admin/medicines"><div class="kpi-icon-wrap">${ICONS.medicines}</div><div><strong class="kpi-value">${STATE.products.length}</strong><span class="kpi-label">Catalog Products</span></div></div>
        <div class="kpi-card" data-route="admin/orders"><div class="kpi-icon-wrap">${ICONS.orders}</div><div><strong class="kpi-value">${STATE.orders.length}</strong><span class="kpi-label">System Orders</span></div></div>
        <div class="kpi-card"><div class="kpi-icon-wrap">${ICONS.dashboard}</div><div><strong class="kpi-value">${STATE.auditLogs.length}</strong><span class="kpi-label">Security Audit Events</span></div></div>
      </div>

      <!-- REAL-TIME AUDIT LOGS TRACE -->
      <div class="content-card" style="margin-top:20px;">
        <div class="flex-between">
          <h3>System Audit Trail &amp; Role Trace Logs</h3>
          <span class="muted" style="font-size:12px;">Real-time security logs</span>
        </div>
        <div class="table-responsive">
          <table class="standard-table">
            <thead><tr><th>Timestamp</th><th>Action</th><th>Target</th><th>Performed By</th><th>Details</th></tr></thead>
            <tbody>
              ${STATE.auditLogs.slice(-6).reverse().map(l => `
                <tr>
                  <td><small>${new Date(l.timestamp).toLocaleTimeString()}</small></td>
                  <td><span class="status-pill status-confirmed">${escapeHtml(l.action)}</span></td>
                  <td><code>${escapeHtml(l.recordType)}/${escapeHtml(l.recordId)}</code></td>
                  <td><strong>${escapeHtml(l.performedBy)}</strong></td>
                  <td>${escapeHtml(l.details)}</td>
                </tr>
              `).join("") || `<tr><td colspan="5" class="text-center muted">No audit logs recorded yet in this session.</td></tr>`}
            </tbody>
          </table>
      <!-- ROLE PERMISSIONS & WORKFLOW LOGIC MATRIX -->
      <div class="content-card" style="margin-top:20px;">
        <div class="flex-between">
          <div>
            <h3>Role Authorization Hierarchy &amp; Permission Matrix</h3>
            <p class="muted" style="font-size:12.5px;">Comprehensive capability mapping and security clearance levels across all 6 roles.</p>
          </div>
          <span class="status-pill status-confirmed">RBAC Engine Active</span>
        </div>
        <div class="table-responsive" style="margin-top:10px;">
          <table class="standard-table">
            <thead>
              <tr>
                <th>Role</th>
                <th>Clearance Level</th>
                <th>Clinical Verification</th>
                <th>Fulfillment &amp; Packing</th>
                <th>Doorstep Dispatch</th>
                <th>User Management</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Developer</strong></td>
                <td><span class="status-pill status-confirmed">Level 100 (Root)</span></td>
                <td><span class="status-pill status-completed">Full Access</span></td>
                <td><span class="status-pill status-completed">Full Access</span></td>
                <td><span class="status-pill status-completed">Full Access</span></td>
                <td><span class="status-pill status-completed">All Roles + Dev</span></td>
              </tr>
              <tr>
                <td><strong>Administrator</strong></td>
                <td><span class="status-pill status-confirmed">Level 80 (Executive)</span></td>
                <td><span class="status-pill status-completed">Approved</span></td>
                <td><span class="status-pill status-completed">Approved</span></td>
                <td><span class="status-pill status-completed">Approved</span></td>
                <td><span class="status-pill status-confirmed">Staff Roles &lt; 80</span></td>
              </tr>
              <tr>
                <td><strong>Pharmacist</strong></td>
                <td><span class="status-pill status-confirmed">Level 60 (Clinical)</span></td>
                <td><span class="status-pill status-completed">Clinical Lead</span></td>
                <td><span class="status-pill status-completed">Supervised</span></td>
                <td><span class="status-pill status-cancelled">Blocked</span></td>
                <td><span class="status-pill status-cancelled">No Access</span></td>
              </tr>
              <tr>
                <td><strong>Assistant Pharmacist</strong></td>
                <td><span class="status-pill status-pending">Level 40 (Operational)</span></td>
                <td><span class="status-pill status-cancelled">Blocked (Clinical Gate)</span></td>
                <td><span class="status-pill status-completed">Order Packing &amp; Stock</span></td>
                <td><span class="status-pill status-cancelled">Blocked</span></td>
                <td><span class="status-pill status-cancelled">No Access</span></td>
              </tr>
              <tr>
                <td><strong>Delivery Person</strong></td>
                <td><span class="status-pill status-pending">Level 20 (Logistics)</span></td>
                <td><span class="status-pill status-cancelled">No Access</span></td>
                <td><span class="status-pill status-cancelled">No Access</span></td>
                <td><span class="status-pill status-completed">Dispatch &amp; Doorstep</span></td>
                <td><span class="status-pill status-cancelled">No Access</span></td>
              </tr>
              <tr>
                <td><strong>Customer</strong></td>
                <td><span class="status-pill status-pending">Level 10 (Client)</span></td>
                <td><span class="status-pill status-confirmed">Upload Rx Scan Only</span></td>
                <td><span class="status-pill status-cancelled">No Access</span></td>
                <td><span class="status-pill status-cancelled">No Access</span></td>
                <td><span class="status-pill status-cancelled">Self Profile Only</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    `;

    container.querySelectorAll(".dev-sim-trigger-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        enterDeveloperPreview(btn.dataset.previewRole);
      });
    });
    $("#dev-btn-walkin-sale")?.addEventListener("click", () => openWalkinSaleModal());

  } else if (role === "admin") {
    // 1. REDESIGNED MODERN ADMINISTRATOR DASHBOARD
    const totalUsersCount = STATE.users.length;
    const customerCount = STATE.users.filter(u => u.role === "customer").length;
    const staffCount = STATE.users.filter(u => u.role !== "customer").length;

    const totalProductsCount = STATE.products.length;
    const activeProductsCount = STATE.products.filter(p => p.stockQuantity > 0).length;
    const lowStockCount = STATE.products.filter(p => p.stockQuantity <= (p.reorderLevel || 10)).length;

    const totalOrdersCount = STATE.orders.length;
    const completedOrdersCount = STATE.orders.filter(o => ["Completed", "Delivered"].includes(o.orderStatus)).length;
    const pendingOrdersCount = STATE.orders.filter(o => !["Completed", "Delivered", "Cancelled"].includes(o.orderStatus)).length;

    const totalConsultationsCount = STATE.consultations.length;
    const pendingConsultationsCount = STATE.consultations.filter(c => ["Pending", "Scheduled"].includes(c.status || "Pending")).length;

    // Time-aware greeting
    const currentHour = new Date().getHours();
    let greetingPrefix = "Good morning";
    if (currentHour >= 12 && currentHour < 17) {
      greetingPrefix = "Good afternoon";
    } else if (currentHour >= 17 || currentHour < 5) {
      greetingPrefix = "Good evening";
    }
    const adminDisplayName = STATE.currentUser?.displayName || "Dr. Admin Mugisha";

    const todayDateFormatted = new Date().toLocaleDateString("en-UG", {
      weekday: "long",
      day: "numeric",
      month: "short",
      year: "numeric"
    });

    // Compile Recent Operational Activity (chronological 4-5 items from real state)
    const activityList = [];

    (STATE.orders || []).forEach(o => {
      activityList.push({
        title: `Order #${o.orderNumber || o.id} placed by ${o.customerName || "Customer"}`,
        meta: `${formatUGX(o.total)} • Doorstep Delivery`,
        timestamp: o.createdAt ? new Date(o.createdAt).getTime() : Date.now(),
        dateLabel: o.createdAt ? new Date(o.createdAt).toLocaleDateString() : "Today",
        status: o.orderStatus || "Pending",
        statusClass: `status-${(o.orderStatus || "pending").toLowerCase().replace(/\s+/g, "_")}`,
        icon: ICONS.orders,
        iconBoxClass: "icon-type-order",
        route: "admin/orders"
      });
    });

    (STATE.consultations || []).forEach(c => {
      activityList.push({
        title: `Consultation: ${c.patientPhone || c.userName || "Patient"} with Dr. ${c.pharmacistName || "Sarah Nakato"}`,
        meta: `Fee: UGX 15,000 • ${c.timeSlot || "Scheduled Session"}`,
        timestamp: c.createdAt ? new Date(c.createdAt).getTime() : (Date.now() - 3600000),
        dateLabel: c.date || (c.createdAt ? new Date(c.createdAt).toLocaleDateString() : "Today"),
        status: c.status || "Pending",
        statusClass: `status-${(c.status || "pending").toLowerCase().replace(/\s+/g, "_")}`,
        icon: ICONS.consultations,
        iconBoxClass: "icon-type-consultation",
        route: "admin/consultations"
      });
    });

    (STATE.users || []).slice(-8).forEach(u => {
      activityList.push({
        title: `New user: ${u.name || u.displayName || "Client Account"}`,
        meta: `${u.email} • Role: ${formatRoleName(u.role)}`,
        timestamp: u.createdAt ? new Date(u.createdAt).getTime() : (Date.now() - 7200000),
        dateLabel: u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "Recent",
        status: u.status || "active",
        statusClass: `status-${(u.status || "active").toLowerCase()}`,
        icon: ICONS.users,
        iconBoxClass: "icon-type-user",
        route: "admin/users"
      });
    });

    (STATE.products || []).filter(p => p.stockQuantity <= (p.reorderLevel || 10)).slice(0, 3).forEach(p => {
      activityList.push({
        title: `Low stock alert: ${p.name}`,
        meta: `Only ${p.stockQuantity} units left in dispensary (reorder: ${p.reorderLevel || 10})`,
        timestamp: Date.now() - 1800000,
        dateLabel: "Needs Action",
        status: "Low Stock",
        statusClass: "status-warning",
        icon: ICONS.inventory,
        iconBoxClass: "icon-type-stock",
        route: "admin/medicines"
      });
    });

    // Sort chronologically and display top 4-5
    activityList.sort((a, b) => b.timestamp - a.timestamp);
    const topActivities = activityList.slice(0, 5);

    container.innerHTML = `
      <!-- Time-Aware Dashboard Header -->
      <div class="admin-dash-welcome flex-between">
        <div>
          <h1 class="admin-dash-greeting">${greetingPrefix}, ${escapeHtml(adminDisplayName)}</h1>
          <p class="admin-dash-sub">Here's what's happening at BloomCare today.</p>
        </div>
        <div style="display:flex; align-items:center; gap:10px;">
          <button class="btn btn-primary btn-sm" id="admin-btn-walkin-sale" type="button" style="display:inline-flex; align-items:center; gap:6px;">
            <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            <span>+ New Walk-in Sale</span>
          </button>
          <div class="admin-dash-date-badge">
            <svg class="admin-cal-svg" viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            <span>${todayDateFormatted}</span>
          </div>
        </div>
      </div>

      <!-- Core Operational KPI Summary Cards (Exactly 4 Cards) -->
      <div class="admin-summary-grid">
        <div class="admin-summary-card" data-route="admin/users" role="button" tabindex="0">
          <div class="admin-summary-card-top">
            <span class="admin-card-icon-wrap icon-wrap-users">${ICONS.users}</span>
            <span class="admin-card-trend-badge">${customerCount} Customers</span>
          </div>
          <div class="admin-summary-body">
            <strong class="admin-summary-number">${totalUsersCount}</strong>
            <span class="admin-summary-title">Total Users</span>
            <span class="admin-summary-secondary">${customerCount} customers &bull; ${staffCount} staff</span>
          </div>
        </div>

        <div class="admin-summary-card" data-route="admin/medicines" role="button" tabindex="0">
          <div class="admin-summary-card-top">
            <span class="admin-card-icon-wrap icon-wrap-medicines">${ICONS.medicines}</span>
            <span class="admin-card-trend-badge">${activeProductsCount} Active</span>
          </div>
          <div class="admin-summary-body">
            <strong class="admin-summary-number">${totalProductsCount}</strong>
            <span class="admin-summary-title">Medicines</span>
            <span class="admin-summary-secondary">${activeProductsCount} in stock &bull; ${lowStockCount} low stock</span>
          </div>
        </div>

        <div class="admin-summary-card" data-route="admin/orders" role="button" tabindex="0">
          <div class="admin-summary-card-top">
            <span class="admin-card-