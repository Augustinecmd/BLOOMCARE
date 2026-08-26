import { initializeApp } from "firebase/app";
import {
    getAuth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    setPersistence,
    browserSessionPersistence,
    updateProfile,
    sendPasswordResetEmail
} from "firebase/auth";
import {
    getFirestore,
    doc,
    setDoc,
    getDoc,
    collection,
    addDoc,
    getDocs,
    query,
    where,
    orderBy
} from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyDshCrEOlmxRCOPdt-YnNFT3iaMkNcG-ng",
    authDomain: "bloomcare-72986.firebaseapp.com",
    projectId: "bloomcare-72986",
    storageBucket: "bloomcare-72986.firebasestorage.app",
    messagingSenderId: "694672196906",
    appId: "1:694672196906:web:643cad455b369248b7ca53"
};

// Initialize Firebase App, Auth, and Firestore
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
setPersistence(auth, browserSessionPersistence).catch((error) => {
    console.warn("Session persistence could not be configured.", error);
});

export async function getSystemSettings() {
    const snap = await getDoc(doc(db, "systemSettings", "public"));
    return snap.exists() ? snap.data() : {};
}

export async function updateSystemSettings(settings) {
    await setDoc(doc(db, "systemSettings", "public"), { ...settings, updatedAt: new Date().toISOString() }, { merge: true });
    return settings;
}

// Authentication Helpers
export async function signUpUser(client) {
    const { firstName, lastName, email, phone, password } = client;
    const normalizedEmail = String(email).trim().toLowerCase();

    let user;
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, normalizedEmail, password);
        user = userCredential.user;
        console.log("[BloomCare Auth] Firebase account created:", { uid: user.uid, email: user.email });
    } catch (error) {
        console.error("[BloomCare Auth] Firebase account creation failed:", {
            code: error.code,
            message: error.message,
            email: normalizedEmail
        });
        throw error;
    }

    // Auth is complete at this point. Do not retry it if either profile operation fails.
    try {
        await updateProfile(user, { displayName: `${firstName} ${lastName}`.trim() });
        await setDoc(doc(db, "users", user.uid), {
            uid: user.uid,
            firstName,
            lastName,
            email: user.email.toLowerCase(),
            phone,
            role: "patient",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        });
        console.log("[BloomCare Auth] Firestore profile created successfully:", user.uid);
        return user;
    } catch (error) {
        console.error("[BloomCare Auth] Profile creation failed after Firebase Auth succeeded:", {
            uid: user.uid,
            code: error.code,
            message: error.message
        });
        const profileError = new Error("The account was created, but its profile could not be saved.");
        profileError.code = "firestore/profile-creation-failed";
        profileError.originalError = error;
        profileError.user = user;
        throw profileError;
    }
}

export async function signInUser(email, password) {
    const normalizedEmail = String(email).trim().toLowerCase();
    try {
        const userCredential = await signInWithEmailAndPassword(auth, normalizedEmail, password);
        console.log("[BloomCare Auth] Sign-in successful:", { uid: userCredential.user.uid, email: userCredential.user.email });
        return userCredential.user;
    } catch (error) {
        console.error("[BloomCare Auth] Sign-in failed:", {
            code: error.code,
            message: error.message,
            email: normalizedEmail
        });
        throw error;
    }
}

export async function signOutUser() {
    return await signOut(auth);
}

export function subscribeAuthState(callback) {
    return onAuthStateChanged(auth, callback);
}

export async function requestPasswordReset(email) {
    await sendPasswordResetEmail(auth, email);
}

export async function getClientProfile(userId) {
    const snap = await getDoc(doc(db, "users", userId));
    return snap.exists() ? snap.data() : null;
}

export async function updateClientProfile(userId, client) {
    const data = {
        firstName: client.firstName,
        lastName: client.lastName,
        phone: client.phone,
        dateOfBirth: client.dateOfBirth,
        gender: client.gender || "",
        role: client.role || "patient",
        updatedAt: new Date().toISOString()
    };
    await setDoc(doc(db, "users", userId), data, { merge: true });
    await updateProfile(auth.currentUser, { displayName: `${data.firstName} ${data.lastName}`.trim() });
    return data;
}

// Firestore Database Helpers ("Tables")

// 1. 'profiles' collection
export async function saveUserProfile(userId, profileData) {
    const profileRef = doc(db, "profiles", userId);
    const data = {
        userId,
        ...profileData,
        updatedAt: new Date().toISOString()
    };
    await setDoc(profileRef, data, { merge: true });
    return data;
}

export async function getUserProfile(userId) {
    const profileRef = doc(db, "profiles", userId);
    const snap = await getDoc(profileRef);
    return snap.exists() ? snap.data() : null;
}

// 2. 'healthRecords' collection
export async function saveHealthRecord(userId, recordData) {
    const recordsCol = collection(db, "healthRecords");
    const data = {
        userId,
        ...recordData,
        date: recordData.date || new Date().toISOString()
    };
    const docRef = await addDoc(recordsCol, data);
    return { id: docRef.id, ...data };
}

export async function getHealthRecords(userId) {
    try {
        const recordsCol = collection(db, "healthRecords");
        const q = query(recordsCol, where("userId", "==", userId), orderBy("date", "desc"));
        const querySnapshot = await getDocs(q);
        const records = [];
        querySnapshot.forEach((doc) => {
            records.push({ id: doc.id, ...doc.data() });
        });
        return records;
    } catch (error) {
        // Fallback query if index is building or not present
        const recordsCol = collection(db, "healthRecords");
        const q = query(recordsCol, where("userId", "==", userId));
        const querySnapshot = await getDocs(q);
        const records = [];
        querySnapshot.forEach((doc) => {
            records.push({ id: doc.id, ...doc.data() });
        });
        return records.sort((a, b) => new Date(b.date) - new Date(a.date));
    }
}

// 3. 'appointmentRequests' collection
export async function saveAppointmentRequest(userId, requestData) {
    const requestsCol = collection(db, "appointmentRequests");
    const data = {
        userId,
        fee: requestData.fee || 20000,
        currency: requestData.currency || "UGX",
        status: requestData.status || "payment-confirmed",
        requestedAt: new Date().toISOString()
    };
    const docRef = await addDoc(requestsCol, data);
    return { id: docRef.id, ...data };
}
