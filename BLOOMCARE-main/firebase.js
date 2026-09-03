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
export const authPersistenceReady = setPersistence(auth, browserSessionPersistence).catch((error) => {
    console.warn("Session persistence could not be configured.", error);
    throw error;
});

export async function resetAuthSession() {
    await authPersistenceReady;
    await signOut(auth);
}

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
    const { firstName, lastName, email, phone, password, dateOfBirth = "", gender = "" } = client;
    const normalizedEmail = String(email).trim().toLowerCase();

    let user;
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, normalizedEmail, password);
        user = userCredential.user;
    } catch (error) {
        console.error("[BloomCare Auth] Firebase account creation failed:", {
            code: error.code,
            message: error.message
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
            dateOfBirth,
            gender,
            role: "patient",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        });
        return user;
    } catch (error) {
        console.error("[BloomCare Auth] Profile creation failed after Firebase Auth succeeded:", {
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
        return userCredential.user;
    } catch (error) {
        console.error("[BloomCare Auth] Sign-in failed:", {
            code: error.code,
            message: error.message
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
    if (typeof client.email === "string" && client.email.trim()) {
        data.email = client.email.trim().toLowerCase();
    }
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
    const id = String(requestData.paymentReference || requestData.reference || "").trim();
    if (!id) throw new Error("A verified payment reference is required to save an appointment.");
    const data = {
        userId,
        service: requestData.service,
        provider: requestData.provider,
        date: requestData.date,
        time: requestData.time,
        facility: requestData.facility,
        reason: requestData.reason || "",
        fee: requestData.fee,
        currency: requestData.currency,
        paymentStatus: requestData.paymentStatus,
        appointmentStatus: requestData.appointmentStatus,
        reference: requestData.reference,
        receiptNumber: requestData.receiptNumber,
        paymentReference: id,
        requestedAt: requestData.requestedAt || new Date().toISOString()
    };
    await setDoc(doc(db, "appointmentRequests", id), data, { merge: true });
    return { id, ...data };
}

export async function getLatestAppointmentRequest(userId) {
    const requests = await getDocs(query(collection(db, "appointmentRequests"), where("userId", "==", userId)));
    return requests.docs
        .map((snapshot) => ({ id: snapshot.id, ...snapshot.data() }))
        .sort((left, right) => new Date(right.requestedAt) - new Date(left.requestedAt))[0] || null;
}
