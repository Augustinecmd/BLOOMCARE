const $ = (selector) => document.querySelector(selector);
const notice = $("#notice");
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
  dashContent.innerHTML = pageShell("DAILY HEALTH", "How are you feeling today?", "A brief record can help you and your care team spot changes over time.", `<form id="checkin-form" class="profile-form"><div class="two-col"><label>Weight (kg)<input id="weight" type="number" min="20" max="300" step="0.1" placeholder="Optional" /></label><label>Temperature (C)<input id="temperature" type="number" min="30" max="45" step="0.1" placeholder="Optional" /></label></div><div class="two-col"><label>Blood pressure - top number<input id="systolic" type="number" min="40" max="250" placeholder="Optional" /></label><label>Blood pressure - bottom number<input id="diastolic" type="number" min="30" max="180" placeholder="Optional" /></label></div><label>How is your general wellbeing?<select id="wellbeing" required><option value="">Select an option</option><option>Feeling well</option><option>A little uncomfortable</option><option>Not feeling well</option></select></label><label>Symptoms today <span class="optional">Optional</span><textarea id="symptoms" placeholder="For example, nausea, headache, or other changes you want to record"></textarea></label><label class="check"><input id="medication" type="checkbox" /> I took my prescribed medication or supplement as instructed.</label><p class="privacy-note">Recorded information does not replace professional assessment. For heavy bleeding, severe pain, fainting, trouble breathing, or another urgent concern, seek urgent professional care.</p><div class="workflow-actions"><button class="secondary-button" type="button" data-route="dashboard">Cancel</button><button class="primary-button" type="submit">Save today's check-in</button></div></form>`);
  setActiveNav("checkin");
}

function showAppointments() {
  dashContent.innerHTML = pageShell("YOUR CARE PLAN", "Appointments", "Keep planned visits together so you can prepare questions for your care team.", `<div class="workflow-card"><div class="appointment-list"><div class="appointment-item"><span class="calendar-square">24<small>AUG</small></span><div><strong>First antenatal visit</strong><p>10:30 AM &middot; Kampala Women's Health Centre</p></div><span class="status">Upcoming</span></div></div><hr><h3>Prepare for your visit</h3><p class="muted">Write down changes you have noticed, any medicines or supplements you take, and questions you want to ask.</p><button class="primary-button" type="button" data-action="appointment">Request an appointment</button></div>`);
  setActiveNav("appointments");
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

function saveCheckin(form) {
  const record = { date: new Date().toISOString(), weight: $("#weight").value, temperature: $("#temperature").value, systolic: $("#systolic").value, diastolic: $("#diastolic").value, wellbeing: $("#wellbeing").value, symptoms: $("#symptoms").value.trim() };
  updateActiveAccount({ records: [record, ...getRecords()] });
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

$("#register-form").addEventListener("submit", (event) => {
  event.preventDefault();
  if (!event.currentTarget.checkValidity()) return event.currentTarget.reportValidity();
  const name = $("#register-name").value.trim();
  const email = normaliseEmail($("#register-email").value);
  const password = event.currentTarget.querySelector('input[type="password"]').value;
  const accounts = getAccounts();
  if (accounts[email]) return openNotice("Account already exists", "Please sign in with this email address instead.");
  accounts[email] = { name, email, password, profile: null, records: [] };
  saveAccounts(accounts);
  localStorage.setItem(SESSION_KEY, email);
  showProfileEditor();
});
$("#login-form").addEventListener("submit", (event) => {
  event.preventDefault();
  if (!event.currentTarget.checkValidity()) return event.currentTarget.reportValidity();
  const email = normaliseEmail($("#login-email").value);
  const password = $("#login-password").value;
  const account = getAccounts()[email];
  if (!account) return openNotice("Sign-in failed", "The email address or password is incorrect.");
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
  updateActiveAccount({ profile: { lmp: $("#lmp").value, edd: $("#edd").value } });
  showView("dashboard-view"); showHome();
});
$("#logout").addEventListener("click", () => { localStorage.removeItem(SESSION_KEY); showView("auth-view"); });

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
  if (action === "emergency") openNotice("Seek urgent professional care", "For severe pain, heavy bleeding, fainting, difficulty breathing, or any urgent concern, contact your healthcare provider, local emergency services, or your selected healthcare facility now. BloomCare cannot assess emergencies.");
  if (action === "appointment") openNotice("Appointment request", "This demo records the appointment workflow. In the production system, your request will be sent securely to your selected healthcare facility for confirmation.");
});
document.addEventListener("submit", (event) => { if (event.target.id === "checkin-form") { event.preventDefault(); if (event.target.checkValidity()) saveCheckin(event.target); else event.target.reportValidity(); } });

migrateLegacyData();
if (getActiveEmail() && getProfile()) { setUserName(); updatePregnancySummary(); }
