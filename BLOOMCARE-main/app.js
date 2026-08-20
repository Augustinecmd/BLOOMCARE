import {
  signUpUser,
  signInUser,
  signOutUser,
  subscribeAuthState,
  saveUserProfile,
  getUserProfile,
  saveHealthRecord,
  getHealthRecords,
  saveAppointmentRequest
} from "./firebase.js";

const $ = (selector) => document.querySelector(selector);
const notice = $("#notice");
const paymentDialog = $("#payment-dialog");
const dashContent = $(".dash-content");
const dashboardHome = dashContent.innerHTML;

let currentUser = null;
let currentProfile = null;
let currentRecords = [];

function showView(id) {
  ["auth-view", "profile-view", "dashboard-view"].forEach((view) =>
    $("#" + view).classList.toggle("hidden", view !== id)
  );
}

function openNotice(title, message) {
  $("#notice-title").textContent = title;
  $("#notice-text").textContent = message;
  notice.showModal();
}

const ACCOUNTS_KEY = "bloomcareAccounts";
const SESSION_KEY = "bloomcareSession";

function getAccounts() {
  return JSON.parse(localStorage.getItem(ACCOUNTS_KEY) || "{}");
}
function saveAccounts(accounts) {
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
}
function normaliseEmail(email) {
  return email.trim().toLowerCase();
}
function getActiveEmail() {
  return localStorage.getItem(SESSION_KEY);
}
function getActiveAccount() {
  return currentUser || getAccounts()[getActiveEmail()] || null;
}
function getUser() {
  return currentUser || getActiveAccount();
}
function getProfile() {
  return currentProfile || getActiveAccount()?.profile || null;
}
function getRecords() {
  return currentRecords.length ? currentRecords : (getActiveAccount()?.records || []);
}

function updateActiveAccount(update) {
  const email = currentUser?.email || getActiveEmail();
  const accounts = getAccounts();
  if (email) {
    accounts[email] = { ...(accounts[email] || {}), ...update };
    saveAccounts(accounts);
  }
  if (update.profile) currentProfile = update.profile;
  if (update.records) currentRecords = update.records;
}

function formatDate(value) {
  if (!value) return "--";
  const parsed = new Date(value.includes("T") ? value : value + "T00:00:00");
  if (isNaN(parsed.getTime())) return "--";
  return new Intl.DateTimeFormat("en", { day: "numeric", month: "long", year: "numeric" }).format(parsed);
}

function calculateDueDate(lmp) {
  if (!lmp) return "";
  const date = new Date(lmp.includes("T") ? lmp : lmp + "T00:00:00");
  if (isNaN(date.getTime())) return "";
  date.setDate(date.getDate() + 280);
  return date.toISOString().slice(0, 10);
}

function getFormattedToday() {
  const now = new Date();
  return new Intl.DateTimeFormat("en-US", { weekday: "long", day: "numeric", month: "long" }).format(now).toUpperCase();
}

function updatePregnancySummary() {
  const profile = getProfile();
  if (!profile || !profile.lmp || !$("#week-number")) return;
  const lmp = new Date(profile.lmp.includes("T") ? profile.lmp : profile.lmp + "T00:00:00");
  if (isNaN(lmp.getTime())) return;
  const weeks = Math.max(1, Math.min(40, Math.floor((Date.now() - lmp.getTime()) / 604800000)));
  const progress = Math.round((weeks / 40) * 100);
  $("#week-number").textContent = weeks;
  $("#progress-value").textContent = progress + "%";
  $("#progress-bar").style.width = progress + "%";
  $("#due-date").textContent = formatDate(profile.edd || calculateDueDate(profile.lmp));
}

function setUserName() {
  const user = getUser();
  if (!user) return;
  const displayName = user.name || user.displayName || user.email.split("@")[0];
  const name = displayName.split(" ")[0];
  if ($("#patient-name")) $("#patient-name").textContent = name;
}

function showHome() {
  dashContent.innerHTML = dashboardHome;
  setUserName();
  updatePregnancySummary();

  const dateEl = dashContent.querySelector(".dash-header .eyebrow");
  if (dateEl) dateEl.textContent = getFormattedToday();

  const records = getRecords();
  const latest = records[0];
  if (latest) {
    const checkinP = dashContent.querySelector(".record p");
    if (checkinP) checkinP.textContent = "Recorded today";
    const quickCheckBtn = dashContent.querySelector("#quick-check");
    if (quickCheckBtn) quickCheckBtn.textContent = "Update";
  }

  const bpRecord = records.find((r) => r.systolic && r.diastolic);
  const bpRecordDiv = dashContent.querySelectorAll(".record")[1];
  if (bpRecordDiv) {
    const bpP = bpRecordDiv.querySelector("p");
    const bpStatus = bpRecordDiv.querySelector(".status");
    if (bpRecord) {
      if (bpP) bpP.textContent = `Last recorded: ${bpRecord.systolic} / ${bpRecord.diastolic} mmHg`;
      if (bpStatus) {
        bpStatus.textContent = "Recorded";
        bpStatus.className = "status";
      }
    } else {
      if (bpP) bpP.textContent = "Not yet recorded";
      if (bpStatus) {
        bpStatus.textContent = "Pending";
        bpStatus.className = "status muted-status";
      }
    }
  }

  setActiveNav("dashboard");
}

function setActiveNav(page) {
  document.querySelectorAll(".sidebar nav a").forEach((link) =>
    link.classList.toggle("active", link.getAttribute("href") === "#" + page)
  );
}

function pageShell(eyebrow, title, description, body) {
  return `<header class="dash-header"><div><p class="eyebrow teal">${eyebrow}</p><h1>${title}</h1><p class="muted page-description">${description}</p></div><button class="emergency-button" type="button" data-action="emergency">Emergency support</button></header><section class="workflow-page">${body}</section>`;
}

function showCheckin() {
  dashContent.innerHTML = pageShell("DAILY HEALTH", "How are you feeling today?", "A brief record can help you and your care team spot changes over time.", `<form id="checkin-form" class="profile-form"><div class="two-col"><label>Weight (kg)<input id="weight" type="number" min="20" max="300" step="0.1" placeholder="Optional" /></label><label>Temperature (C)<input id="temperature" type="number" min="30" max="45" step="0.1" placeholder="Optional" /></label></div><div class="two-col"><label>Blood pressure - top number<input id="systolic" type="number" min="40" max="250" placeholder="Optional" /></label><label>Blood pressure - bottom number<input id="diastolic" type="number" min="30" max="180" placeholder="Optional" /></label></div><label>How is your general wellbeing?<select id="wellbeing" required><option value="">Select an option</option><option>Feeling well</option><option>A little uncomfortable</option><option>Not feeling well</option></select></label><label>Symptoms today <span class="optional">Optional</span><textarea id="symptoms" placeholder="For example, nausea, headache, or other changes you want to record"></textarea></label><label class="check"><input id="medication" type="checkbox" /> I took my prescribed medication or supplement as instructed.</label><p class="privacy-note">Recorded information does not replace professional assessment. For heavy bleeding, severe pain, fainting, trouble breathing, or another urgent concern, seek urgent professional care.</p><div class="workflow-actions"><button class="secondary-button" type="button" data-route="dashboard">Cancel</button><button class="primary-button" type="submit">Save today's check-in</button></div></form>`);
  setActiveNav("checkin");
}

function showAppointments() {
  dashContent.innerHTML = pageShell("YOUR CARE PLAN", "Appointments", "Keep planned visits together so you can prepare questions for your care team.", `<div class="workflow-card"><div class="appointment-list"><div class="appointment-item"><span class="calendar-square">24<small>AUG</small></span><div><strong>First antenatal visit</strong><p>10:30 AM &middot; Kampala Women's Health Centre</p></div><span class="status">Upcoming</span></div></div><hr><h3>Prepare for your visit</h3><p class="muted">Write down changes you have noticed, any medicines or supplements you take, and questions you want to ask.</p><button class="primary-button" type="button" data-action="appointment">Request an appointment</button></div>`);
  setActiveNav("appointments");
}

function showAppointmentPayment() {
  $("#payment-confirmation").checked = false;
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
  $(".topbar p").innerHTML = profile ? "Your pregnancy profile" : "Step <strong>1 of 1</strong> &middot; Your pregnancy profile";
  $(".profile-wrap .eyebrow").textContent = profile ? "YOUR CARE PROFILE" : "LET'S PERSONALISE YOUR CARE";
  $(".profile-wrap h1").textContent = profile ? "Keep your details current" : "Tell us about this pregnancy";
}

async function saveCheckin(form) {
  const record = {
    date: new Date().toISOString(),
    weight: $("#weight").value,
    temperature: $("#temperature").value,
    systolic: $("#systolic").value,
    diastolic: $("#diastolic").value,
    wellbeing: $("#wellbeing").value,
    symptoms: $("#symptoms").value.trim(),
    medication: $("#medication").checked
  };

  const updatedRecords = [record, ...getRecords()];
  updateActiveAccount({ records: updatedRecords });

  if (currentUser?.uid) {
    try {
      await saveHealthRecord(currentUser.uid, record);
    } catch (e) {
      console.warn("Firestore record save fallback:", e);
    }
  }

  showHome();
  const urgentWords = /heavy bleeding|severe pain|faint|difficulty breathing|trouble breathing/i;
  if (urgentWords.test(record.symptoms)) {
    openNotice("Seek urgent professional care", "Your symptom entry may need urgent attention. Contact your healthcare provider, local emergency services, or your selected healthcare facility now. BloomCare cannot assess emergencies.");
  } else {
    openNotice("Check-in saved", "Your daily health record has been saved. Discuss any changes or concerns with your healthcare provider.");
  }
}

// UI Event Listeners
document.querySelectorAll("[data-show]").forEach((button) =>
  button.addEventListener("click", () => {
    $("#login-card").classList.toggle("hidden", button.dataset.show !== "login-card");
    $("#register-card").classList.toggle("hidden", button.dataset.show !== "register-card");
  })
);

document.querySelectorAll("[data-message]").forEach((button) =>
  button.addEventListener("click", () => openNotice("Password reset", button.dataset.message))
);

$("#close-notice").addEventListener("click", () => notice.close());
$("#close-payment").addEventListener("click", () => paymentDialog.close());

$("#payment-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!event.currentTarget.checkValidity()) return event.currentTarget.reportValidity();
  paymentDialog.close();

  const reqData = { fee: 20000, currency: "UGX", status: "payment-confirmed", requestedAt: new Date().toISOString() };
  updateActiveAccount({ appointmentRequest: reqData });

  if (currentUser?.uid) {
    try {
      await saveAppointmentRequest(currentUser.uid, reqData);
    } catch (e) {
      console.warn("Firestore appointment save fallback:", e);
    }
  }

  openNotice("Appointment request submitted", "Your UGX 20,000 appointment fee has been confirmed. The healthcare facility can now review your request and confirm the visit.");
});

// Firebase Auth & Database Forms Integration
$("#register-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!event.currentTarget.checkValidity()) return event.currentTarget.reportValidity();
  const name = $("#register-name").value.trim();
  const email = normaliseEmail($("#register-email").value);
  const password = event.currentTarget.querySelector('input[type="password"]').value;

  try {
    const user = await signUpUser(email, password, name);
    currentUser = { uid: user.uid, email: user.email, name: name || user.email.split("@")[0] };
    localStorage.setItem(SESSION_KEY, email);
    showProfileEditor();
  } catch (error) {
    if (error.code === "auth/email-already-in-use" || (error.message && error.message.includes("email-already-in-use"))) {
      $("#login-email").value = email;
      $("#login-card").classList.remove("hidden");
      $("#register-card").classList.add("hidden");
      openNotice("Email Already Registered", "An account with this email address already exists. We've switched you to the Login screen—please enter your password to sign in.");
    } else {
      openNotice("Registration error", error.message || "Failed to create account.");
    }
  }
});

$("#login-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!event.currentTarget.checkValidity()) return event.currentTarget.reportValidity();
  const email = normaliseEmail($("#login-email").value);
  const password = $("#login-password").value;

  try {
    const user = await signInUser(email, password);
    currentUser = { uid: user.uid, email: user.email, name: user.displayName || email.split("@")[0] };
    localStorage.setItem(SESSION_KEY, email);

    // Sync profile and records from Firestore
    try {
      currentProfile = await getUserProfile(user.uid);
      currentRecords = await getHealthRecords(user.uid);
    } catch (e) {
      console.warn("Firestore sync fallback:", e);
    }

    if (getProfile()) {
      showView("dashboard-view");
      showHome();
    } else {
      showProfileEditor();
    }
  } catch (error) {
    openNotice("Sign-in failed", error.message || "The email address or password is incorrect.");
  }
});

$("#lmp").addEventListener("change", (event) => {
  if (event.target.value) $("#edd").value = calculateDueDate(event.target.value);
});

$("#profile-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!event.currentTarget.checkValidity()) return event.currentTarget.reportValidity();
  const profileData = { lmp: $("#lmp").value, edd: $("#edd").value };
  updateActiveAccount({ profile: profileData });

  if (currentUser?.uid) {
    try {
      await saveUserProfile(currentUser.uid, profileData);
    } catch (e) {
      console.warn("Firestore profile save fallback:", e);
    }
  }

  showView("dashboard-view");
  showHome();
});

$("#logout").addEventListener("click", async () => {
  try {
    await signOutUser();
  } catch (e) {
    console.warn("Sign out fallback:", e);
  }
  currentUser = null;
  currentProfile = null;
  currentRecords = [];
  localStorage.removeItem(SESSION_KEY);
  showView("auth-view");
});

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
  if (action === "emergency")
    openNotice("Seek urgent professional care", "For severe pain, heavy bleeding, fainting, difficulty breathing, or any urgent concern, contact your healthcare provider, local emergency services, or your selected healthcare facility now. BloomCare cannot assess emergencies.");
  if (action === "appointment") showAppointmentPayment();
});

document.addEventListener("submit", (event) => {
  if (event.target.id === "checkin-form") {
    event.preventDefault();
    if (event.target.checkValidity()) saveCheckin(event.target);
    else event.target.reportValidity();
  }
});

// Subscribe to Firebase Auth State changes
subscribeAuthState(async (user) => {
  if (user) {
    currentUser = { uid: user.uid, email: user.email, name: user.displayName || user.email.split("@")[0] };
    localStorage.setItem(SESSION_KEY, user.email);
    try {
      currentProfile = await getUserProfile(user.uid);
      currentRecords = await getHealthRecords(user.uid);
    } catch (e) {
      console.warn("Firestore initial load fallback:", e);
    }
    if (getProfile()) {
      showView("dashboard-view");
      showHome();
    } else {
      showProfileEditor();
    }
  } else {
    currentUser = null;
    currentProfile = null;
    currentRecords = [];
    if (!getActiveEmail()) {
      showView("auth-view");
    }
  }
});
