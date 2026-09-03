# BloomCare

BloomCare is a Firebase-backed early-pregnancy care application with account
registration, sign-in, care-profile onboarding, check-ins, appointments, and
a local demo payment API.

## Run locally

From the repository root:

```text
npm run dev
```

Open `http://127.0.0.1:8080`. The payment API runs on port `8787`.

## Firebase configuration

The browser app and deployment configuration use Firebase project
`bloomcare-72986`.

Before testing sign-in or registration, confirm in Firebase Console that:

1. Email/Password is enabled in Authentication → Sign-in method.
2. `localhost` and the production Hosting domain are authorized domains.
3. A Firestore database has been created in production mode.

Run the local configuration check with:

```text
npm run verify:firebase
```

## Build and deploy

Build the web app, then deploy Hosting, Firestore rules, and indexes from the
repository root:

```text
npm run build
firebase login
firebase deploy --project bloomcare-72986
```

The canonical deployment files are in the repository root: `firebase.json`,
`.firebaserc`, `firestore.rules`, and `firestore.indexes.json`.

The local payment API is for demonstration only. Replace it with a secured,
server-side provider integration before processing real payments or health data.
