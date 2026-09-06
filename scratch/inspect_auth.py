with open('BLOOMCARE-main/app.js', 'r', encoding='utf-8') as f:
    text = f.read()

import re

keywords = ['register-form', 'login-form', 'staff-login-form', 'reg-password', 'login-password', 'signInWithEmailAndPassword', 'createUserWithEmailAndPassword', 'findUserProfile']
for kw in keywords:
    matches = [m.start() for m in re.finditer(re.escape(kw), text)]
    print(f"Keyword '{kw}': {len(matches)} occurrences")
    for pos in matches[:3]:
        line_no = text[:pos].count('\n') + 1
        print(f"   Line {line_no}: {text[pos:pos+80].replace(chr(10), ' ')}")

