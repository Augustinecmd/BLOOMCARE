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
  dashContent.innerHTML = pageShell("YOUR CARE PLAN", "Appointments", "Keep planned visits together so you can prepare questions for your care team.", `<div class="workflow-card"><div class="appointment-list"><div class="appointment-item"><span class="calendar-square">24<small>AUG</small></span><div><strong>First antenatal visit</strong><p>10:30 AM &middot; Kampala Women's Health Centre</p></div><span class="status">Upcoming</span></div></div><hr><h3>Request a new appointment</h3><p class="muted">Choose a preferred date and tell the facility what you need help with.</p><form id="appointment-request-form"><label>Preferred appointment date<input id="appointment-date" type="date" required /></label><label>Healthcare facility<select id="appointment-facility" required><option value="">Select a facility</option><option>Kampala Women's Health Centre</option><option>Mulago National Referral Hospital</option><option>Other facility</option></select></label><label>Reason for visit<textarea id="appointment-reason" placeholder="Describe what you would like to discuss" required></textarea></label>${requestStatus}<button class="primary-button" type="button" data-action="appointment">Continue to payment: UGX 20,000 <span aria-hidden="true">&rarr;</span></button></form></div>`);
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
    if (profile.emergencyContact) setDoc(doc(db, "emergencyContacts", `${auth.currentUser.uid}_primary`), { patientUid: auth.currentUser.uid, name: profile.emergencyContact, phone: profile.emergencyContact, isPrimary: true, updatedAt: serverTimestamp(), createdAt: serverTimestamp() }, { merge: true }).catch((error) => openNotice("Contact saved locally", `Firebase could not save the emergency contact yet: ${firebaseErrorMessage(error)}`));
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
