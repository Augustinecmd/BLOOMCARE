import { initializeApp } from "firebase/app";
import {
    getAuth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    updateProfile
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

// Authentication Helpers
export async function signUpUser(email, password, name) {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    if (name) {
        await updateProfile(user, { displayName: name });
    }
    // Store user record in 'users' collection
    await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        name: name || user.email.split("@")[0],
        email: user.email,
        createdAt: new Date().toISOString()
    });
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
