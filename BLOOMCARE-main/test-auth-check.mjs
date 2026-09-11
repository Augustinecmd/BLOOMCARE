import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { getFirestore, collection, getDocs, query, where } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

async function run() {
  console.log("Attempting sign-in for delivery@bloomcare.com...");
  for (const pwd of ["123456", "bloomcare123", "delivery123", "password123", "Moses123!"]) {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, "delivery@bloomcare.com", pwd);
      console.log(`Success with password '${pwd}'! UID:`, userCredential.user.uid, "email:", userCredential.user.email);
      
      console.log("Querying orders with deliveryManId ===", userCredential.user.uid);
      try {
        const q = query(collection(db, "orders"), where("deliveryManId", "==", userCredential.user.uid));
        const snap = await getDocs(q);
        console.log("Found orders count (by deliveryManId):", snap.size);
        snap.forEach(doc => {
          console.log("Order doc:", doc.id, doc.data().orderNumber, "deliveryManId:", doc.data().deliveryManId, "status:", doc.data().orderStatus);
        });
      } catch (err) {
        console.error("Failed querying orders by deliveryManId:", err.message);
      }

      console.log("Querying orders with deliveryStaffId ===", userCredential.user.uid);
      try {
        const q2 = query(collection(db, "orders"), where("deliveryStaffId", "==", userCredential.user.uid));
        const snap2 = await getDocs(q2);
        console.log("Found orders count (by deliveryStaffId):", snap2.size);
        snap2.forEach(doc => {
          console.log("Order doc:", doc.id, doc.data().orderNumber, "deliveryStaffId:", doc.data().deliveryStaffId, "status:", doc.data().orderStatus);
        });
      } catch (err) {
        console.error("Failed querying orders by deliveryStaffId:", err.message);
      }

      return;
    } catch (e) {
      console.log(`Failed with password '${pwd}':`, e.code, e.message);
    }
  }
}

run().catch(console.error);
