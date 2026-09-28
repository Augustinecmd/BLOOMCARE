with open('BLOOMCARE-main/styles.css', 'r', encoding='utf-8') as f:
    css = f.read()

import re
# Find all CSS rules relating to dashboard, cards, kpis, stats, tables, headers
rules = re.findall(r'(\.[a-zA-Z0-9_\-\s,\.:>]+)\{([^}]+)\}', css)
print(f"Total CSS rules: {len(rules)}")

dark_bg_rules = []
for selector, body in rules:
    if any(k in body.lower() for k in ['background: #0', 'background: #1', 'background: #2', 'background: #3', 'background:#0', 'background:#1', 'background:#2', 'background:#3', 'background: rgb(1', 'background: rgb(2', 'background: rgb(3', 'background: rgb(0', 'background: rgba(1', 'background: rgba(2', 'background: rgba(3', 'background: rgba(0']):
        dark_bg_rules.append((selector.strip(), body.strip()))

print(f"Rules with dark backgrounds: {len(dark_bg_rules)}")
for s, b in dark_bg_rules:
    print(f"\nSelector: {s}\nBody: {b}")
