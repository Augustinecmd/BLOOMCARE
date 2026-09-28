import re

with open('BLOOMCARE-main/styles.css', 'r', encoding='utf-8') as f:
    css = f.read()

# Search for any dark references or dark colors in dashboard sections
matches_dark = [line for line in css.splitlines() if any(k in line.lower() for k in ['theme-dark', 'dark-mode', 'darkmode', 'darktheme', '#0f172a', '#1e293b', '#111827', '#090d16', '#1a2234', 'rgba(15, 23, 42'])]
print(f"Found {len(matches_dark)} dark CSS lines:")
for m in matches_dark[:30]:
    print(" ", m)

with open('BLOOMCARE-main/index.html', 'r', encoding='utf-8') as f:
    html = f.read()
matches_html = [line for line in html.splitlines() if any(k in line.lower() for k in ['theme-dark', 'darkmode', 'darktheme', 'dark'])]
print(f"Found {len(matches_html)} HTML lines:")
for m in matches_html[:30]:
    print(" ", m)

with open('BLOOMCARE-main/app.js', 'r', encoding='utf-8') as f:
    js = f.read()
matches_js = [line for line in js.splitlines() if any(k in line.lower() for k in ['theme-dark', 'darkmode', 'darktheme', 'toggletheme', 'settheme'])]
print(f"Found {len(matches_js)} JS lines:")
for m in matches_js[:30]:
    print(" ", m)
