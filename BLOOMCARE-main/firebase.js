import { initializeApp } from "firebase/app";
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
    limit
} from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyDQrBYQdEYy7rDdIQTGd5i6gONKG-DACMM",
    authDomain: "bloomcare-ee449.firebaseapp.com",
    projectId: "bloomcare-ee449",
    storageBucket: "bloomcare-ee449.firebasestorage.app",
    messagingSenderId: "265627798177",
    appId: "1:265627798177:web:4158341a929ae11bfefee0",
    measurementId: "G-PRMLMH2X75"
};

// Initialize Firebase App, Auth, and Firestore
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
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
            address: "Plot 14, Kampala Road, Kampala, Uganda",
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
            address: "Plot 14, Kampala Road, Kampala, Uganda",
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
    const orderNumber = "BC-ORD-" + new Date().getFullYear() + "-" + Math.floor(100000 + Math.random() * 900000);
    const data = {
        orderNumber,
        customerId: orderData.customerId || "cust-guest",
        customerName: orderData.customerName || "Customer",
        customerPhone: orderData.customerPhone || "",
        customerEmail: orderData.customerEmail || "",
        deliveryAddress: orderData.deliveryAddress || "Kampala, Uganda",
        deliveryNotes: orderData.deliveryNotes || "",
        items: orderData.items || [],
        subtotal: Number(orderData.subtotal) || 0,
        deliveryFee: Number(orderData.deliveryFee) || 5000,
        total: Number(orderData.total) || 0,
        paymentMethod: orderData.paymentMethod || "MTN MoMo",
        paymentStatus: orderData.paymentStatus || "Pending",
        paymentReference: orderData.paymentReference || "MM-" + Date.now().toString().slice(-6),
        orderStatus: orderData.orderStatus || "Pending",
        prescriptionId: orderData.prescriptionId || null,
        deliveryStaffId: null,
        assignedStaff: "Pending Assignment",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    const docRef = await addDoc(collection(db, "orders"), data);
    return { id: docRef.id, ...data };
}

export async function getOrders(userId = null, role = "customer") {
    try {
        const ordersCol = collection(db, "orders");
        let q;
        if (role === "customer" && userId) {
            q = query(ordersCol, where("customerId", "==", userId));
        } else if (role === "deliveryStaff" && userId) {
            q = query(ordersCol, where("deliveryStaffId", "==", userId));
        } else {
            q = query(ordersCol);
        }
        const snap = await getDocs(q);
        return snap.docs
            .map(d => ({ id: d.id, ...d.data() }))
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } catch (e) {
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
        deliveryStaffId: deliveryData.deliveryStaffId || null,
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
        if (role === "deliveryStaff" && staffId) {
            q = query(delivCol, where("deliveryStaffId", "==", staffId));
        } else {
            q = query(delivCol);
        }
        const snap = await getDocs(q);
        return snap.docs.map(d => ({ id: d.id, ...d.data() }));
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
    await addDoc(collection(db, "notifications"), {
        userId: notif.userId || null,
        role: notif.role || "customer",
        title: notif.title,
        message: notif.message,
        type: notif.type || "info",
        read: false,
        createdAt: new Date().toISOString()
    });
}

export async function getNotifications(userId = null, role = "customer") {
    try {
        const snap = await getDocs(collection(db, "notifications"));
        return snap.docs
            .map(d => ({ id: d.id, ...d.data() }))
            .filter(n => !n.userId || n.userId === userId || n.role === role)
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } catch (e) {
        return [];
    }
}

export async function markNotificationRead(notifId) {
    await updateDoc(doc(db, "notifications", notifId), { read: true });
}
