import { initializeApp } from "firebase/app";
import {
    getAuth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
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
    const { firstName, lastName, email, phone, dateOfBirth, gender, password } = client;
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    const fullName = `${firstName} ${lastName}`.trim();
    await updateProfile(user, { displayName: fullName });
    // Passwords are held and hashed by Firebase Authentication only; never write one to Firestore.
    // A Firestore outage or a rules-deployment gap must not undo a successful
    // Firebase Auth account creation or strand the signed-in client.
    try {
        await setDoc(doc(db, "users", user.uid), {
            uid: user.uid,
            firstName,
            lastName,
            email: user.email.toLowerCase(),
            phone,
            dateOfBirth,
            gender: gender || "",
            role: "patient",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        });
    } catch (error) {
        console.warn("Client profile could not be saved yet.", error);
    }
    return user;
}

export async function signInUser(email, password) {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
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
