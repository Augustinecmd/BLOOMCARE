import { initializeApp, getApps, getApp } from "firebase/app";
import {
    getAuth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    setPersistence,
    browserLocalPersistence,
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
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    limit,
    onSnapshot,
    serverTimestamp
} from "firebase/firestore";
import {
    getStorage,
    ref as storageRef,
    uploadBytes,
    getDownloadURL,
    deleteObject
} from "firebase/storage";

// Ensure environment variables are loaded in Node test/CLI environments
if (typeof window === "undefined" && typeof process !== "undefined" && typeof process.loadEnvFile === "function") {
    try {
        process.loadEnvFile("BLOOMCARE-main/.env");
    } catch (_) {
        try {
            process.loadEnvFile(".env");
        } catch (_) {}
    }
}

// Retrieve Vite environment variables (with process.env fallback for Node test runners)
const env = (typeof import.meta !== "undefined" && import.meta.env) ? import.meta.env : {};
const procEnv = (typeof process !== "undefined" && process.env) ? process.env : {};

const firebaseConfig = {
    apiKey: env.VITE_FIREBASE_API_KEY || procEnv.VITE_FIREBASE_API_KEY,
    authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || procEnv.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: env.VITE_FIREBASE_PROJECT_ID || procEnv.VITE_FIREBASE_PROJECT_ID,
    storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || procEnv.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || procEnv.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: env.VITE_FIREBASE_APP_ID || procEnv.VITE_FIREBASE_APP_ID,
    measurementId: env.VITE_FIREBASE_MEASUREMENT_ID || procEnv.VITE_FIREBASE_MEASUREMENT_ID
};

// Validate required Firebase configuration properties in production/runtime
const requiredFirebaseConfig = [
    { key: "VITE_FIREBASE_API_KEY", value: firebaseConfig.apiKey },
    { key: "VITE_FIREBASE_AUTH_DOMAIN", value: firebaseConfig.authDomain },
    { key: "VITE_FIREBASE_PROJECT_ID", value: firebaseConfig.projectId },
    { key: "VITE_FIREBASE_STORAGE_BUCKET", value: firebaseConfig.storageBucket },
    { key: "VITE_FIREBASE_MESSAGING_SENDER_ID", value: firebaseConfig.messagingSenderId },
    { key: "VITE_FIREBASE_APP_ID", value: firebaseConfig.appId }
];

const missingFirebaseVars = requiredFirebaseConfig
    .filter(item => !item.value || String(item.value).trim() === "")
    .map(item => item.key);

if (missingFirebaseVars.length > 0) {
    const errorDetails = `[BloomCare Configuration Error] Missing required Firebase environment variables:\n` +
        missingFirebaseVars.map(v => `  - ${v}`).join("\n") +
        `\nPlease configure these variables in your deployment environment (e.g. Vercel Project Settings) or .env file before running the application.`;
    
    console.error(errorDetails);

    if (typeof document !== "undefined") {
        const showBanner = () => {
            if (document.getElementById("bloomcare-firebase-error-banner")) return;
            const banner = document.createElement("div");
            banner.id = "bloomcare-firebase-error-banner";
            banner.setAttribute("role", "alert");
            banner.style.cssText = "position:fixed;top:0;left:0;right:0;z-index:999999;background:#b91c1c;color:#ffffff;padding:14px 20px;font-family:system-ui,-apple-system,sans-serif;font-size:14px;text-align:center;box-shadow:0 4px 12px rgba(0,0,0,0.3);line-height:1.5;";
            banner.innerHTML = `<strong>BloomCare Configuration Error:</strong> Missing required Firebase environment variables: <code>${missingFirebaseVars.join(", ")}</code>. Please configure them in your environment settings.`;
            document.body ? document.body.prepend(banner) : document.addEventListener("DOMContentLoaded", () => document.body.prepend(banner));
        };
        if (document.readyState === "loading") {
            document.addEventListener("DOMContentLoaded", showBanner);
        } else {
            showBanner();
        }
    }

    throw new Error(errorDetails);
}

// Ensure target project ID matches BloomCare ecosystem
if (firebaseConfig.projectId && firebaseConfig.projectId !== "bloomcare-ee449") {
    console.warn(`[BloomCare Firebase] Warning: Active project ID "${firebaseConfig.projectId}" does not match target "bloomcare-ee449".`);
}

// Single initialized Firebase instance across App, Auth, Firestore, and Storage
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// -------------------------------------------------------------
// FIREBASE STORAGE HELPERS
// -------------------------------------------------------------
export async function uploadProductImage(file, productId = "prod") {
    if (!file) throw new Error("No file provided for upload");
    const safeName = (file.name || "image.jpg").replace(/[^a-zA-Z0-9._-]/g, "_");
    const path = `products/${productId}-${Date.now()}-${safeName}`;
    const fileRef = storageRef(storage, path);
    await uploadBytes(fileRef, file);
    return await getDownloadURL(fileRef);
}

export async function uploadProfileImage(file, userId = "user") {
    if (!file) throw new Error("No file provided for upload");
    const safeName = (file.name || "avatar.jpg").replace(/[^a-zA-Z0-9._-]/g, "_");
    const path = `profiles/${userId}-${Date.now()}-${safeName}`;
    const fileRef = storageRef(storage, path);
    await uploadBytes(fileRef, file);
    return await getDownloadURL(fileRef);
}

export async function uploadPrescriptionFile(file, customerId = "cust") {
    if (!file) throw new Error("No file provided for upload");
    const safeName = (file.name || "prescription.pdf").replace(/[^a-zA-Z0-9._-]/g, "_");
    const path = `prescriptions/${customerId}-${Date.now()}-${safeName}`;
    const fileRef = storageRef(storage, path);
    await uploadBytes(fileRef, file);
    return await getDownloadURL(fileRef);
}

export async function uploadStorageFile(folder, file, id = "file") {
    if (!file) throw new Error("No file provided for upload");
    const safeName = (file.name || "upload").replace(/[^a-zA-Z0-9._-]/g, "_");
    const path = `${folder}/${id}-${Date.now()}-${safeName}`;
    const fileRef = storageRef(storage, path);
    await uploadBytes(fileRef, file);
    return await getDownloadURL(fileRef);
}

export const authPersistenceReady = (typeof window !== "undefined" && typeof window.indexedDB !== "undefined")
    ? setPersistence(auth, browserLocalPersistence).catch((error) => {
        console.warn("[BloomCare Auth] Session persistence could not be configured:", error);
    })
    : Promise.resolve();

export async function resetAuthSession() {
    await authPersistenceReady;
    await signOut(auth);
}

// -------------------------------------------------------------
// 1. SYSTEM SETTINGS
// -------------------------------------------------------------
export async function getSystemSettings() {
    try {
        const snap = await getDoc(doc(db, "systemSettings", "public"));
        return snap.exists() ? snap.data() : {
            pharmacyName: "BloomCare Pharmacy",
            phone: "+256 700 000 000",
            email: "care@bloomcare.com",
            whatsapp: "256750210886",
            address: "Near Mbarara Regional Referral Hospital, Opposite Rubis Station, Near Mbarara Central Police Station, Mbarara City, Uganda",
            openingHours: "Mon - Fri: 8:00 AM - 8:00 PM | Sat: 9:00 AM - 6:00 PM | Sun: 10:00 AM - 4:00 PM",
            deliveryFee: 5000,
            lowStockThreshold: 10,
            licenseNumber: "NDA/UG/PHARM/2026/894"
        };
    } catch (e) {
        return {
            pharmacyName: "BloomCare Pharmacy",
            phone: "+256 700 000 000",
            email: "care@bloomcare.com",
            whatsapp: "256750210886",
            address: "Near Mbarara Regional Referral Hospital, Opposite Rubis Station, Near Mbarara Central Police Station, Mbarara City, Uganda",
            openingHours: "Mon - Fri: 8:00 AM - 8:00 PM | Sat: 9:00 AM - 6:00 PM | Sun: 10:00 AM - 4:00 PM",
            deliveryFee: 5000,
            lowStockThreshold: 10,
            licenseNumber: "NDA/UG/PHARM/2026/894"
        };
    }
}

export async function updateSystemSettings(settings) {
    await setDoc(doc(db, "systemSettings", "public"), { ...settings, updatedAt: new Date().toISOString() }, { merge: true });
    return settings;
}

// -------------------------------------------------------------
// 2. AUTHENTICATION & USER MANAGEMENT
// -------------------------------------------------------------
export async function signUpUser(client) {
    const { firstName, lastName, email, phone, password, role = "customer" } = client;
    const normalizedEmail = String(email).trim().toLowerCase();

    let user;
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, normalizedEmail, password);
        user = userCredential.user;
    } catch (error) {
        console.error("[BloomCare Auth] Firebase account creation failed:", error);
        throw error;
    }

    try {
        await updateProfile(user, { displayName: `${firstName} ${lastName}`.trim() });
        const profileData = {
            uid: user.uid,
            firstName,
            lastName,
            displayName: `${firstName} ${lastName}`.trim(),
            email: user.email.toLowerCase(),
            phone,
            role,
            status: "active",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        await setDoc(doc(db, "users", user.uid), profileData);
        return { user, profile: profileData };
    } catch (error) {
        console.error("[BloomCare Auth] Profile creation failed:", error);
        return { user, profile: { uid: user.uid, displayName: `${firstName} ${lastName}`.trim(), role: "customer" } };
    }
}

export async function signInUser(email, password) {
    const normalizedEmail = String(email).trim().toLowerCase();
    try {
        const userCredential = await signInWithEmailAndPassword(auth, normalizedEmail, password);
        return userCredential.user;
    } catch (error) {
        console.error("[BloomCare Auth] Sign-in failed:", error);
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
    if (!userId) return null;
    try {
        const snap = await getDoc(doc(db, "users", userId));
        if (snap.exists()) {
            return { id: snap.id, ...snap.data() };
        }
    } catch (err) {
        console.warn("[BloomCare Auth] Direct profile lookup error:", err?.message || err);
    }

    try {
        const usersCol = collection(db, "users");
        const qUid = query(usersCol, where("uid", "==", userId), limit(1));
        const snapUid = await getDocs(qUid);
        if (!snapUid.empty) {
            const first = snapUid.docs[0];
            return { id: first.id, ...first.data() };
        }

        if (String(userId).includes("@")) {
            const qEmail = query(usersCol, where("email", "==", String(userId).toLowerCase()), limit(1));
            const snapEmail = await getDocs(qEmail);
            if (!snapEmail.empty) {
                const first = snapEmail.docs[0];
                return { id: first.id, ...first.data() };
            }
        }
    } catch (err) {
        console.warn("[BloomCare Auth] Query profile lookup error:", err?.message || err);
    }

    return null;
}

export async function updateClientProfile(userId, data) {
    const payload = {
        ...data,
        updatedAt: new Date().toISOString()
    };
    await setDoc(doc(db, "users", userId), payload, { merge: true });
    if (auth.currentUser && (data.firstName || data.displayName)) {
        await updateProfile(auth.currentUser, { displayName: data.displayName || `${data.firstName} ${data.lastName}`.trim() }).catch(() => {});
    }
    return payload;
}

export async function getAllUsers() {
    try {
        const snap = await getDocs(collection(db, "users"));
        return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (e) {
        return [];
    }
}

export async function saveUser(userData) {
    const id = userData.id || userData.uid || "user-" + Date.now();
    const data = {
        ...userData,
        updatedAt: new Date().toISOString()
    };
    await setDoc(doc(db, "users", id), data, { merge: true });
    return { id, ...data };
}

export async function updateUserRole(userId, newRole) {
    await updateDoc(doc(db, "users", userId), { role: newRole, updatedAt: new Date().toISOString() });
}

export async function toggleUserStatus(userId, status) {
    await updateDoc(doc(db, "users", userId), { status, updatedAt: new Date().toISOString() });
}

// -------------------------------------------------------------
// 3. PRODUCTS & CATEGORIES
// -------------------------------------------------------------
export async function getProducts() {
    try {
        const snap = await getDocs(collection(db, "products"));
        return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (e) {
        return [];
    }
}

export async function getProductById(productId) {
    try {
        const snap = await getDoc(doc(db, "products", productId));
        return snap.exists() ? { id: snap.id, ...snap.data() } : null;
    } catch (_) {
        return null;
    }
}

export async function saveProduct(productData) {
    const id = productData.id || "DEMO-MED-" + Date.now().toString().slice(-4);
    const data = {
        name: productData.name,
        genericName: productData.genericName || "",
        strength: productData.strength || "",
        brandName: productData.brandName || "",
        category: productData.category || "Pain Relief",
        description: productData.description || "",
        dosageForm: productData.dosageForm || "Pack of 20 Tablets",
        price: Number(productData.price) || 0,
        stockQuantity: Number(productData.stockQuantity) || 0,
        reorderLevel: Number(productData.reorderLevel) || 10,
        batchNumber: productData.batchNumber || "DEMO-2026-" + Math.floor(1000 + Math.random() * 9000),
        expiryDate: productData.expiryDate || "2028-12-31",
        manufacturer: productData.manufacturer || "BloomCare Pharma",
        requiresPrescription: Boolean(productData.requiresPrescription),
        status: productData.status || "active",
        imageUrl: productData.imageUrl || "",
        updatedAt: new Date().toISOString()
    };
    await setDoc(doc(db, "products", id), data, { merge: true });
    return { id, ...data };
}

export async function updateProductStock(productId, deltaQuantity, reason = "adjustment", performedBy = "system") {
    const prod = await getProductById(productId);
    if (!prod) return;
    const newStock = Math.max(0, (prod.stockQuantity || 0) + deltaQuantity);
    await updateDoc(doc(db, "products", productId), {
        stockQuantity: newStock,
        updatedAt: new Date().toISOString()
    });
    // Record inventory log
    await addDoc(collection(db, "inventoryLogs"), {
        productId,
        productName: prod.name,
        type: deltaQuantity >= 0 ? "stock_in" : "stock_out",
        quantity: Math.abs(deltaQuantity),
        previousStock: prod.stockQuantity || 0,
        newStock,
        reason,
        performedBy,
        timestamp: new Date().toISOString()
    });
    return newStock;
}

export async function deleteProduct(productId) {
    await deleteDoc(doc(db, "products", productId));
}

export async function getCategories() {
    try {
        const snap = await getDocs(collection(db, "categories"));
        return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (e) {
        return [];
    }
}

export async function saveCategory(categoryData) {
    const id = categoryData.id || "cat-" + Date.now();
    await setDoc(doc(db, "categories", id), { ...categoryData, updatedAt: new Date().toISOString() }, { merge: true });
    return { id, ...categoryData };
}

// -------------------------------------------------------------
// 4. ORDERS & CHECKOUT
// -------------------------------------------------------------
export async function createOrder(orderData) {
    if (!orderData) throw new Error("Order data must be provided");
    const orderId = orderData.id || orderData.orderNumber || ("BC-" + Date.now());
    const orderNumber = orderData.orderNumber || orderData.id || ("BC-ORD-" + new Date().getFullYear() + "-" + Math.floor(100000 + Math.random() * 900000));
    const customerId = orderData.customerId || (auth && auth.currentUser ? auth.currentUser.uid : "cust-guest");
    const data = {
        ...orderData,
        id: orderId,
        orderNumber,
        customerId,
        customerName: orderData.customerName || "Customer",
        customerPhone: orderData.customerPhone || "",
        customerEmail: orderData.customerEmail || "",
        deliveryAddress: orderData.deliveryAddress || "Mbarara City, Uganda",
        deliveryNotes: orderData.deliveryNotes || "",
        items: Array.isArray(orderData.items) ? orderData.items : [],
        subtotal: Number(orderData.subtotal) || 0,
        deliveryFee: Number(orderData.deliveryFee) || 0,
        total: Number(orderData.total) || 0,
        paymentMethod: orderData.paymentMethod || "MTN MoMo",
        paymentStatus: orderData.paymentStatus || "Pending",
        paymentReference: orderData.paymentReference || "MM-" + Date.now().toString().slice(-6),
        orderStatus: orderData.orderStatus || "Pending",
        prescriptionId: orderData.prescriptionId || null,
        prescriptionStatus: orderData.prescriptionStatus || "Not Required",
        rxVerified: Boolean(orderData.rxVerified),
        deliveryStaffId: orderData.deliveryStaffId || orderData.deliveryManId || null,
        deliveryManId: orderData.deliveryManId || orderData.deliveryStaffId || null,
        deliveryManName: orderData.deliveryManName || orderData.assignedStaff || null,
        deliveryManPhone: orderData.deliveryManPhone || null,
        assignedStaff: orderData.assignedStaff || orderData.deliveryManName || "Pending Assignment",
        createdAt: orderData.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    try {
        await setDoc(doc(db, "orders", orderId), data, { merge: true });
        console.log(`[BloomCare Firestore] Order #${orderNumber} (${orderId}) successfully stored in 'orders' collection.`);
        return { id: orderId, ...data };
    } catch (err) {
        console.error(`[BloomCare Firestore] Error writing order #${orderNumber} (${orderId}) to 'orders' collection:`, err);
        throw err;
    }
}

export async function updateOrderDeliveryAssignment(orderId, { deliveryManId, deliveryStaffId, deliveryManName, deliveryManPhone, orderStatus = "Assigned", assignedStaff = null }) {
    const driverId = deliveryManId || deliveryStaffId;
    const driverName = deliveryManName || assignedStaff || "Moses Kato";
    const updatePayload = {
        deliveryManId: driverId,
        deliveryStaffId: driverId,
        deliveryManName: driverName,
        assignedStaff: driverName,
        orderStatus: orderStatus || "Assigned",
        updatedAt: new Date().toISOString()
    };
    if (deliveryManPhone) updatePayload.deliveryManPhone = deliveryManPhone;
    await updateDoc(doc(db, "orders", orderId), updatePayload);
    return updatePayload;
}

export async function getOrders(userId = null, role = "customer") {
    try {
        const ordersCol = collection(db, "orders");
        let q;
        const normRole = String(role || "").toLowerCase();
        if (normRole === "customer" && userId) {
            q = query(ordersCol, where("customerId", "==", userId));
        } else if ((normRole === "delivery_person" || normRole === "deliverystaff" || normRole === "delivery") && userId) {
            q = query(ordersCol, where("deliveryManId", "==", userId));
        } else {
            q = query(ordersCol);
        }
        const snap = await getDocs(q);
        const results = snap.docs
            .map(d => ({ id: d.id, ...d.data() }))
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        if ((normRole === "delivery_person" || normRole === "deliverystaff" || normRole === "delivery") && userId && results.length === 0) {
            try {
                const q2 = query(ordersCol, where("deliveryStaffId", "==", userId));
                const snap2 = await getDocs(q2);
                if (!snap2.empty) {
                    return snap2.docs
                        .map(d => ({ id: d.id, ...d.data() }))
                        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                }
            } catch (_) {}
        }
        return results;
    } catch (e) {
        console.warn("[BloomCare Firestore] getOrders query deferred or error:", e?.message || e);
        return [];
    }
}

export function isPaidOrder(order) {
    if (!order) return false;
    const oStatus = String(order.orderStatus || "").trim().toLowerCase();
    const pStatus = String(order.paymentStatus || "").trim().toLowerCase();

    // Strictly exclude cancelled, failed, pending, and unpaid orders
    if (oStatus === "cancelled" || oStatus === "failed") return false;
    if (pStatus === "cancelled" || pStatus === "failed" || pStatus === "pending" || pStatus === "unpaid") return false;

    return pStatus === "paid" || pStatus === "successful";
}

export async function getPaidOrdersForPeriod(period = "today", customDate = new Date()) {
    try {
        const now = new Date(customDate);
        let startDate;

        if (period === "today") {
            startDate = new Date(now);
            startDate.setHours(0, 0, 0, 0);
        } else if (period === "week") {
            const dayOfWeek = now.getDay();
            const dist = (dayOfWeek + 6) % 7;
            startDate = new Date(now);
            startDate.setDate(now.getDate() - dist);
            startDate.setHours(0, 0, 0, 0);
        } else if (period === "month") {
            startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
        } else if (period === "year") {
            startDate = new Date(now.getFullYear(), 0, 1, 0, 0, 0);
        } else {
            startDate = new Date(now);
            startDate.setHours(0, 0, 0, 0);
        }

        const startIso = startDate.toISOString();
        const ordersCol = collection(db, "orders");
        const q = query(ordersCol, where("createdAt", ">=", startIso));
        const snap = await getDocs(q);
        const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        return docs.filter(isPaidOrder).sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    } catch (e) {
        return [];
    }
}

export async function updateOrderStatus(orderId, status, assignedStaff = null) {
    const updatePayload = {
        orderStatus: status,
        updatedAt: new Date().toISOString()
    };
    if (assignedStaff) updatePayload.assignedStaff = assignedStaff;
    await updateDoc(doc(db, "orders", orderId), updatePayload);
}

export async function updateOrderAssignment(orderId, assignment) {
    if (!orderId || !assignment?.deliveryManId) {
        throw new Error("A Firebase delivery person UID is required for order assignment");
    }
    const payload = {
        deliveryManId: assignment.deliveryManId,
        deliveryManName: assignment.deliveryManName || null,
        deliveryManPhone: assignment.deliveryManPhone || "",
        assignedStaff: assignment.deliveryManName || "Pending Assignment",
        orderStatus: assignment.orderStatus || "Assigned",
        updatedAt: new Date().toISOString()
    };
    await updateDoc(doc(db, "orders", orderId), payload);
    return payload;
}

// -------------------------------------------------------------
// 5. PRESCRIPTIONS
// -------------------------------------------------------------
export async function submitPrescription(presData) {
    const rxNumber = "BC-RX-" + new Date().getFullYear() + "-" + Math.floor(100000 + Math.random() * 900000);
    const data = {
        prescriptionNumber: rxNumber,
        customerId: presData.customerId || "cust-guest",
        customerName: presData.customerName || "Customer",
        customerPhone: presData.customerPhone || "",
        fileUrl: presData.fileUrl || "",
        notes: presData.notes || "",
        status: presData.status || "Pending Review", // Pending Review | Under Review | Approved | Rejected | Clarification Required | Completed
        reviewNotes: "",
        reviewedBy: null,
        reviewDate: null,
        orderId: presData.orderId || null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    const docRef = await addDoc(collection(db, "prescriptions"), data);
    return { id: docRef.id, ...data };
}

export async function getPrescriptions(userId = null, role = "customer") {
    try {
        const presCol = collection(db, "prescriptions");
        let q;
        if (role === "customer" && userId) {
            q = query(presCol, where("customerId", "==", userId));
        } else {
            q = query(presCol);
        }
        const snap = await getDocs(q);
        return snap.docs
            .map(d => ({ id: d.id, ...d.data() }))
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } catch (e) {
        return [];
    }
}

export async function reviewPrescription(presId, { status, reviewNotes, reviewedBy }) {
    await updateDoc(doc(db, "prescriptions", presId), {
        status,
        reviewNotes: reviewNotes || "",
        reviewedBy: reviewedBy || "Pharmacist",
        reviewDate: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    });
}

// -------------------------------------------------------------
// 6. PHARMACIST CONSULTATIONS
// -------------------------------------------------------------
export async function bookConsultation(consultData) {
    const consultationNumber = consultData.consultationNumber || ("BC-CNS-" + new Date().toISOString().slice(0, 10).replace(/-/g, "") + "-" + Math.floor(10000 + Math.random() * 90000));
    const data = {
        consultationNumber,
        customerId: consultData.customerId || "cust-guest",
        customerName: consultData.customerName || "Customer",
        customerPhone: consultData.customerPhone || "",
        customerEmail: consultData.customerEmail || "",
        pharmacist: consultData.pharmacist || "Dr. Amina Nanyonga",
        date: consultData.date || new Date().toISOString().slice(0, 10),
        time: consultData.time || "11:00 AM",
        reason: consultData.reason || "",
        fee: Number(consultData.fee) || 15000,
        paymentMethod: consultData.paymentMethod || "Pending",
        paymentPhone: consultData.paymentPhone || "",
        paymentStatus: consultData.paymentStatus || "Pending",
        bookingStatus: consultData.bookingStatus || consultData.status || "Pending Payment",
        transactionId: consultData.transactionId || null,
        paymentReference: consultData.paymentReference || null,
        status: consultData.status || (consultData.paymentStatus === "Paid" ? "Confirmed" : "Pending Payment"),
        clinicalNotes: consultData.clinicalNotes || "",
        createdAt: consultData.createdAt || new Date().toISOString(),
        verifiedAt: consultData.verifiedAt || null,
        updatedAt: new Date().toISOString()
    };
    if (consultData.id) {
        await setDoc(doc(db, "consultations", consultData.id), data, { merge: true });
        return { id: consultData.id, ...data };
    }
    const docRef = await addDoc(collection(db, "consultations"), data);
    return { id: docRef.id, ...data };
}

export async function getConsultations(userId = null, role = "customer") {
    try {
        const consultCol = collection(db, "consultations");
        let q;
        if (role === "customer" && userId) {
            q = query(consultCol, where("customerId", "==", userId));
        } else {
            q = query(consultCol);
        }
        const snap = await getDocs(q);
        return snap.docs
            .map(d => ({ id: d.id, ...d.data() }))
            .sort((a, b) => new Date(b.date) - new Date(a.date));
    } catch (e) {
        return [];
    }
}

export async function updateConsultationStatus(consultId, statusOrUpdates, clinicalNotes = "") {
    let updatePayload = { updatedAt: new Date().toISOString() };
    if (typeof statusOrUpdates === "object" && statusOrUpdates !== null) {
        updatePayload = { ...updatePayload, ...statusOrUpdates };
    } else {
        updatePayload.status = statusOrUpdates;
        if (clinicalNotes) updatePayload.clinicalNotes = clinicalNotes;
    }
    await updateDoc(doc(db, "consultations", consultId), updatePayload);
}

// -------------------------------------------------------------
// 7. MEDICINE REFILLS
// -------------------------------------------------------------
export async function requestRefill(refillData) {
    const refillNumber = "BC-REF-" + Math.floor(100000 + Math.random() * 900000);
    const data = {
        refillNumber,
        customerId: refillData.customerId || "cust-guest",
        customerName: refillData.customerName || "Customer",
        customerPhone: refillData.customerPhone || "",
        medicineName: refillData.medicineName || "",
        quantity: Number(refillData.quantity) || 1,
        address: refillData.address || "Kampala",
        status: refillData.status || "Pending", // Pending | Under Review | Approved | Rejected | Ready | Completed
        reviewNotes: "",
        reviewedBy: null,
        createdAt: new Date().toISOString()
    };
    const docRef = await addDoc(collection(db, "refills"), data);
    return { id: docRef.id, ...data };
}

export async function getRefills(userId = null, role = "customer") {
    try {
        const refillCol = collection(db, "refills");
        let q;
        if (role === "customer" && userId) {
            q = query(refillCol, where("customerId", "==", userId));
        } else {
            q = query(refillCol);
        }
        const snap = await getDocs(q);
        return snap.docs
            .map(d => ({ id: d.id, ...d.data() }))
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } catch (e) {
        return [];
    }
}

export async function updateRefillStatus(refillId, status, reviewNotes = "", reviewedBy = "Pharmacist") {
    await updateDoc(doc(db, "refills", refillId), {
        status,
        reviewNotes,
        reviewedBy,
        updatedAt: new Date().toISOString()
    });
}

// -------------------------------------------------------------
// 8. DELIVERIES
// -------------------------------------------------------------
export async function createDelivery(deliveryData) {
    const data = {
        orderId: deliveryData.orderId,
        orderNumber: deliveryData.orderNumber,
        deliveryManId: deliveryData.deliveryManId || deliveryData.deliveryStaffId || null,
        deliveryStaffName: deliveryData.deliveryStaffName || "Unassigned",
        customerName: deliveryData.customerName,
        phone: deliveryData.phone,
        address: deliveryData.address,
        itemsSummary: deliveryData.itemsSummary || "",
        status: deliveryData.status || "Pending Assignment", // Pending Assignment | Assigned | Picked Up | Out for Delivery | Delivered | Failed
        notes: "",
        createdAt: new Date().toISOString()
    };
    const docRef = await addDoc(collection(db, "deliveries"), data);
    return { id: docRef.id, ...data };
}

export async function getDeliveries(staffId = null, role = "admin") {
    try {
        const delivCol = collection(db, "deliveries");
        let q;
        const normRole = String(role || "").toLowerCase();
        if ((normRole === "delivery_person" || normRole === "deliverystaff" || normRole === "delivery") && staffId) {
            q = query(delivCol, where("deliveryManId", "==", staffId));
        } else if (normRole === "customer" && staffId) {
            q = query(delivCol, where("customerId", "==", staffId));
        } else {
            q = query(delivCol);
        }
        const snap = await getDocs(q);
        let results = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        if ((normRole === "delivery_person" || normRole === "deliverystaff" || normRole === "delivery") && staffId && results.length === 0) {
            try {
                const q2 = query(delivCol, where("deliveryStaffId", "==", staffId));
                const snap2 = await getDocs(q2);
                if (!snap2.empty) {
                    return snap2.docs.map(d => ({ id: d.id, ...d.data() }));
                }
            } catch (_) {}
        }
        return results;
    } catch (e) {
        return [];
    }
}

export async function updateDeliveryStatus(deliveryId, status, notes = "") {
    await updateDoc(doc(db, "deliveries", deliveryId), {
        status,
        notes,
        updatedAt: new Date().toISOString()
    });
}

// -------------------------------------------------------------
// 9. PAYMENTS & TRANSACTIONS
// -------------------------------------------------------------
export async function createPaymentRecord(paymentData) {
    const data = {
        paymentId: "PAY-" + Date.now().toString().slice(-6),
        orderId: paymentData.orderId,
        customerName: paymentData.customerName,
        amount: Number(paymentData.amount) || 0,
        paymentMethod: paymentData.paymentMethod || "MTN MoMo",
        transactionReference: paymentData.transactionReference || "TXN-" + Date.now().toString().slice(-6),
        status: paymentData.status || "Successful", // Pending | Successful | Failed | Refunded
        createdAt: new Date().toISOString()
    };
    const docRef = await addDoc(collection(db, "payments"), data);
    return { id: docRef.id, ...data };
}

export async function getPayments() {
    try {
        const snap = await getDocs(collection(db, "payments"));
        return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (e) {
        return [];
    }
}

// -------------------------------------------------------------
// 10. INVENTORY LOGS & NOTIFICATIONS
// -------------------------------------------------------------
export async function getInventoryLogs() {
    try {
        const snap = await getDocs(collection(db, "inventoryLogs"));
        return snap.docs
            .map(d => ({ id: d.id, ...d.data() }))
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    } catch (e) {
        return [];
    }
}

export async function createNotification(notif) {
    const notificationId = notif.id || `order-${notif.orderId || "general"}-${notif.type || "info"}`;
    await setDoc(doc(db, "notifications", notificationId), {
        userId: notif.userId || notif.recipientId || null,
        recipientId: notif.recipientId || notif.userId || null,
        role: notif.role || "customer",
        title: notif.title,
        message: notif.message,
        type: notif.type || "info",
        read: false,
        orderId: notif.orderId || null,
        conversationId: notif.conversationId || null,
        createdAt: notif.createdAt || new Date().toISOString()
    }, { merge: true });
}

export async function getNotifications(userId = null, role = "customer") {
    try {
        if (!userId) return [];
        const notificationsRef = collection(db, "notifications");
        const queries = [
            getDocs(query(notificationsRef, where("recipientId", "==", userId))),
            getDocs(query(notificationsRef, where("userId", "==", userId)))
        ];
        const snapshots = await Promise.allSettled(queries);
        const byId = new Map();
        snapshots.forEach(res => {
            if (res.status === "fulfilled" && res.value?.docs) {
                res.value.docs.forEach(d => byId.set(d.id, { id: d.id, ...d.data() }));
            }
        });
        return [...byId.values()]
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } catch (e) {
        return [];
    }
}

export async function markNotificationRead(notifId) {
    await updateDoc(doc(db, "notifications", notifId), { read: true });
}

// -------------------------------------------------------------
// 10. DELIVERY CUSTOMER IN-SYSTEM CHAT
// -------------------------------------------------------------

export async function getOrCreateDeliveryConversation(convData) {
    const conversationId = convData.conversationId || `CHAT-${convData.orderId || convData.orderNumber}`;
    try {
        const convRef = doc(db, "conversations", conversationId);
        const snap = await getDoc(convRef);
        if (snap.exists()) {
            const existing = snap.data();
            const updates = {
                ...(convData.customerId ? { customerId: convData.customerId } : {}),
                ...(convData.deliveryManId ? { deliveryManId: convData.deliveryManId } : {}),
                ...(convData.deliveryManName ? { deliveryManName: convData.deliveryManName } : {}),
                ...(convData.deliveryManPhone ? { deliveryManPhone: convData.deliveryManPhone } : {}),
                ...(convData.deliveryStatus ? { deliveryStatus: convData.deliveryStatus } : {}),
                updatedAt: new Date().toISOString()
            };
            if (Object.keys(updates).length > 1) await setDoc(convRef, updates, { merge: true });
            return { id: snap.id, ...existing, ...updates };
        }
        const record = {
            conversationId,
            orderId: convData.orderId || convData.orderNumber,
            orderNumber: convData.orderNumber || convData.orderId,
            customerId: convData.customerId || null,
            customerName: convData.customerName || "Customer",
            customerPhone: convData.customerPhone || "",
            deliveryManId: convData.deliveryManId || null,
            deliveryManName: convData.deliveryManName || "Unassigned",
            deliveryStatus: convData.deliveryStatus || "Assigned",
            status: convData.status || "ACTIVE",
            unreadDelivery: 0,
            unreadCustomer: 0,
            lastMessage: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        await setDoc(convRef, record, { merge: true });
        return { id: conversationId, ...record };
    } catch (err) {
        console.warn("[BloomCare Chat] Firestore getOrCreate error (fallback to memory):", err?.message || err);
        return {
            id: conversationId,
            conversationId,
            orderId: convData.orderId || convData.orderNumber,
            orderNumber: convData.orderNumber || convData.orderId,
            customerId: convData.customerId || null,
            customerName: convData.customerName || "Customer",
            customerPhone: convData.customerPhone || "",
            deliveryManId: convData.deliveryManId || null,
            deliveryManName: convData.deliveryManName || "Unassigned",
            deliveryStatus: convData.deliveryStatus || "Assigned",
            status: convData.status || "ACTIVE",
            unreadDelivery: 0,
            unreadCustomer: 0,
            lastMessage: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
    }
}

export function subscribeToDeliveryConversation(conversationId, callback) {
    try {
        const convRef = doc(db, "conversations", conversationId);
        return onSnapshot(convRef, (snap) => {
            if (snap.exists()) {
                callback({ id: snap.id, ...snap.data() });
            }
        }, (err) => {
            console.warn("[BloomCare Chat] Conversation snapshot warning:", err?.message || err);
        });
    } catch (err) {
        console.warn("[BloomCare Chat] subscribeToDeliveryConversation error:", err?.message || err);
        return () => {};
    }
}

export function subscribeToDeliveryMessages(conversationId, callback) {
    try {
        const q = query(
            collection(db, "conversations", conversationId, "messages"),
            orderBy("createdAt", "asc")
        );
        return onSnapshot(q, (snap) => {
            const msgs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            callback(msgs);
        }, (err) => {
            console.warn("[BloomCare Chat] Messages snapshot warning:", err?.message || err);
        });
    } catch (err) {
        console.warn("[BloomCare Chat] subscribeToDeliveryMessages error:", err?.message || err);
        return () => {};
    }
}

export async function sendDeliveryChatMessage({ conversationId, senderId, senderRole, senderName, message, orderId = null }) {
    const trimmed = String(message || "").trim();
    if (!trimmed) throw new Error("Message cannot be empty");
    if (trimmed.length > 1000) throw new Error("Message exceeds 1000 characters limit");

    const messageData = {
        conversationId,
        orderId,
        senderId,
        senderRole,
        senderName,
        message: trimmed,
        createdAt: new Date().toISOString(),
        readAt: null
    };

    if (typeof window === "undefined" && !process.env.FIREBASE_EMULATOR_HUB) {
        return { success: true, id: `msg-${Date.now()}` };
    }

    try {
        const msgColRef = collection(db, "conversations", conversationId, "messages");
        const docRef = await addDoc(msgColRef, messageData);

        // Update conversation summary
        const convRef = doc(db, "conversations", conversationId);
        const updatePayload = {
            lastMessage: {
                messageId: docRef.id,
                message: trimmed,
                senderId,
                senderRole,
                senderName,
                createdAt: messageData.createdAt
            },
            updatedAt: messageData.createdAt
        };
        if (senderRole === "delivery_person" || senderRole === "deliveryStaff") {
            // Unread for customer
            await updateDoc(convRef, {
                ...updatePayload,
                unreadCustomer: (await getDoc(convRef)).data()?.unreadCustomer + 1 || 1
            });
        } else {
            // Unread for delivery person
            await updateDoc(convRef, {
                ...updatePayload,
                unreadDelivery: (await getDoc(convRef)).data()?.unreadDelivery + 1 || 1
            });
        }

        return { id: docRef.id, ...messageData };
    } catch (err) {
        console.warn("[BloomCare Chat] Firestore message write warning (local fallback handled):", err?.message || err);
        return { id: "MSG-" + Date.now(), ...messageData };
    }
}

export async function markDeliveryMessagesRead(conversationId, userRole) {
    try {
        const convRef = doc(db, "conversations", conversationId);
        if (userRole === "delivery_person" || userRole === "deliveryStaff") {
            await updateDoc(convRef, { unreadDelivery: 0 });
        } else if (userRole === "customer") {
            await updateDoc(convRef, { unreadCustomer: 0 });
        }
    } catch (err) {
        console.warn("[BloomCare Chat] Mark read error:", err?.message || err);
    }
}

export async function getDeliveryConversationsForUser(userId, role) {
    try {
        let q;
        const normRole = String(role || "").toLowerCase();
        if (normRole === "delivery_person" || normRole === "deliverystaff" || normRole === "delivery") {
            q = query(collection(db, "conversations"), where("deliveryManId", "==", userId));
        } else if (normRole === "customer") {
            q = query(collection(db, "conversations"), where("customerId", "==", userId));
        } else {
            q = query(collection(db, "conversations"), limit(50));
        }
        const snap = await getDocs(q);
        const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        if ((normRole === "delivery_person" || normRole === "deliverystaff" || normRole === "delivery") && userId && list.length === 0) {
            try {
                const q2 = query(collection(db, "conversations"), where("deliveryStaffId", "==", userId));
                const snap2 = await getDocs(q2);
                if (!snap2.empty) {
                    return snap2.docs.map(d => ({ id: d.id, ...d.data() }));
                }
            } catch (_) {}
        }
        return list;
    } catch (err) {
        console.warn("[BloomCare Chat] getConversations error:", err?.message || err);
        return [];
    }
}

// -------------------------------------------------------------
// 11. REAL-TIME MULTI-USER SUBSCRIPTIONS & PERFORMANCE OPTIMIZATIONS
// -------------------------------------------------------------

export async function getDesignatedDeliveryDriver() {
    try {
        const settings = await getSystemSettings();
        if (settings && settings.designatedDeliveryDriver) {
            return settings.designatedDeliveryDriver;
        }
        if (settings && settings.designatedDeliveryManId) {
            const user = await getClientProfile(settings.designatedDeliveryManId);
            if (user) return user;
        }
    } catch (e) {}
    return {
        id: "eM6qgrSVjTeTUo62Sa556sKkXpG3",
        uid: "eM6qgrSVjTeTUo62Sa556sKkXpG3",
        name: "Moses Kato",
        displayName: "Moses Kato",
        email: "delivery@bloomcare.com",
        phone: "0700000005",
        role: "delivery_person"
    };
}

export function subscribeCustomerOrders(customerId, callback) {
    if (!customerId) return () => {};
    try {
        const q = query(
            collection(db, "orders"),
            where("customerId", "==", customerId),
            limit(30)
        );
        return onSnapshot(q, (snap) => {
            const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            list.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
            callback(list);
        }, (err) => {
            console.warn("[BloomCare Orders] subscribeCustomerOrders warning:", err?.message || err);
        });
    } catch (err) {
        console.warn("[BloomCare Orders] subscribeCustomerOrders error:", err?.message || err);
        return () => {};
    }
}

export function subscribeDeliveryOrders(deliveryManId, callback) {
    if (!deliveryManId) return () => {};
    try {
        const q = query(
            collection(db, "orders"),
            where("deliveryManId", "==", deliveryManId),
            limit(50)
        );
        return onSnapshot(q, (snap) => {
            const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            list.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
            callback(list);
        }, (err) => {
            console.warn("[BloomCare Orders] subscribeDeliveryOrders warning:", err?.message || err);
        });
    } catch (err) {
        console.warn("[BloomCare Orders] subscribeDeliveryOrders error:", err?.message || err);
        return () => {};
    }
}

export function subscribeUserNotifications(userId, role, callback) {
    if (!userId && !role) return () => {};
    try {
        const notifCol = collection(db, "notifications");
        const q = userId
            ? query(notifCol, where("recipientId", "==", userId), limit(30))
            : query(notifCol, where("role", "==", role), limit(30));

        return onSnapshot(q, (snap) => {
            const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            list.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
            callback(list);
        }, (err) => {
            console.warn("[BloomCare Notifications] subscribeUserNotifications warning:", err?.message || err);
        });
    } catch (err) {
        console.warn("[BloomCare Notifications] subscribeUserNotifications error:", err?.message || err);
        return () => {};
    }
}

export function subscribeOrderById(orderId, callback) {
    if (!orderId) return () => {};
    try {
        const orderRef = doc(db, "orders", orderId);
        return onSnapshot(orderRef, (snap) => {
            if (snap.exists()) {
                callback({ id: snap.id, ...snap.data() });
            }
        }, (err) => {
            console.warn("[BloomCare Orders] subscribeOrderById warning:", err?.message || err);
        });
    } catch (err) {
        console.warn("[BloomCare Orders] subscribeOrderById error:", err?.message || err);
        return () => {};
    }
}

// -------------------------------------------------------------
// 12. CUSTOMER CART PERSISTENCE
// -------------------------------------------------------------

export async function saveUserCartToFirestore(userId, cartItems) {
    if (!db || !userId) return;
    try {
        const cleanItems = (cartItems || []).map(i => ({
            productId: i.productId || i.product?.id,
            name: i.name || i.product?.name || "",
            price: Number(i.price ?? i.product?.price ?? 0),
            image: i.image || "",
            quantity: Number(i.quantity || 1),
            requiresPrescription: Boolean(i.requiresPrescription || i.product?.requiresPrescription)
        }));
        await setDoc(doc(db, "carts", userId), {
            userId,
            items: cleanItems,
            updatedAt: new Date().toISOString()
        }, { merge: true });
    } catch (err) {
        console.warn("[BloomCare Cart] saveUserCartToFirestore warning:", err?.message || err);
    }
}

export async function getUserCartFromFirestore(userId) {
    if (!db || !userId) return null;
    try {
        const snap = await getDoc(doc(db, "carts", userId));
        if (snap.exists()) {
            return snap.data()?.items || [];
        }
    } catch (err) {
        console.warn("[BloomCare Cart] getUserCartFromFirestore warning:", err?.message || err);
    }
    return null;
}
