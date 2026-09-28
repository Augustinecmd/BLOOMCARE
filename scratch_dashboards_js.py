with open('BLOOMCARE-main/app.js', 'r', encoding='utf-8') as f:
    js = f.read()

import re
matches = re.findall(r'function (render\w*Dashboard\w*)\s*\(', js)
print("Dashboard render functions:", matches)

# Check all dashboard render functions for inline styles or classes
for fn in matches:
    idx = js.find(f"function {fn}")
    end_idx = js.find("\nfunction ", idx + 20)
    fn_code = js[idx:end_idx if end_idx != -1 else idx+2000]
    # Check for dark patterns
    dark_in_fn = [l for l in fn_code.splitlines() if any(k in l.lower() for k in ['#0f172a', '#1e293b', '#111827', '#182234', '#0d131f', 'theme-dark', 'dark-card', 'background: #1', 'background: #0'])]
    print(f"\n{fn}: {len(dark_in_fn)} dark occurrences")
    for d in dark_in_fn:
        print("  ", d.strip())
