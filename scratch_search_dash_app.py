with open('BLOOMCARE-main/app.js', 'r', encoding='utf-8') as f:
    js = f.read()

import re
matches = [l for l in js.splitlines() if 'render' in l and 'Dashboard' in l]
for m in matches:
    print(m)
