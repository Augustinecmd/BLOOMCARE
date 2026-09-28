with open('BLOOMCARE-main/styles.css', 'r', encoding='utf-8') as f:
    css = f.read()

import re

# Find sections mentioning dashboard or roles
lines = css.splitlines()
for i, l in enumerate(lines):
    if any(term in l.lower() for term in ['theme-dark', 'dark-theme', 'darkmode', 'theme-toggle', 'sidebar-theme']):
        print(f"Line {i+1}: {l}")
