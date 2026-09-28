with open('BLOOMCARE-main/index.html', 'r', encoding='utf-8') as f:
    html = f.read()

import re
dashboard_views = re.findall(r'<section[^>]*id="view-[^"]*dashboard[^"]*"[^>]*>.*?</section>', html, re.DOTALL)
print(f"Found {len(dashboard_views)} dashboard sections in HTML:")
for dv in dashboard_views:
    id_match = re.search(r'id="([^"]+)"', dv)
    print("Dashboard ID:", id_match.group(1) if id_match else "unknown")
    # Check for inline dark styles or dark classes
    dark_inlines = [line for line in dv.splitlines() if any(k in line.lower() for k in ['background: #', 'background:#', 'bg-dark', 'theme-dark', 'dark'])]
    if dark_inlines:
        print("  Dark occurrences:", dark_inlines)
