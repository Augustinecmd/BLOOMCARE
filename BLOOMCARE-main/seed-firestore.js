import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { getFirestore, doc, setDoc, collection, addDoc } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyDshCrEOlmxRCOPdt-YnNFT3iaMkNcG-ng",
    authDomain: "bloomcare-72986.firebaseapp.com",
    projectId: "bloomcare-72986",
    storageBucket: "bloomcare-72986.firebasestorage.app",
    messagingSenderId: "694672196906",
    appId: "1:694672196906:web:643cad455b369248b7ca53"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

async function seedDatabase() {
    console.log("Seeding Firestore tables/collections for bloomcare-72986...");

    const email = "demo@bloomcare.com";
    const password = "Password123!";
    let user;

    try {
        const cred = await signInWithEmailAndPassword(auth, email, password);
        user = cred.user;
        console.log("✓ Logged in as existing demo user:", user.uid);
    } catch (e) {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        user = cred.user;
        console.log("✓ Created new authenticated demo user:", user.uid);
    }

    const userId = user.uid;

    // 1. Seed 'users' collection
    await setDoc(doc(db, "users", userId), {
        uid: userId,
        name: "Amina Okello",
        email: email,
        createdAt: new Date().toISOString()
    });
    console.log("✓ Created 'users' table document");

    // 2. Seed 'profiles' collection
    await setDoc(doc(db, "profiles", userId), {
        userId: userId,
        lmp: "2026-06-25",
        edd: "2027-04-01",
        previousPregnancies: 0,
        facility: "Kampala Women's Health Centre",
        medicalHistory: "No major prior medical conditions.",
        allergies: "None reported",
        emergencyContact: "+256 700 123456",
        updatedAt: new Date().toISOString()
    });
    console.log("✓ Created 'profiles' table document");

    // 3. Seed 'healthRecords' collection
    await addDoc(collection(db, "healthRecords"), {
        userId: userId,
        date: new Date().toISOString(),
        weight: 62.5,
        temperature: 36.6,
        systolic: 112,
        diastolic: 73,
        wellbeing: "Feeling well",
        symptoms: "Mild fatigue in morning",
        medication: true
    });
    console.log("✓ Created 'healthRecords' table document");

    // 4. Seed 'appointmentRequests' collection
    await addDoc(collection(db, "appointmentRequests"), {
        userId: userId,
        fee: 20000,
        currency: "UGX",
        status: "payment-confirmed",
        requestedAt: new Date().toISOString()
    });
    console.log("✓ Created 'appointmentRequests' table document");

    console.log("🎉 Successfully seeded all 4 Firestore tables!");
    process.exit(0);
}

seedDatabase().catch((err) => {
    console.error("Seeding error:", err);
    process.exit(1);
});
