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
- `FIREBASE_SETUP.md` - Firebase Auth, Firestore, Hosting, schema, and deployment steps
- `firestore.rules` - Firestore ownership and role-based security rules
- `firestore.indexes.json` - Firestore query indexes

For production, replace `app.js` local storage operations with Firebase Auth,
Firestore, and authenticated backend or Cloud Functions calls. Follow
`FIREBASE_SETUP.md` before deploying. Payment verification must remain on the
trusted backend; the browser must never mark a payment as paid.
