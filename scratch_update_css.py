with open('BLOOMCARE-main/styles.css', 'r', encoding='utf-8') as f:
    css = f.read()

# Replace sidebar-theme-toggle rules with empty or clean light mode styles
# Replace KPI trend pills, badges, secondary icons, and modern table with light palette
s_target = """.sidebar-theme-toggle {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 7px 10px;
  border-radius: 8px;
  background: var(--bg-card);
  border: 1px solid var(--line);
  color: var(--ink);
  cursor: pointer;
  font-size: 12px;
  font-weight: 600;
  transition: all 0.15s ease;
}
.sidebar-theme-toggle:hover {
  background: var(--bg-card-hover);
  border-color: var(--primary);
}
.sidebar-theme-pill {
  font-size: 10.5px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 999px;
  background: var(--primary-light);
  color: var(--primary);
}"""

if s_target in css:
    css = css.replace(s_target, "")
    print("Removed sidebar-theme-toggle CSS")

# Update KPI icons and trends for high contrast light mode
old_kpi_block = """.admin-kpi-icon-wrap.kpi-sales { background: rgba(16, 185, 129, 0.15); color: #10B981; }
.admin-kpi-icon-wrap.kpi-orders { background: rgba(59, 130, 246, 0.15); color: #3B82F6; }
.admin-kpi-icon-wrap.kpi-pending { background: rgba(245, 158, 11, 0.15); color: #F59E0B; }
.admin-kpi-icon-wrap.kpi-customers { background: rgba(139, 92, 246, 0.15); color: #8B5CF6; }
.admin-kpi-icon-wrap.kpi-lowstock { background: rgba(239, 68, 68, 0.15); color: #EF4444; }

.admin-kpi-trend-pill {
  font-size: 11px;
  font-weight: 700;
  padding: 2px 7px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  gap: 3px;
}
.admin-kpi-trend-pill.positive { background: rgba(16, 185, 129, 0.18); color: #34D399; }
.admin-kpi-trend-pill.warning { background: rgba(245, 158, 11, 0.18); color: #FBBF24; }
.admin-kpi-trend-pill.alert { background: rgba(239, 68, 68, 0.18); color: #F87171; }
.admin-kpi-trend-pill.neutral { background: rgba(148, 163, 184, 0.18); color: #94A3B8; }"""

new_kpi_block = """.admin-kpi-icon-wrap.kpi-sales { background: #ECFDF5; color: #059669; }
.admin-kpi-icon-wrap.kpi-orders { background: #EFF6FF; color: #2563EB; }
.admin-kpi-icon-wrap.kpi-pending { background: #FEF3C7; color: #D97706; }
.admin-kpi-icon-wrap.kpi-customers { background: #F3E8FF; color: #7C3AED; }
.admin-kpi-icon-wrap.kpi-lowstock { background: #FEE2E2; color: #DC2626; }

.admin-kpi-trend-pill {
  font-size: 11px;
  font-weight: 700;
  padding: 2px 7px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  gap: 3px;
}
.admin-kpi-trend-pill.positive { background: #ECFDF5; color: #047857; }
.admin-kpi-trend-pill.warning { background: #FEF3C7; color: #B45309; }
.admin-kpi-trend-pill.alert { background: #FEE2E2; color: #B91C1C; }
.admin-kpi-trend-pill.neutral { background: #F1F5F9; color: #475569; }"""

if old_kpi_block in css:
    css = css.replace(old_kpi_block, new_kpi_block)
    print("Updated KPI block")

# Update AI Showcase card in light mode
old_ai_block = """.admin-ai-showcase-card {
  background: linear-gradient(155deg, var(--bg-card) 0%, rgba(139, 92, 246, 0.12) 100%);
  border: 1px solid rgba(139, 92, 246, 0.35);
  border-radius: 14px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  position: relative;
  overflow: hidden;
}
.admin-ai-showcase-card::before {
  content: "";
  position: absolute;
  top: -30px;
  right: -30px;
  width: 90px;
  height: 90px;
  background: radial-gradient(circle, rgba(139, 92, 246, 0.25) 0%, transparent 70%);
  border-radius: 50%;
}
.admin-ai-top-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}
.admin-ai-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: rgba(139, 92, 246, 0.2);
  border: 1px solid rgba(139, 92, 246, 0.4);
  color: #c4b5fd;
  font-size: 11px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 999px;
}"""

new_ai_block = """.admin-ai-showcase-card {
  background: #FFFFFF;
  border: 1px solid #DDD6FE;
  box-shadow: 0 4px 16px rgba(139, 92, 246, 0.08);
  border-radius: 14px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  position: relative;
  overflow: hidden;
}
.admin-ai-showcase-card::before {
  content: "";
  position: absolute;
  top: -30px;
  right: -30px;
  width: 90px;
  height: 90px;
  background: radial-gradient(circle, rgba(139, 92, 246, 0.15) 0%, transparent 70%);
  border-radius: 50%;
}
.admin-ai-top-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}
.admin-ai-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: #F3E8FF;
  border: 1px solid #DDD6FE;
  color: #6D28D9;
  font-size: 11px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 999px;
}"""

if old_ai_block in css:
    css = css.replace(old_ai_block, new_ai_block)
    print("Updated AI block")

# Update Status pills in tables
old_status_block = """.status-pill-badge.status-pending { background: rgba(245, 158, 11, 0.18); color: #FBBF24; }
.status-pill-badge.status-processing { background: rgba(59, 130, 246, 0.18); color: #60A5FA; }
.status-pill-badge.status-out_for_delivery { background: rgba(139, 92, 246, 0.18); color: #C084FC; }
.status-pill-badge.status-delivered,
.status-pill-badge.status-completed { background: rgba(16, 185, 129, 0.18); color: #34D399; }
.status-pill-badge.status-cancelled { background: rgba(239, 68, 68, 0.18); color: #F87171; }"""

new_status_block = """.status-pill-badge.status-pending { background: #FEF3C7; color: #B45309; }
.status-pill-badge.status-processing { background: #EFF6FF; color: #1D4ED8; }
.status-pill-badge.status-out_for_delivery { background: #F3E8FF; color: #7E22CE; }
.status-pill-badge.status-delivered,
.status-pill-badge.status-completed { background: #ECFDF5; color: #047857; }
.status-pill-badge.status-cancelled { background: #FEE2E2; color: #B91C1C; }"""

if old_status_block in css:
    css = css.replace(old_status_block, new_status_block)
    print("Updated Status pills")

# Update secondary kpi icon and lowstock tag
old_sec_icon = """.secondary-kpi-icon {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  display: grid;
  place-items: center;
  font-size: 17px;
  background: rgba(255, 255, 255, 0.05);
  color: var(--ink);
}"""

new_sec_icon = """.secondary-kpi-icon {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  display: grid;
  place-items: center;
  font-size: 17px;
  background: #F1F5F9;
  color: var(--ink);
}"""

if old_sec_icon in css:
    css = css.replace(old_sec_icon, new_sec_icon)
    print("Updated secondary-kpi-icon")

old_lowstock = """.lowstock-tag {
  font-size: 9.5px;
  font-weight: 800;
  letter-spacing: 0.5px;
  padding: 1px 6px;
  border-radius: 4px;
  background: rgba(239, 68, 68, 0.18);
  color: #EF4444;
}"""

new_lowstock = """.lowstock-tag {
  font-size: 9.5px;
  font-weight: 800;
  letter-spacing: 0.5px;
  padding: 1px 6px;
  border-radius: 4px;
  background: #FEE2E2;
  color: #B91C1C;
}"""

if old_lowstock in css:
    css = css.replace(old_lowstock, new_lowstock)
    print("Updated lowstock-tag")

# Write out updated styles.css
with open('BLOOMCARE-main/styles.css', 'w', encoding='utf-8') as f:
    f.write(css)

with open('styles.css', 'w', encoding='utf-8') as f:
    f.write(css)

print("Updated BLOOMCARE-main/styles.css and styles.css!")
