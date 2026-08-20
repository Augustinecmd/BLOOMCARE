# Early Pregnancy Monitoring System

This folder contains the first implementation modules for an Early Pregnancy
Monitoring System: registration, sign-in, pregnancy profile onboarding, and a
patient dashboard. It is a front-end prototype and uses browser local storage
only; it is not suitable for storing real health records.

## Run it

Open `index.html` in a browser. No installation or web server is required.

## Files

- `index.html` - page structure and accessible forms
- `styles.css` - responsive visual design
- `app.js` - client-side navigation, validation, calculations, and demo state
- `SYSTEM_DESIGN.md` - proposed production architecture and implementation plan

For production, replace `app.js` local storage operations with authenticated
API calls and implement the backend controls in `SYSTEM_DESIGN.md`.
