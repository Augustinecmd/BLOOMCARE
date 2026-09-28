with open('BLOOMCARE-main/app.js', 'r', encoding='utf-8') as f:
    js = f.read()

import re

# Look for dark colors like #0f172a, #1e293b, #111827, #0d1527, #000, #1a1a1a, rgba(0,0,0, in styling across app.js
pattern = re.compile(r'style="[^"]*(?:background|bg)[^"]*"', re.IGNORECASE)
matches = pattern.findall(js)
print(f"Found {len(matches)} background styles in app.js")

dark_bgs = []
for m in set(matches):
    if any(k in m.lower() for k in ['#0', '#1', '#2', '#3', 'rgba(0', 'rgba(15,', 'rgba(30', 'rgb(0', 'rgb(15', 'rgb(30', 'black', 'dark']):
        dark_bgs.append(m)

print(f"Found {len(dark_bgs)} dark background inline styles:")
for d in dark_bgs[:40]:
    print("  ", d)
