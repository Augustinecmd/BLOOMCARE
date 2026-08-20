import fs from "node:fs/promises";
import { applicationDefault, initializeApp } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

const projectId = process.env.FIREBASE_PROJECT_ID || "bloomcare-ee449";
const seed = JSON.parse(await fs.readFile(new URL("../firestore-seed.json", import.meta.url), "utf8"));

initializeApp({
  credential: applicationDefault(),
  projectId
});

const db = getFirestore();

for (const [id, facility] of Object.entries(seed.facilities)) {
  await db.collection("facilities").doc(id).set({
    ...facility,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp()
  }, { merge: true });
}

for (const [id, content] of Object.entries(seed.educationContent)) {
  await db.collection("educationContent").doc(id).set({
    ...content,
    reviewedAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp()
  }, { merge: true });
}

console.log(`Seeded ${Object.keys(seed.facilities).length} facilities and ${Object.keys(seed.educationContent).length} education documents into ${projectId}.`);
