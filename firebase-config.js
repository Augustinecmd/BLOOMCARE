import { initializeApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";
import { getAnalytics, isSupported as analyticsIsSupported } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-analytics.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";
import { getFirestore, doc, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDQrBYQdEYy7rDdIQTGd5i6gONKG-DACMM",
  authDomain: "bloomcare-ee449.firebaseapp.com",
  projectId: "bloomcare-ee449",
  storageBucket: "bloomcare-ee449.firebasestorage.app",
  messagingSenderId: "265627798177",
  appId: "1:265627798177:web:4158341a929ae11bfefee0",
  measurementId: "G-PRMLMH2X75"
};

const firebaseApp = initializeApp(firebaseConfig);
const auth = getAuth(firebaseApp);
const db = getFirestore(firebaseApp);

analyticsIsSupported().then((supported) => {
  if (supported) getAnalytics(firebaseApp);
}).catch(() => {});

export {
  auth,
  db,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  doc,
  setDoc,
  serverTimestamp
};
