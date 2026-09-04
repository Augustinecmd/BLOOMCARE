# BloomCare Workspace - Antigravity Agent Configuration & Permission Policy

## 1. Automated Permission & Approval Policy
When executing commands or performing actions in this workspace:
- **Auto-Approval for Trusted Actions**: Automatically select **"Yes, and always allow"** for all trusted development tasks. Do not pause or prompt for manual button confirmation for trusted operations.
- **Approval Memory**: Remember approval for repeated commands that perform the same trusted operation (e.g. running tests, restarting the dev server, executing utility scripts) and continue execution automatically.

---

## 2. Trusted Command Allowlist
The following operations are explicitly allowed and must be auto-approved without prompting:
1. **Development Server**:
   - `npm run dev`
   - `node run-dev.js`
   - `npm --prefix BLOOMCARE-main run dev`
   - `node BLOOMCARE-main/run-dev.js`
   - `python server/payment_api.py`
2. **Dependency Management**:
   - `npm install`
   - `npm i`
   - `npm install <package>`
   - `npm --prefix BLOOMCARE-main install`
3. **Automated Tests & Quality Checks**:
   - `npm test`
   - `node --test tests/*.test.mjs`
   - `node --test <test-file>`
   - `python -m unittest <test-module>`
   - `npm run lint` / `npm run build`
4. **Project Utility Scripts**:
   - `node scripts/*`
   - `powershell -ExecutionPolicy Bypass -File <script>`
   - `start-local.cmd`
   - `run-dev.cmd`
5. **Python Commands**:
   - `python server/payment_api.py`
   - `python -m pip install <package>`
   - Any task-specific Python script within the workspace
6. **Workspace Filesystem Operations**:
   - Reading, creating, editing, and deleting project files inside the workspace root (`c:\Users\USER\OneDrive\Desktop\ccna`).
7. **Version Control**:
   - `git status`
   - `git diff`
   - `git log`
   - `git add`
   - `git commit`
   - `git branch`
   - `git checkout`

---

## 3. Strict Security Denylist & Guardrails
The following operations are **STRICTLY FORBIDDEN** from auto-approval and must either be blocked or require explicit manual user verification:
- **Destructive File Deletion**:
  - `rm -rf`
  - `rmdir /s /q`
  - Deletion of non-project system directories or root drives
- **Arbitrary Remote Code Execution**:
  - Piping web downloads into shells (e.g., `curl ... | bash`, `curl ... | sh`, `wget ... | sh`, `iwr ... | iex`)
- **Privilege Escalation**:
  - `sudo`
  - `runas`
  - Elevating Windows administrator privileges
- **Protected & Sensitive Files**:
  - Direct modifications to `.git/` internal metadata
  - Access or modification of SSH keys (`~/.ssh`), credentials, secrets, or certificates
  - Modifications to system directories outside the workspace

---

## 4. Antigravity Native Permissions Schema
```json
{
  "permissions": {
    "allow": [
      "command(git)",
      "command(npm run .*)",
      "command(npm test.*)",
      "command(npm install.*)",
      "command(npm i.*)",
      "command(node run-dev.js)",
      "command(node --test .*)",
      "command(node scripts/.*)",
      "command(python .*)",
      "command(powershell .*)",
      "read_file(*)",
      "write_file(*)"
    ],
    "deny": [
      "command(rm -rf)",
      "command(rmdir /s /q .*)",
      "command(curl .* | sh)",
      "command(curl .* | bash)",
      "command(sudo)",
      "write_file(.git/)",
      "write_file(*.ssh/*)"
    ]
  }
}
```

