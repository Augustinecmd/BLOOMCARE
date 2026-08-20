# Firebase setup

This project is prepared for Firebase Hosting, Firebase Authentication, and Cloud Firestore.

## 1. Create the Firebase project

1. Open the Firebase console and create a project.
2. Enable **Authentication** and choose the sign-in providers you need.
3. Create a **Cloud Firestore** database in production mode.
4. Install the Firebase CLI: `npm install -g firebase-tools`.
5. Sign in: `firebase login`.
6. From this folder, connect the local files to your project: `firebase use --add`.

Do not commit service-account JSON files or API secrets.

## 2. Deploy the database rules and indexes

```powershell
firebase deploy --only firestore:rules,firestore:indexes
```

The deploy files are:

- `firestore.rules`: patient/provider/admin access controls.
- `firestore.indexes.json`: indexes for measurements, symptoms, appointments, and notifications.
- `firebase.json`: Firestore and Hosting configuration.

## 3. Collections

The BloomCare Firestore model uses:

- `users/{authUid}`: profile, role, consent metadata, and contact details.
- `pregnancies/{pregnancyId}`: LMP, estimated due date, pregnancy history, facility, and clinical summary.
- `pregnancies/{pregnancyId}/measurements`: weight, temperature, blood pressure, wellbeing, and notes.
- `pregnancies/{pregnancyId}/symptoms`: symptom type, severity, notes, and review status.
- `pregnancies/{pregnancyId}/medications`: medication instructions and reminder settings.
- `pregnancies/{pregnancyId}/appointments`: requested date, facility, reason, status, and payment ID.
- `pregnancies/{pregnancyId}/medicalNotes`: provider notes.
- `emergencyContacts/{contactId}`: patient emergency contacts.
- `facilities/{facilityId}`: approved healthcare facilities.
- `providers/{authUid}`: provider profile and facility.
- `providerPatientAssignments/{providerUid_patientUid}`: provider access grants.
- `educationContent/{contentId}`: reviewed week-by-week education.
- `notifications/{notificationId}`: patient and provider notifications.
- `payments/{paymentId}`: server-created payment state and receipt metadata.
- `auditLogs/{logId}`: server-created immutable audit entries.

Use Firebase Auth for passwords. Never store passwords in Firestore. Use Firestore `Timestamp` values for dates and integer `feeMinorUnits` plus `currency` for money.

## 4. Payment security

The browser must not write `payments`, set an appointment to `paid`, or generate a receipt. The existing payment API or a Firebase HTTPS Cloud Function should:

1. Create a pending payment with MTN MoMo or Airtel Money.
2. Store only sanitized payment metadata in Firestore.
3. Verify the provider transaction using server credentials.
4. Update the payment and appointment in a trusted transaction.
5. Create the receipt and audit log.

The current local-storage prototype remains suitable only for demonstration until Firebase Auth and a trusted backend are connected.
