with open('BLOOMCARE-main/app.js', 'r', encoding='utf-8') as f:
    js = f.read()

import re

# Find sections where role dashboards are constructed
idx = js.find("function renderRoleDashboard")
idx_end = js.find("function renderDashboardView", idx)
if idx_end == -1:
    idx_end = idx + 20000

print("renderRoleDashboard length:", idx_end - idx)
# Write the role dashboard code to a scratch file to inspect
with open('scratch_role_dashboards.js', 'w', encoding='utf-8') as f:
    f.write(js[idx:idx_end])
