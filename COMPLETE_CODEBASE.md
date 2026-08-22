# Complete BloomCare Codebase Consolidation

**Generated:** August 21, 2026
**Projects:** Early Pregnancy Monitoring (BloomCare), Pharmacy Management System
**Technologies:** JavaScript (Frontend), Python (Backend), Firebase, React

---

## TABLE OF CONTENTS

1. [BloomCare Frontend - Root](#bloomcare-frontend-root)
2. [BloomCare Frontend - BLOOMCARE-main](#bloomcare-frontend-bloomcare-main)
3. [BloomCare Backend - Payment API](#bloomcare-backend-payment-api)
4. [Pharmacy Management - Backend](#pharmacy-management-backend)
5. [Firebase Configuration &amp; Security](#firebase-configuration--security)
6. [Database Seeding Scripts](#database-seeding-scripts)

---

## BLOOMCARE FRONTEND - ROOT

### firebase-config.js

```javascript
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
  appId: "1:265627798177:web:9282dd5c65f96e75fefee0",
  measurementId: "G-SQJT4E2Y39"
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
```

### app.js (Main Application Logic)

```javascript
import { auth, db, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, doc, setDoc, serverTimestamp } from "./firebase-config.js";

const $ = (selector) => document.querySelector(selector);
const notice = $("#notice");
const paymentDialog = $("#payment-dialog");
const logoutDialog = $("#logout-dialog");
const dashContent = $(".dash-content");
const dashboardHome = dashContent.innerHTML;

function showView(id) {
  ["auth-view", "profile-view", "dashboard-view"].forEach((view) => $("#" + view).classList.toggle("hidden", view !== id));
}

function openNotice(title, message) {
  $("#notice-title").textContent = title;
  $("#notice-text").textContent = message;
  notice.showModal();
}

const ACCOUNTS_KEY = "bloomcareAccounts";
const SESSION_KEY = "bloomcareSession";
const PAYMENT_API = "http://127.0.0.1:8787";
let pendingPayment = null;

function firebaseErrorMessage(error) {
  const messages = {
    "auth/email-already-in-use": "An account with this email already exists.",
    "auth/invalid-credential": "The email address or password is incorrect.",
    "auth/weak-password": "Use a stronger password with at least 8 characters.",
    "auth/operation-not-allowed": "Email and password sign-in is not enabled in Firebase Authentication yet."
  };
  return messages[error.code] || error.message || "Firebase request failed.";
}

function getAccounts() { return JSON.parse(localStorage.getItem(ACCOUNTS_KEY) || "{}"); }
function saveAccounts(accounts) { localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts)); }
function normaliseEmail(email) { return email.trim().toLowerCase(); }
function getActiveEmail() { return localStorage.getItem(SESSION_KEY); }
function getActiveAccount() { return getAccounts()[getActiveEmail()] || null; }
function getUser() { return getActiveAccount(); }
function getProfile() { return getActiveAccount()?.profile || null; }
function getRecords() { return getActiveAccount()?.records || []; }

function updateActiveAccount(update) {
  const email = getActiveEmail();
  const accounts = getAccounts();
  if (!email || !accounts[email]) return false;
  accounts[email] = { ...accounts[email], ...update };
  saveAccounts(accounts);
  return true;
}

function migrateLegacyData() {
  const accounts = getAccounts();
  const legacyUser = JSON.parse(localStorage.getItem("bloomcareUser") || "null");
  if (Object.keys(accounts).length || !legacyUser?.email) return;
  const email = normaliseEmail(legacyUser.email);
  accounts[email] = {
    name: legacyUser.name || "Client",
    email,
    password: "",
    profile: JSON.parse(localStorage.getItem("bloomcareProfile") || "null"),
    records: JSON.parse(localStorage.getItem("bloomcareRecords") || "[]")
  };
  saveAccounts(accounts);
  localStorage.setItem(SESSION_KEY, email);
}

function formatDate(value) {
  return new Intl.DateTimeFormat("en", { day: "numeric", month: "long", year: "numeric" }).format(new Date(value + "T00:00:00"));
}

function calculateDueDate(lmp) {
  const date = new Date(lmp + "T00:00:00");
  date.setDate(date.getDate() + 280);
  return date.toISOString().slice(0, 10);
}

function updatePregnancySummary() {
  const profile = getProfile();
  if (!profile || !$("#week-number")) return;
  const lmp = new Date(profile.lmp + "T00:00:00");
  const weeks = Math.max(1, Math.min(40, Math.floor((Date.now() - lmp.getTime()) / 604800000)));
  const progress = Math.round((weeks / 40) * 100);
  $("#week-number").textContent = weeks;
  $("#progress-value").textContent = progress + "%";
  $("#progress-bar").style.width = progress + "%";
  $("#due-date").textContent = formatDate(profile.edd);
}

function setUserName() {
  const user = getUser();
  if (!user) return;
  const name = user.name.split(" ")[0];
  if ($("#patient-name")) $("#patient-name").textContent = name;
}

function showHome() {
  dashContent.innerHTML = dashboardHome;
  setUserName();
  updatePregnancySummary();
  const latest = getRecords()[0];
  if (latest) {
    dashContent.querySelector(".record strong").textContent = "Daily check-in";
    dashContent.querySelector(".record p").textContent = "Recorded today";
    dashContent.querySelector("#quick-check").textContent = "Update";
  }
  setActiveNav("dashboard");
}

function setActiveNav(page) {
  document.querySelectorAll(".sidebar nav a").forEach((link) => link.classList.toggle("active", link.getAttribute("href") === "#" + page));
}

function pageShell(eyebrow, title, description, body) {
  return `<header class="dash-header"><div><p class="eyebrow teal">${eyebrow}</p><h1>${title}</h1><p class="muted page-description">${description}</p></div><button class="emergency-button" type="button" data-action="emergency">Emergency support</button></header><section class="workflow-page">${body}</section>`;
}

function showCheckin() {
  dashContent.innerHTML = pageShell("DAILY HEALTH", "How are you feeling today?", "A brief record can help you and your care team spot changes over time.", `<form id="checkin-form" class="profile-form"><div class="two-col"><label>Weight (kg)<input id="weight" type="number" min="20" max="300" step="0.1" placeholder="Optional" /></label><label>Temperature (C)<input id="temperature" type="number" min="30" max="45" step="0.1" placeholder="Optional" /></label></div><div class="two-col"><label>Blood pressure - top number<input id="systolic" type="number" min="40" max="250" placeholder="Optional" /></label><label>Blood pressure - bottom number<input id="diastolic" type="number" min="30" max="180" placeholder="Optional" /></label></div><label>How is your general wellbeing?<select id="wellbeing" required><option value="">Select an option</option><option>Feeling well</option><option>A little uncomfortable</option><option>Not feeling well</option></select></label><label>Symptoms today <span class="optional">Optional</span><textarea id="symptoms" placeholder="For example, nausea, headache, or other changes you want to record"></textarea></label><label>Additional comments <span class="optional">Optional</span><textarea id="comments" placeholder="Share anything else you would like your care team to know"></textarea></label><label class="check"><input id="medication" type="checkbox" /> I took my prescribed medication or supplement as instructed.</label><p class="privacy-note">Recorded information does not replace professional assessment. For heavy bleeding, severe pain, fainting, trouble breathing, or another urgent concern, seek urgent professional care.</p><div class="workflow-actions"><button class="secondary-button" type="button" data-route="dashboard">Cancel</button><button class="primary-button" type="submit">Save today's check-in</button></div></form>`);
  setActiveNav("checkin");
}

function showAppointments() {
  const request = getActiveAccount()?.appointmentRequest;
  const requestStatus = request ? `<p class="request-status"><strong>Request status:</strong> ${request.status}</p>` : "";
  dashContent.innerHTML = pageShell("YOUR CARE PLAN", "Appointments", "Keep planned visits together so you can prepare questions for your care team.", `<div class="workflow-card"><div class="appointment-list"><div class="appointment-item"><span class="calendar-square">24<small>AUG</small></span><div><strong>First antenatal visit</strong><p>10:30 AM · Kampala Women's Health Centre</p></div><span class="status">Upcoming</span></div></div><hr><h3>Request a new appointment</h3><p class="muted">Choose a preferred date and tell the facility what you need help with.</p><form id="appointment-request-form"><label>Preferred appointment date<input id="appointment-date" type="date" required /></label><label>Healthcare facility<select id="appointment-facility" required><option value="">Select a facility</option><option>Kampala Women's Health Centre</option><option>Mulago National Referral Hospital</option><option>Other facility</option></select></label><label>Reason for visit<textarea id="appointment-reason" placeholder="Describe what you would like to discuss" required></textarea></label>${requestStatus}<button class="primary-button" type="button" data-action="appointment">Continue to payment: UGX 20,000 <span aria-hidden="true">→</span></button></form></div>`);
  $("#appointment-date").min = new Date().toISOString().slice(0, 10);
  setActiveNav("appointments");
}

function showAppointmentPayment() {
  const form = $("#appointment-request-form");
  if (!form.checkValidity()) return form.reportValidity();
  $("#payment-form").reset();
  $("#payment-reference").classList.add("hidden");
  $("#payment-instructions").textContent = "A secure payment prompt will be sent after you start payment.";
  $("#start-payment").classList.remove("hidden");
  $("#verify-payment").classList.add("hidden");
  paymentDialog.showModal();
}

function showEducation() {
  dashContent.innerHTML = pageShell("WEEK BY WEEK", "Learn about week 8", "Educational information to help you prepare for conversations with a qualified healthcare professional.", `<div class="education-grid"><article class="workflow-card"><p class="eyebrow teal">COMMON CHANGES</p><h3>Your body this week</h3><p>Fatigue, nausea, breast tenderness, and changes in appetite can happen in early pregnancy. Each pregnancy is different.</p></article><article class="workflow-card"><p class="eyebrow teal">CARE TIP</p><h3>Questions for your provider</h3><p>Ask which supplements are appropriate for you, when to schedule your first visit, and which symptoms need a call.</p></article><article class="workflow-card warning-card"><p class="eyebrow">WHEN TO SEEK HELP</p><h3>Do not wait with urgent symptoms</h3><p>Seek urgent medical attention or contact your healthcare provider for severe pain, heavy bleeding, fainting, or breathing difficulties.</p><button class="text-button" type="button" data-action="emergency">Open emergency support</button></article></div>`);
  setActiveNav("education");
}

function showProfileEditor() {
  const profile = getProfile();
  showView("profile-view");
  $("#lmp").value = profile ? profile.lmp : "";
  $("#edd").value = profile ? profile.edd : "";
  $(".topbar p").innerHTML = "Your pregnancy profile";
  $(".profile-wrap .eyebrow").textContent = "YOUR CARE PROFILE";
  $(".profile-wrap h1").textContent = "Keep your details current";
}

async function saveCheckin(form) {
  const record = { date: new Date().toISOString(), weight: $("#weight").value, temperature: $("#temperature").value, systolic: $("#systolic").value, diastolic: $("#diastolic").value, wellbeing: $("#wellbeing").value, symptoms: $("#symptoms").value.trim(), comments: $("#comments").value.trim() };
  updateActiveAccount({ records: [record, ...getRecords()] });
  if (auth.currentUser) {
    const pregnancyId = `${auth.currentUser.uid}_current`;
    const checkinId = `checkin-${Date.now()}`;
    const shared = { patientUid: auth.currentUser.uid, pregnancyId, recordedAt: serverTimestamp(), createdByUid: auth.currentUser.uid };
    await setDoc(doc(db, "pregnancies", pregnancyId, "measurements", checkinId), { ...shared, weightKg: record.weight ? Number(record.weight) : null, temperatureC: record.temperature ? Number(record.temperature) : null, systolicBp: record.systolic ? Number(record.systolic) : null, diastolicBp: record.diastolic ? Number(record.diastolic) : null, wellbeing: record.wellbeing, notes: record.symptoms, comments: record.comments });
    if (record.symptoms) await setDoc(doc(db, "pregnancies", pregnancyId, "symptoms", checkinId), { ...shared, type: "patient-reported", severity: record.wellbeing, notes: record.symptoms, requiresReview: /heavy bleeding|severe pain|faint|difficulty breathing|trouble breathing/i.test(record.symptoms) });
  }
  showHome();
  const urgentWords = /heavy bleeding|severe pain|faint|difficulty breathing|trouble breathing/i;
  if (urgentWords.test(record.symptoms)) openNotice("Seek urgent professional care", "Your symptom entry may need urgent attention. Contact your healthcare provider, local emergency services, or your selected healthcare facility now. BloomCare cannot assess emergencies.");
  else openNotice("Check-in saved", "Your daily health record has been saved. Discuss any changes or concerns with your healthcare provider.");
}

// Event Listeners
document.querySelectorAll("[data-show]").forEach((button) => button.addEventListener("click", () => {
  $("#login-card").classList.toggle("hidden", button.dataset.show !== "login-card");
  $("#register-card").classList.toggle("hidden", button.dataset.show !== "register-card");
}));

document.querySelectorAll("[data-message]").forEach((button) => button.addEventListener("click", () => openNotice("Password reset", button.dataset.message)));

$("#close-notice").addEventListener("click", () => notice.close());
$("#close-payment").addEventListener("click", () => paymentDialog.close());

$("#payment-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!event.currentTarget.checkValidity()) return event.currentTarget.reportValidity();
  const button = $("#start-payment");
  button.disabled = true;
  try {
    const response = await fetch(`${PAYMENT_API}/api/payments/initialize`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ provider: $("#payment-provider").value, phone: $("#payment-phone").value.trim(), appointment: { date: $("#appointment-date").value, facility: $("#appointment-facility").value, reason: $("#appointment-reason").value.trim() } }) });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Payment could not be started.");
    pendingPayment = result;
    $("#payment-reference").textContent = `Payment reference: ${result.reference}`;
    $("#payment-reference").classList.remove("hidden");
    $("#payment-instructions").textContent = `${result.message} Click Verify payment after the provider confirms the transaction.`;
    button.classList.add("hidden");
    $("#verify-payment").classList.remove("hidden");
  } catch (error) {
    openNotice("Payment service unavailable", `${error.message} Start the payment API before trying again.`);
  } finally {
    button.disabled = false;
  }
});

$("#verify-payment").addEventListener("click", async () => {
  if (!pendingPayment) return;
  try {
    const response = await fetch(`${PAYMENT_API}/api/payments/verify`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ reference: pendingPayment.reference }) });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Payment verification failed.");
    paymentDialog.close();
    const appointmentRequest = { date: $("#appointment-date").value, facility: $("#appointment-facility").value, reason: $("#appointment-reason").value.trim(), fee: result.receipt.amount, currency: result.receipt.currency, provider: result.receipt.provider, status: "Pending", paymentStatus: result.receipt.status, paymentReference: result.receipt.reference, receiptNumber: result.receipt.receiptNumber, requestedAt: new Date().toISOString() };
    updateActiveAccount({ appointmentRequest });
    if (auth.currentUser) {
      const pregnancyId = `${auth.currentUser.uid}_current`;
      await setDoc(doc(db, "pregnancies", pregnancyId, "appointments", result.receipt.reference), { ...appointmentRequest, patientUid: auth.currentUser.uid, pregnancyId, status: "pending_facility_confirmation", feeMinorUnits: result.receipt.amount, paymentId: result.receipt.reference, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
    }
    openNotice("Payment verified", `Receipt ${result.receipt.receiptNumber} issued for UGX 20,000 via ${result.receipt.provider}. Your appointment request is now pending facility confirmation.`);
  } catch (error) {
    openNotice("Payment verification failed", error.message);
  }
});

$("#register-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!event.currentTarget.checkValidity()) return event.currentTarget.reportValidity();
  const name = $("#register-name").value.trim();
  const email = normaliseEmail($("#register-email").value);
  const password = event.currentTarget.querySelector('input[type="password"]').value;
  const phone = event.currentTarget.querySelector('input[type="tel"]').value.trim();
  const dateOfBirth = event.currentTarget.querySelector('input[type="date"]').value;
  let firebaseCreated = false;
  let firebaseUser = null;
  try {
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    firebaseCreated = true;
    firebaseUser = credential.user;
  } catch (error) {
    if (error.code === "auth/email-already-in-use") {
      $("#login-card").classList.remove("hidden");
      $("#register-card").classList.add("hidden");
      $("#login-email").value = email;
      return openNotice("Account already exists", "This email is already registered. Sign in with your existing password to continue.");
    }
    if (error.code !== "auth/operation-not-allowed") return openNotice("Account creation failed", firebaseErrorMessage(error));
  }
  if (firebaseUser) {
    try {
      await setDoc(doc(db, "users", firebaseUser.uid), { role: "patient", fullName: name, email, phone, dateOfBirth, consentedAt: serverTimestamp(), consentVersion: "v1", createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
    } catch (error) {
      openNotice("Account created", `Your account is ready, but your profile database is not available yet. You can continue in demo mode. Firebase says: ${firebaseErrorMessage(error)}`);
    }
  }
  const accounts = getAccounts();
  if (accounts[email] && !firebaseCreated) return openNotice("Account already exists", "Please sign in with this email address instead.");
  accounts[email] = { ...(accounts[email] || {}), name, email, password, phone, dateOfBirth, profile: accounts[email]?.profile || null, records: accounts[email]?.records || [] };
  saveAccounts(accounts);
  localStorage.setItem(SESSION_KEY, email);
  showProfileEditor();
});

$("#login-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!event.currentTarget.checkValidity()) return event.currentTarget.reportValidity();
  const email = normaliseEmail($("#login-email").value);
  const password = $("#login-password").value;
  try {
    await signInWithEmailAndPassword(auth, email, password);
  } catch (error) {
    if (error.code !== "auth/operation-not-allowed") return openNotice("Sign-in failed", firebaseErrorMessage(error));
  }
  const account = getAccounts()[email] || (auth.currentUser ? { name: auth.currentUser.displayName || email.split("@")[0], email, password, profile: null, records: [] } : null);
  if (!account) return openNotice("Sign-in failed", "The email address or password is incorrect.");
  if (!getAccounts()[email]) {
    const accounts = getAccounts();
    accounts[email] = account;
    saveAccounts(accounts);
  }
  if (!account.password) {
    const accounts = getAccounts();
    accounts[email] = { ...account, password };
    saveAccounts(accounts);
  } else if (account.password !== password) return openNotice("Sign-in failed", "The email address or password is incorrect.");
  localStorage.setItem(SESSION_KEY, email);
  account.profile ? (showView("dashboard-view"), showHome()) : showProfileEditor();
});

$("#lmp").addEventListener("change", (event) => { if (event.target.value) $("#edd").value = calculateDueDate(event.target.value); });

$("#profile-form").addEventListener("submit", (event) => {
  event.preventDefault();
  if (!event.currentTarget.checkValidity()) return event.currentTarget.reportValidity();
  const profile = { lmp: $("#lmp").value, edd: $("#edd").value, previousPregnancies: $("#previous-pregnancies").value, medicalHistory: $("#medical-history").value.trim(), allergies: "", emergencyContact: $("#emergency-contact").value.trim() };
  updateActiveAccount({ profile });
  if (auth.currentUser) {
    const pregnancyId = `${auth.currentUser.uid}_current`;
    setDoc(doc(db, "pregnancies", pregnancyId), { patientUid: auth.currentUser.uid, lmpDate: profile.lmp, estimatedDueDate: profile.edd, previousPregnancies: Number(profile.previousPregnancies), medicalHistory: profile.medicalHistory, allergies: profile.allergies, status: "active", updatedAt: serverTimestamp(), createdAt: serverTimestamp() }, { merge: true }).catch((error) => openNotice("Profile saved locally", `Firebase could not save this profile yet: ${firebaseErrorMessage(error)}`));
    if (profile.emergencyContact) setDoc(doc(db, "pregnancies", pregnancyId, "emergencyContacts", `${auth.currentUser.uid}_primary`), { patientUid: auth.currentUser.uid, name: profile.emergencyContact, phone: profile.emergencyContact, isPrimary: true, updatedAt: serverTimestamp(), createdAt: serverTimestamp() }, { merge: true }).catch((error) => openNotice("Contact saved locally", `Firebase could not save the emergency contact yet: ${firebaseErrorMessage(error)}`));
  }
  showView("dashboard-view"); showHome();
});

async function logOut() { localStorage.removeItem(SESSION_KEY); await signOut(auth).catch(() => {}); showView("auth-view"); }
function requestLogout() { logoutDialog.showModal(); }

$("#logout").addEventListener("click", requestLogout);
$("#confirm-logout").addEventListener("click", async () => { logoutDialog.close(); await logOut(); });
$("#close-logout").addEventListener("click", () => logoutDialog.close());
$("#cancel-logout").addEventListener("click", () => logoutDialog.close());

document.addEventListener("click", (event) => {
  if (event.target.closest("#check-in, #quick-check")) {
    event.preventDefault();
    showCheckin();
    return;
  }
  if (event.target.closest(".next-card .secondary-button")) {
    event.preventDefault();
    showAppointments();
    return;
  }
  if (event.target.closest(".learn-panel .text-button")) {
    event.preventDefault();
    showEducation();
    return;
  }
  const route = event.target.closest("[data-route], .sidebar nav a");
  if (route) {
    event.preventDefault();
    const page = route.dataset.route || route.getAttribute("href").slice(1);
    if (page === "dashboard") showHome();
    if (page === "checkin") showCheckin();
    if (page === "appointments") showAppointments();
    if (page === "education") showEducation();
    if (page === "profile") showProfileEditor();
  }
  const action = event.target.closest("[data-action]")?.dataset.action;
  if (action === "logout") requestLogout();
  if (action === "emergency") openNotice("Seek urgent professional care", "For severe pain, heavy bleeding, fainting, difficulty breathing, or any urgent concern, contact your healthcare provider, local emergency services, or your selected healthcare facility now. BloomCare cannot assess emergencies.");
  if (action === "appointment") showAppointmentPayment();
});

document.addEventListener("submit", (event) => { if (event.target.id === "checkin-form") { event.preventDefault(); if (event.target.checkValidity()) saveCheckin(event.target); else event.target.reportValidity(); } });

migrateLegacyData();
onAuthStateChanged(auth, (user) => {
  if (!user) return;
  localStorage.setItem(SESSION_KEY, user.email || "");
  if (getProfile()) { showView("dashboard-view"); setUserName(); updatePregnancySummary(); }
});
if (getActiveEmail() && getProfile()) { showView("dashboard-view"); setUserName(); updatePregnancySummary(); }
```

### styles.css (Root Version)

```css
:root{
--ink:#173f3d;
--teal:#147a73;
--teal-dark:#0d625d;
--pale:#e7f4ef;
--mint:#c9eadc;
--cream:#f8faf8;
--warm:#fffaf2;
--line:#dce7e2;
--muted:#607774;
--danger:#9c3d35;
--shadow:0 18px 45px rgba(22,60,56,.08)
}
*{
box-sizing:border-box
}
body{
margin:0;
color:var(--ink);
background:var(--cream);
font-family:"DM Sans",Arial,sans-serif;
font-size:15px
}
button,input,textarea,select{
font:inherit
}
.hidden{
display:none!important
}
.app-shell{
min-height:100vh
}
.auth-layout{
min-height:100vh;
display:grid;
grid-template-columns:minmax(350px,43%) 1fr
}
.brand-panel{
position:relative;
overflow:hidden;
background:var(--ink);
color:#fff;
padding:42px clamp(36px,6vw,98px);
display:flex;
flex-direction:column;
min-height:100vh
}
.brand-panel:after{
content:"";
position:absolute;
width:340px;
height:340px;
right:-150px;
bottom:-120px;
border:52px solid rgba(173,218,200,.14);
border-radius:50%
}
.brand{
position:relative;
z-index:1;
color:inherit;
text-decoration:none;
font-weight:700;
font-size:20px;
display:flex;
align-items:center;
gap:9px
}
.brand-mark{
position:relative;
display:inline-grid;
place-items:center;
width:38px;
height:38px;
border-radius:52% 48% 58% 42%;
background:#c9eadc;
color:var(--ink);
font-family:"Libre Baskerville",serif;
font-size:21px;
font-weight:700;
box-shadow:0 8px 18px rgba(0,0,0,.12)
}
.brand-mark:before{
content:"";
position:absolute;
width:13px;
height:7px;
right:5px;
top:5px;
border:2px solid var(--teal);
border-bottom:0;
border-radius:100% 100% 0 100%;
transform:rotate(-30deg)
}
.brand-mark:after{
content:"";
position:absolute;
width:2px;
height:9px;
right:10px;
top:12px;
background:var(--teal);
transform:rotate(28deg);
border-radius:2px
}
.brand-panel .brand-mark{
width:52px;
height:52px;
border-radius:52% 48% 58% 42%;
font-size:27px
}
.brand-status{
font-size:10px;
font-weight:600;
color:#b7d8cc;
border-left:1px solid #5a827b;
padding-left:10px;
text-transform:uppercase;
letter-spacing:.7px
}
.brand-logo-link{
gap:10px;
flex-direction:column;
align-items:flex-start
}
.brand-logo{
display:block;
width:250px;
height:auto
}
.brand-logo-link .brand-status{
margin-left:0
}
.brand-copy{
position:relative;
z-index:1;
margin:auto 0
}
.eyebrow{
color:#a8d7c7;
font-size:10px;
font-weight:700;
letter-spacing:1.3px;
margin:0 0 12px
}
.teal{
color:var(--teal)
}
h1,h2,h3,p{
margin-top:0
}
h1,h2{
font-family:"Libre Baskerville",Georgia,serif
}
h1{
font-size:clamp(34px,4vw,54px);
line-height:1.16
}
.brand-copy p:not(.eyebrow){
max-width:390px;
color:#d3e5de;
font-size:17px;
line-height:1.65
}
.brand-foot{
position:relative;
z-index:1;
max-width:380px;
color:#a7c1b9;
font-size:12px;
line-height:1.6
}
.auth-content{
display:grid;
place-items:center;
padding:52px 28px;
background:#fcfdfc
}
.auth-card{
width:min(472px,100%)
}
.auth-card h2{
font-size:30px;
margin-bottom:10px;
line-height:1.28
}
.muted{
color:var(--muted);
line-height:1.55
}
form{
margin-top:30px;
display:grid;
gap:18px
}
label{
display:grid;
gap:7px;
color:#385653;
font-size:13px;
```

---

## BLOOMCARE FRONTEND - BLOOMCARE-MAIN

### firebase.js (Alternative Firebase Configuration)

```javascript
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

// Your web app's Firebase configuration (bloomcare-72986 project)
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

// Firestore Database Helpers

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
```

---

## BLOOMCARE BACKEND - PAYMENT API

### payment_api.py

```python
"""Demo payment API for BloomCare appointment fees.

This module models the server boundary needed for MTN MoMo/Airtel Money.
Replace the demo provider adapter with authenticated provider API calls before
using it with real money or patient data.
"""
from __future__ import annotations

import json
import secrets
import threading
from datetime import datetime, timezone
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlparse

HOST = "127.0.0.1"
PORT = 8787
AMOUNT = 20000
CURRENCY = "UGX"
DATA_FILE = Path(__file__).parent / "data" / "payments.json"
LOCK = threading.Lock()


def read_payments() -> dict:
    if not DATA_FILE.exists():
        return {}
    try:
        return json.loads(DATA_FILE.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        return {}


def write_payments(payments: dict) -> None:
    DATA_FILE.parent.mkdir(parents=True, exist_ok=True)
    DATA_FILE.write_text(json.dumps(payments, indent=2), encoding="utf-8")


def response_payload(handler: BaseHTTPRequestHandler, status: int, payload: dict) -> None:
    body = json.dumps(payload).encode("utf-8")
    handler.send_response(status)
    handler.send_header("Content-Type", "application/json")
    handler.send_header("Access-Control-Allow-Origin", "*")
    handler.send_header("Access-Control-Allow-Headers", "Content-Type")
    handler.send_header("Access-Control-Allow-Methods", "POST, OPTIONS")
    handler.send_header("Content-Length", str(len(body)))
    handler.end_headers()
    handler.wfile.write(body)


class PaymentHandler(BaseHTTPRequestHandler):
    def log_message(self, format: str, *args: object) -> None:
        print(format % args)

    def do_OPTIONS(self) -> None:
        response_payload(self, 204, {})

    def do_GET(self) -> None:
        path = urlparse(self.path).path
        if path in {"/", "/health"}:
            response_payload(self, 200, {"service": "BloomCare payment API", "status": "ok"})
            return
        response_payload(self, 404, {"error": "Payment endpoint not found."})

    def do_POST(self) -> None:
        path = urlparse(self.path).path
        try:
            length = int(self.headers.get("Content-Length", "0"))
            payload = json.loads(self.rfile.read(length) or b"{}")
        except (ValueError, json.JSONDecodeError):
            response_payload(self, 400, {"error": "Request body must be valid JSON."})
            return

        if path == "/api/payments/initialize":
            self.initialize(payload)
        elif path == "/api/payments/verify":
            self.verify(payload)
        else:
            response_payload(self, 404, {"error": "Payment endpoint not found."})

    def initialize(self, payload: dict) -> None:
        provider = payload.get("provider")
        phone = str(payload.get("phone", "")).strip()
        if provider not in {"MTN MoMo", "Airtel Money"}:
            response_payload(self, 400, {"error": "Choose MTN MoMo or Airtel Money."})
            return
        if not phone:
            response_payload(self, 400, {"error": "A mobile-money phone number is required."})
            return

        reference = f"BC-{datetime.now(timezone.utc):%Y%m%d}-{secrets.token_hex(4).upper()}"
        payment = {
            "reference": reference,
            "provider": provider,
            "phone": phone,
            "amount": AMOUNT,
            "currency": CURRENCY,
            "status": "pending",
            "createdAt": datetime.now(timezone.utc).isoformat(),
            "appointment": payload.get("appointment", {}),
        }
        with LOCK:
            payments = read_payments()
            payments[reference] = payment
            write_payments(payments)
        response_payload(self, 201, {
            "reference": reference,
            "amount": AMOUNT,
            "currency": CURRENCY,
            "provider": provider,
            "status": "pending",
            "message": f"A payment prompt would be sent to {phone} through {provider} in production.",
        })

    def verify(self, payload: dict) -> None:
        reference = str(payload.get("reference", "")).strip()
        with LOCK:
            payments = read_payments()
            payment = payments.get(reference)
            if not payment:
                response_payload(self, 404, {"error": "Payment reference not found."})
                return
            # Demo adapter: production code must ask the provider for this status.
            payment["status"] = "paid"
            payment["verifiedAt"] = datetime.now(timezone.utc).isoformat()
            payments[reference] = payment
            write_payments(payments)
        response_payload(self, 200, {"payment": payment, "receipt": {
            "receiptNumber": f"RCP-{reference[3:]}",
            "reference": reference,
            "amount": AMOUNT,
            "currency": CURRENCY,
            "provider": payment["provider"],
            "status": "paid",
            "issuedAt": payment["verifiedAt"],
        }})


if __name__ == "__main__":
    print(f"BloomCare payment API listening on http://{HOST}:{PORT}")
    ThreadingHTTPServer((HOST, PORT), PaymentHandler).serve_forever()
```

---

## PHARMACY MANAGEMENT - BACKEND

### pyproject.toml

```toml
[project]
name = "pharmacy-management-api"
version = "0.1.0"
description = "FastAPI backend for a pharmacy management system"
requires-python = ">=3.12"
dependencies = [
  "alembic>=1.14,<2",
  "fastapi>=0.115,<1",
  "passlib[argon2]>=1.7,<2",
  "psycopg[binary]>=3.2,<4",
  "pydantic-settings>=2.6,<3",
  "pyjwt>=2.10,<3",
  "sqlalchemy>=2.0,<3",
  "uvicorn[standard]>=0.32,<1"
]

[project.optional-dependencies]
ml = [
  "numpy>=2.1,<3",
  "pandas>=2.2,<3",
  "scikit-learn>=1.5,<2"
]
dev = [
  "httpx>=0.28,<1",
  "pytest>=8.3,<9",
  "pytest-asyncio>=0.24,<1",
  "ruff>=0.8,<1"
]

[tool.pytest.ini_options]
testpaths = ["tests"]

[tool.ruff]
line-length = 100
target-version = "py312"
```

---

## FIREBASE CONFIGURATION & SECURITY

### firestore.rules

```firestore-rules
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    function signedIn() {
      return request.auth != null;
    }

    function isSelf(uid) {
      return signedIn() && request.auth.uid == uid;
    }

    function hasRole(role) {
      return signedIn() && request.auth.token.role == role;
    }

    function isAdmin() {
      return hasRole('admin');
    }

    function isProvider() {
      return hasRole('provider');
    }

    function assignedToPatient(patientUid) {
      return isProvider() && exists(
        /databases/$(database)/documents/providerPatientAssignments/$(request.auth.uid + '_' + patientUid)
      );
    }

    match /users/{uid} {
      allow create: if isSelf(uid)
        && request.resource.data.role == 'patient';
      allow read: if isSelf(uid) || isAdmin();
      allow update: if isSelf(uid)
        && request.resource.data.role == resource.data.role
        && request.resource.data.email == resource.data.email;
      allow delete: if isAdmin();
    }

    match /pregnancies/{pregnancyId} {
      allow create: if signedIn()
        && request.resource.data.patientUid == request.auth.uid;
      allow read: if signedIn()
        && (resource.data.patientUid == request.auth.uid
          || assignedToPatient(resource.data.patientUid)
          || isAdmin());
      allow update: if signedIn()
        && (resource.data.patientUid == request.auth.uid
          || isAdmin());
      allow delete: if isAdmin();

      match /measurements/{measurementId} {
        allow create: if signedIn()
          && request.resource.data.patientUid == request.auth.uid
          && request.resource.data.pregnancyId == pregnancyId;
        allow read: if signedIn()
          && (resource.data.patientUid == request.auth.uid
            || assignedToPatient(resource.data.patientUid)
            || isAdmin());
        allow update, delete: if isSelf(resource.data.patientUid) || isAdmin();
      }

      match /symptoms/{symptomId} {
        allow create: if signedIn()
          && request.resource.data.patientUid == request.auth.uid
          && request.resource.data.pregnancyId == pregnancyId;
        allow read: if signedIn()
          && (resource.data.patientUid == request.auth.uid
            || assignedToPatient(resource.data.patientUid)
            || isAdmin());
        allow update, delete: if isSelf(resource.data.patientUid) || isAdmin();
      }

      match /medications/{medicationId} {
        allow create: if signedIn()
          && request.resource.data.patientUid == request.auth.uid
          && request.resource.data.pregnancyId == pregnancyId;
        allow read: if signedIn()
          && (resource.data.patientUid == request.auth.uid
            || assignedToPatient(resource.data.patientUid)
            || isAdmin());
        allow update, delete: if isSelf(resource.data.patientUid) || isAdmin();
      }

      match /appointments/{appointmentId} {
        allow create: if signedIn()
          && request.resource.data.patientUid == request.auth.uid
          && request.resource.data.pregnancyId == pregnancyId
          && request.resource.data.status == 'pending_facility_confirmation'
          && request.resource.data.paymentStatus == 'paid'
          && request.resource.data.feeMinorUnits == 20000;
        allow read: if signedIn()
          && (resource.data.patientUid == request.auth.uid
            || assignedToPatient(resource.data.patientUid)
            || isAdmin());
        allow update: if isAdmin()
          || (isSelf(resource.data.patientUid)
            && request.resource.data.patientUid == resource.data.patientUid
            && request.resource.data.status == resource.data.status);
      }
    }
  }
}
```

---

## DATABASE SEEDING SCRIPTS

### scripts/seed-firestore.mjs

```javascript
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
```

---

## PROJECT SUMMARY

### Technology Stack

- **Frontend:** JavaScript (vanilla), HTML5, CSS3
- **Backend:** Python (FastAPI, SQLAlchemy)
- **Database:** Firebase Firestore, PostgreSQL
- **Authentication:** Firebase Authentication
- **Payment Integration:** MTN MoMo, Airtel Money (demo)
- **DevOps:** Docker Compose, Firebase Hosting
- **Testing:** pytest, Vitest
- **Code Quality:** Ruff (Python), ESLint

### Key Features

1. **Early Pregnancy Monitoring Dashboard** - Patient education, health check-ins, appointments
2. **Payment Processing** - Mobile money integration for appointment fees
3. **Healthcare Provider Integration** - Care plan management, provider-patient assignment
4. **Emergency Support** - Urgent care notifications and guidance
5. **Pharmacy Management System** - Backend API for pharmacy operations

### Database Collections

- `users` - Patient/provider accounts
- `pregnancies` - Pregnancy records
- `measurements` - Health measurements (weight, BP, temperature)
- `symptoms` - Patient-reported symptoms
- `medications` - Medication tracking
- `appointments` - Appointment requests and scheduling
- `emergencyContacts` - Emergency contact information
- `healthRecords` - General health records
- `profiles` - User profiles

---

**End of Consolidated Codebase**
