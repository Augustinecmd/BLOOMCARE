import {
  signUpUser,
  signInUser,
  signOutUser,
  subscribeAuthState,
  saveUserProfile,
  getUserProfile,
  saveHealthRecord,
  getHealthRecords,
  requestPasswordReset,
  getClientProfile,
  updateClientProfile,
  getSystemSettings,
  auth
} from "./firebase.js";
import { createWhatsAppUrl, getConfiguredWhatsAppNumber } from "./whatsapp.js";
import { calculatePregnancyStatus, calculateEddFromLmp, isValidLmp } from "./pregnancy-calculations.js";

const $ = (selector) => document.querySelector(selector);
const notice = $("#notice");
const paymentDialog = $("#payment-dialog");
const dashContent = $(".dash-content");
const dashboardHome = dashContent.innerHTML;
const PAYMENT_API = "http://127.0.0.1:8787";
let pendingPayment = null;

const authWhatsApp = document.querySelector(".brand-panel");
if (authWhatsApp && !authWhatsApp.querySelector("[data-whatsapp]")) {
  authWhatsApp.insertAdjacentHTML("beforeend", '<a class="secondary-button whatsapp-button auth-whatsapp" data-whatsapp href="#">Chat with us on WhatsApp</a>');
}

let currentUser = null;
let currentProfile = null;
let currentRecords = [];
let currentAppointment = null;
let systemSettings = {};
let authTransition = 0;
let registrationInProgress = false;
const AUTH_SESSION_KEY = "bloomcare-authenticated";
const AUTH_SESSION_VERSION = "2";
const RESET_SESSION_REQUESTED = new URLSearchParams(window.location.search).has("reset-session");

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

const TERMS_OF_USE = "BloomCare Pharmacy Terms and Conditions govern the use of the BloomCare Pharmacy Management System and its related services, including medicine information, prescription management, medicine ordering, stock management, payments, customer support, and other pharmacy services. By creating an account, placing an order, or using the system, users agree to provide accurate and up-to-date personal, contact, prescription, and order information and to use the platform responsibly and lawfully. Prescription medicines will only be dispensed where appropriate prescription and professional requirements have been satisfied, and BloomCare reserves the right to verify, reject, delay, or cancel orders where safety, legal, regulatory, stock, or prescription requirements are not met. Medicine availability, prices, quantities, substitutions, payments, deliveries, cancellations, and refunds are subject to BloomCare's applicable procedures and confirmation. Customers are responsible for using medicines according to instructions provided by qualified healthcare professionals and should seek professional medical assistance for diagnosis, treatment, emergencies, adverse reactions, or other medical concerns, as information provided through BloomCare does not replace professional healthcare. BloomCare will take reasonable measures to protect customer accounts, personal information, prescriptions, health-related information, and transaction records and will process such information only for legitimate service, healthcare, business, legal, or regulatory purposes in accordance with applicable privacy and data-protection requirements. Users are responsible for keeping their login credentials secure and must not attempt unauthorized access, submit fraudulent information, manipulate prescriptions or orders, misuse medicines or the system, or interfere with BloomCare's security and operations. BloomCare may temporarily suspend services for maintenance, security, upgrades, or circumstances beyond its reasonable control and may suspend or terminate accounts involved in fraud, abuse, unauthorized activities, or violations of these terms. BloomCare may also update its services, prices, policies, and Terms and Conditions when necessary and will communicate significant changes appropriately. By continuing to use BloomCare, users acknowledge that they have read, understood, and agreed to these Terms and Conditions and the BloomCare Privacy Policy.";
const PRIVACY_POLICY = "BloomCare collects and uses your account, contact, health, appointment, and payment information to provide and improve care-related services, process requests, support your account, and meet legal and regulatory obligations. We limit access to authorised personnel and retain information only as long as needed for legitimate service or legal purposes. You may request information about your data, ask for corrections, or withdraw consent where applicable. BloomCare does not replace professional medical advice or emergency services.";

function normaliseEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function registrationErrorMessage(code) {
  const messages = {
    "auth/email-already-in-use": "An account with this email already exists. Please sign in or use another email.",
    "auth/invalid-email": "Please enter a valid email address.",
    "auth/weak-password": "Your password is too weak. Please use a stronger password.",
    "auth/network-request-failed": "Network error. Please check your internet connection and try again.",
    "auth/too-many-requests": "Too many attempts. Please wait a moment and try again.",
    "auth/operation-not-allowed": "Email/password registration is currently unavailable. Please contact BloomCare support.",
    "auth/user-disabled": "This account has been disabled. Please contact BloomCare support.",
    "firestore/profile-creation-failed": "Your account was created, but we could not save your profile. Please complete it from your dashboard."
  };
  return messages[code] || "Registration could not be completed. Please try again.";
}
function getActiveEmail() {
  return currentUser?.email || "";
}
function getActiveAccount() {
  return currentUser ? { ...currentUser, appointmentRequest: currentAppointment } : null;
}
function getUser() {
  return currentUser;
}
function getProfile() {
  return currentProfile || getActiveAccount()?.profile || null;
}
function getRecords() {
  return currentRecords.length ? currentRecords : (getActiveAccount()?.records || []);
}

function getWhatsAppUrl(phone) {
  return createWhatsAppUrl(phone || getConfiguredWhatsAppNumber(systemSettings));
}

function openWhatsApp(phone) {
  const url = getWhatsAppUrl(phone);
  if (url) window.open(url, "_blank", "noopener,noreferrer");
}

getSystemSettings().then((settings) => {
  systemSettings = settings;
  const chatButton = document.querySelector("[data-whatsapp]");
  if (chatButton && !chatButton.dataset.customer) chatButton.href = getWhatsAppUrl();
}).catch(() => {});

function updateActiveAccount(update) {
  if (update.profile) currentProfile = update.profile;
  if (update.records) currentRecords = update.records;
  if (update.appointmentRequest) currentAppointment = update.appointmentRequest;
}

function validUgandanPhone(value) {
  const phone = String(value || "").trim().replace(/\s/g, "");
  if (/^\+2567\d{8}$/.test(phone)) return `0${phone.slice(4)}`;
  return /^07\d{8}$/.test(phone) ? phone : null;
}

function formatDate(value) {
  if (!value) return "--";
  const parsed = new Date(value.includes("T") ? value : value + "T00:00:00");
  if (isNaN(parsed.getTime())) return "--";
  return new Intl.DateTimeFormat("en", { day: "numeric", month: "long", year: "numeric" }).format(parsed);
}

function calculateDueDate(lmp) {
  return calculateEddFromLmp(lmp);
}

function getFormattedToday() {
  const now = new Date();
  return new Intl.DateTimeFormat("en-US", { weekday: "long", day: "numeric", month: "long" }).format(now).toUpperCase();
}

function updatePregnancySummary() {
  const profile = getProfile();
  if (!$("#week-number")) return;
  const status = calculatePregnancyStatus(profile || {});
  const weekNumber = $("#week-number");
  const progressValue = $("#progress-value");
  const progressBar = $("#progress-bar");
  const dueDate = $("#due-date");
  const weekDetail = $("#week-detail");
  if (!status.complete) {
    weekNumber.textContent = "Pregnancy information not completed";
    weekNumber.parentElement.classList.add("pregnancy-empty");
    progressValue.textContent = "--";
    progressBar.style.width = "0%";
    dueDate.textContent = "--";
    if (weekDetail) weekDetail.innerHTML = '<a href="#profile" data-route="profile">Complete Pregnancy Profile <span aria-hidden="true">&rarr;</span></a>';
    return;
  }
  weekNumber.parentElement.classList.remove("pregnancy-empty");
  weekNumber.textContent = `${status.weeks} weeks, ${status.days} days`;
  progressValue.textContent = status.progress + "%";
  progressBar.style.width = status.progress + "%";
  dueDate.textContent = formatDate(status.edd);
  if (weekDetail) weekDetail.textContent = `Trimester ${status.trimester} · ${status.daysRemaining} days remaining`;
}

function setUserName() {
  const user = getUser();
  if (!user) return;
  const displayName = `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.displayName || user.email.split("@")[0];
  const name = displayName.split(" ")[0];
  if ($("#patient-name")) $("#patient-name").textContent = name;
}

function showHome() {
  dashContent.innerHTML = dashboardHome;
  const header = dashContent.querySelector(".dash-header");
  if (header) {
    header.querySelector(".header-actions")?.remove();
    header.querySelector('[data-action="logout"]')?.remove();
    header.querySelector("[data-whatsapp]")?.remove();
  }
  const sidebar = document.querySelector("#dashboard-view .sidebar");
  const sidebarLogout = sidebar?.querySelector("#logout");
  if (sidebar && sidebarLogout && !sidebar.querySelector(".sidebar-actions")) {
    const sidebarActions = document.createElement("div");
    sidebarActions.className = "sidebar-actions";
    sidebarActions.innerHTML = '<a class="whatsapp-button" data-whatsapp href="#"><span aria-hidden="true">◉</span> Chat with us on WhatsApp</a>';
    sidebarLogout.dataset.action = "logout";
    sidebarLogout.innerHTML = '<span aria-hidden="true">↪</span> Sign out';
    sidebar.insertBefore(sidebarActions, sidebarLogout);
    sidebarActions.appendChild(sidebarLogout);
  }
  setUserName();
  updatePregnancySummary();
  const chatButton = dashContent.querySelector("[data-whatsapp]");
  if (chatButton) chatButton.href = getWhatsAppUrl();

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
  dashContent.innerHTML = pageShell("DAILY HEALTH", "How are you feeling today?", "Answer a few simple questions. You can leave measurements blank if you do not have them.", `<form id="checkin-form" class="profile-form checkin-form"><fieldset class="question-group"><legend>How is your general wellbeing?</legend><p class="question-help">Choose the answer that feels closest today.</p><div class="choice-grid"><label class="choice-card"><input id="wellbeing" name="wellbeing" type="radio" value="Feeling well" required /><span>Feeling well</span><small>I feel okay today</small></label><label class="choice-card"><input name="wellbeing" type="radio" value="A little uncomfortable" /><span>A little uncomfortable</span><small>Some changes or discomfort</small></label><label class="choice-card"><input name="wellbeing" type="radio" value="Not feeling well" /><span>Not feeling well</span><small>I need extra support</small></label></div></fieldset><fieldset class="question-group"><legend>Are you noticing any symptoms?</legend><p class="question-help">Tell us anything you would like your care team to know.</p><label class="field-label">Symptoms <span class="optional">Optional</span><textarea id="symptoms" placeholder="For example: nausea, headache, pain, or bleeding"></textarea></label></fieldset><fieldset class="question-group optional-group"><legend>Do you have today's measurements?</legend><p class="question-help">These are optional. Add them if you have checked them today.</p><div class="two-col"><label>Weight (kg)<input id="weight" type="number" min="20" max="300" step="0.1" placeholder="Optional" /></label><label>Temperature (C)<input id="temperature" type="number" min="30" max="45" step="0.1" placeholder="Optional" /></label></div><div class="two-col"><label>Blood pressure - top number<input id="systolic" type="number" min="40" max="250" placeholder="Optional" /></label><label>Blood pressure - bottom number<input id="diastolic" type="number" min="30" max="180" placeholder="Optional" /></label></div></fieldset><label class="check medication-check"><input id="medication" type="checkbox" /> I took my prescribed medication or supplement today.</label><p class="privacy-note">This check-in does not diagnose or replace professional care. For heavy bleeding, severe pain, fainting, trouble breathing, or another urgent concern, seek urgent help.</p><div class="workflow-actions"><button class="secondary-button" type="button" data-route="dashboard">Cancel</button><button class="primary-button" type="submit">Save today's check-in <span aria-hidden="true">&rarr;</span></button></div></form>`);
  setActiveNav("checkin");
}

function showAppointments() {
  const appointment = getActiveAccount()?.appointmentRequest;
  const confirmed = appointment?.appointmentStatus === "CONFIRMED";
  const upcoming = confirmed ? `<div class="appointment-item"><span class="calendar-square">${new Date(appointment.date + "T00:00:00").getDate()}<small>${new Intl.DateTimeFormat("en", { month: "short" }).format(new Date(appointment.date + "T00:00:00")).toUpperCase()}</small></span><div><strong>${appointment.service}</strong><p>${appointment.time} &middot; ${appointment.provider} · ${appointment.facility}</p><p>Reference: ${appointment.reference}</p></div><span class="status">Confirmed</span></div><p class="muted">Payment: PAID · Receipt ${appointment.receiptNumber}</p><button class="text-button" type="button" data-action="receipt">View payment receipt</button><hr>` : "";
  dashContent.innerHTML = pageShell("YOUR CARE PLAN", "Appointments", "Appointments are confirmed only after server-side payment verification.", `<div class="workflow-card">${upcoming}<h3>Book an appointment</h3><form id="appointment-request-form"><div class="two-col"><label>Service<select id="appointment-service" required><option value="">Select service</option><option value="Pregnancy Consultation">Pregnancy Consultation — UGX 20,000</option><option value="Follow-up Consultation">Follow-up Consultation — UGX 15,000</option></select></label><label>Healthcare provider<select id="appointment-provider" required><option value="">Select provider</option><option>Dr. Amina Nanyonga</option><option>Dr. Sarah Namusoke</option></select></label></div><div class="two-col"><label>Date<input id="appointment-date" type="date" required /></label><label>Available time<select id="appointment-time" required><option value="">Select time</option><option>09:00 AM</option><option>10:00 AM</option><option>11:30 AM</option><option>02:00 PM</option></select></label></div><label>Facility<select id="appointment-facility" required><option value="">Select facility</option><option>Kampala Women's Health Centre</option><option>Mulago National Referral Hospital</option></select></label><label>Reason for visit <span class="optional">Optional</span><textarea id="appointment-reason" placeholder="Anything the provider should know before your consultation"></textarea></label><button class="primary-button" type="button" data-action="appointment">Review appointment and payment <span aria-hidden="true">&rarr;</span></button></form></div>`);
  $("#appointment-date").min = new Date().toISOString().slice(0, 10);
  setActiveNav("appointments");
}

function showAppointmentPayment() {
  const appointmentForm = $("#appointment-request-form");
  if (!appointmentForm.checkValidity()) return appointmentForm.reportValidity();
  const service = $("#appointment-service").value;
  const fee = service === "Follow-up Consultation" ? 15000 : 20000;
  $("#payment-summary").innerHTML = `<strong>Appointment summary</strong><br>${$("#appointment-provider").value} · ${service}<br>${formatDate($("#appointment-date").value)} at ${$("#appointment-time").value}<br>Appointment fee: <strong>UGX ${fee.toLocaleString()}</strong><br>Additional charges: UGX 0<br>Total: <strong>UGX ${fee.toLocaleString()}</strong>`;
  $("#payment-form").reset();
  $("#payment-reference").classList.add("hidden");
  $("#payment-instructions").textContent = "The amount is calculated by the secure payment service. Do not make another payment while verification is processing.";
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
  $(".topbar p").innerHTML = profile ? "Your pregnancy profile" : "Step <strong>1 of 1</strong> &middot; Your pregnancy profile";
  $(".profile-wrap .eyebrow").textContent = profile ? "YOUR CARE PROFILE" : "LET'S PERSONALISE YOUR CARE";
  $(".profile-wrap h1").textContent = profile ? "Keep your details current" : "Tell us about this pregnancy";
  const existing = $(".client-account-summary");
  if (existing) existing.remove();
  const client = currentUser;
  if (client) {
    const customerWhatsApp = getWhatsAppUrl(client.phone);
    $(".profile-wrap").insertAdjacentHTML("afterbegin", `<section class="workflow-card client-account-summary"><p class="eyebrow teal">YOUR ACCOUNT</p><h3>${client.firstName || ""} ${client.lastName || ""}</h3><p class="muted">${client.email || ""}<br>${client.phone || ""}<br>${client.dateOfBirth ? formatDate(client.dateOfBirth) : ""}${client.gender ? ` · ${client.gender}` : ""}</p><div class="profile-actions"><button class="text-button profile-edit-button" type="button" data-action="edit-account"><span aria-hidden="true">✎</span> Edit account details</button>${customerWhatsApp ? `<a class="secondary-button whatsapp-button" href="${customerWhatsApp}" target="_blank" rel="noopener noreferrer">Chat on WhatsApp</a>` : ""}</div></section>`);
  }
}

function showClientAccountEditor() {
  const client = currentUser;
  dashContent.innerHTML = pageShell("YOUR ACCOUNT", "Profile details", "Update the contact information associated with your BloomCare account.", `<form id="client-profile-form" class="profile-form"><div class="two-col"><label>First name<input id="client-first-name" value="${client.firstName || ""}" required /></label><label>Last name<input id="client-last-name" value="${client.lastName || ""}" required /></label></div><div class="two-col"><label>Email address<input value="${client.email || ""}" readonly /></label><label>Phone number<input id="client-phone" value="${client.phone || ""}" required /></label></div><div class="two-col"><label>Date of birth<input id="client-date-of-birth" type="date" value="${client.dateOfBirth || ""}" required /></label><label>Gender<select id="client-gender"><option value="">Prefer not to say</option><option ${client.gender === "Female" ? "selected" : ""}>Female</option><option ${client.gender === "Male" ? "selected" : ""}>Male</option><option ${client.gender === "Non-binary" ? "selected" : ""}>Non-binary</option><option ${client.gender === "Prefer to self-describe" ? "selected" : ""}>Prefer to self-describe</option></select></label></div><div class="workflow-actions"><button class="secondary-button" type="button" data-route="dashboard">Cancel</button><button class="primary-button" type="submit">Save profile</button></div></form>`);
}

async function saveCheckin(form) {
  const record = {
    date: new Date().toISOString(),
    weight: $("#weight").value,
    temperature: $("#temperature").value,
    systolic: $("#systolic").value,
    diastolic: $("#diastolic").value,
    wellbeing: $('#checkin-form input[name="wellbeing"]:checked')?.value || "",
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

// The registration form is defined once in index.html. Delegation keeps both
// account-switch links working even if other UI content is rendered later.
document.addEventListener("click", (event) => {
  const button = event.target.closest("[data-show]");
  if (!button) return;
  event.preventDefault();
  $("#login-card").classList.toggle("hidden", button.dataset.show !== "login-card");
  $("#register-card").classList.toggle("hidden", button.dataset.show !== "register-card");
});

document.querySelectorAll("[data-message]").forEach((button) =>
  button.addEventListener("click", async () => {
    const email = normaliseEmail($("#login-email").value);
    if (!email) return openNotice("Reset your password", "Enter your email address first, then select Forgot password.");
    try {
      await requestPasswordReset(email);
      openNotice("Check your email", "If an account exists for this address, a password-reset link has been sent.");
    } catch (_) {
      // Deliberately generic: password reset must not reveal whether an account exists.
      openNotice("Check your email", "If an account exists for this address, a password-reset link has been sent.");
    }
  })
);

document.addEventListener("click", (event) => {
  const legalLink = event.target.closest("[data-legal]");
  if (!legalLink) return;
  event.preventDefault();
  if (legalLink.dataset.legal === "terms") openNotice("BloomCare Terms and Conditions", TERMS_OF_USE);
  if (legalLink.dataset.legal === "privacy") openNotice("BloomCare Privacy Policy", PRIVACY_POLICY);
});

$("#close-notice").addEventListener("click", () => notice.close());
$("#close-payment").addEventListener("click", () => paymentDialog.close());

$("#payment-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!event.currentTarget.checkValidity()) return event.currentTarget.reportValidity();
  const button = $("#start-payment");
  button.disabled = true;
  try {
    const response = await fetch(`${PAYMENT_API}/api/payments/initialize`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ provider: $("#payment-provider").value, phone: $("#payment-phone").value, appointment: { patientId: currentUser?.uid || getActiveEmail() || "demo-patient", service: $("#appointment-service").value, provider: $("#appointment-provider").value, date: $("#appointment-date").value, time: $("#appointment-time").value, facility: $("#appointment-facility").value } }) });
    const result = await response.json();
    if (!response.ok) throw new Error(result.errors ? Object.values(result.errors).join(" ") : result.error || "Unable to start payment.");
    pendingPayment = result;
    $("#payment-reference").textContent = `Payment reference: ${result.reference}`;
    $("#payment-reference").classList.remove("hidden");
    $("#payment-instructions").textContent = "Payment processing. Verification is performed by the backend; the appointment remains unconfirmed until it reports PAID.";
    button.classList.add("hidden");
    $("#verify-payment").classList.remove("hidden");
  } catch (error) { openNotice("Payment unavailable", `${error.message} Start the local payment API before trying again.`); }
  finally { button.disabled = false; }
});

$("#verify-payment").addEventListener("click", async () => {
  if (!pendingPayment) return;
  try {
    const response = await fetch(`${PAYMENT_API}/api/payments/verify`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ reference: pendingPayment.reference }) });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Payment verification is still pending.");
    const appointment = { ...(result.payment.appointment || {}), fee: result.receipt.amount, currency: result.receipt.currency, paymentStatus: "PAID", appointmentStatus: "CONFIRMED", reference: result.payment.appointmentReference || result.receipt.reference, receiptNumber: result.receipt.receiptNumber, paymentReference: result.receipt.reference, requestedAt: new Date().toISOString() };
    updateActiveAccount({ appointmentRequest: appointment });
    paymentDialog.close(); pendingPayment = null; showAppointments();
    openNotice("Appointment confirmed", `Reference: ${appointment.reference}. Payment status: PAID. Please keep receipt ${appointment.receiptNumber}.`);
  } catch (error) { openNotice("Payment verification", error.message); }
});

// Firebase Auth & Database Forms Integration
$("#register-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  if (registrationInProgress) {
    console.warn("[BloomCare Auth] Ignoring duplicate registration submission");
    return;
  }
  if (!event.currentTarget.checkValidity()) return event.currentTarget.reportValidity();

  // Get first and last name from separate fields
  const firstName = $("#register-first-name").value.trim();
  const lastName = $("#register-last-name").value.trim();
  const email = normaliseEmail($("#register-email").value);
  $("#register-email").value = email;
  const phone = validUgandanPhone($("#register-phone").value);
  const password = $("#register-password").value;
  const confirmPassword = $("#register-confirm-password").value;

  if (!firstName) return openNotice("Enter first name", "Please enter your first name.");
  if (!lastName) return openNotice("Enter last name", "Please enter your last name.");
  if (!phone) return openNotice("Invalid phone number", "Please enter a valid Ugandan phone number.");
  if (!/^\S+@\S+\.\S+$/.test(email)) return openNotice("Invalid email", "Please enter a valid email address.");
  if (password.length < 8) return openNotice("Invalid password", "Your password must be at least 8 characters.");
  if (!/[A-Z]/.test(password)) return openNotice("Invalid password", "Your password must contain at least one uppercase letter.");
  if (!/[a-z]/.test(password)) return openNotice("Invalid password", "Your password must contain at least one lowercase letter.");
  if (!/[0-9]/.test(password)) return openNotice("Invalid password", "Your password must contain at least one number.");
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) return openNotice("Invalid password", "Your password must contain at least one special character.");
  if (password !== confirmPassword) return openNotice("Passwords do not match", "Confirm Password must match Password.");

  const submitButton = event.currentTarget.querySelector("button[type=submit]");

  registrationInProgress = true;
  submitButton.disabled = true;
  submitButton.setAttribute("aria-busy", "true");
  submitButton.dataset.originalText = submitButton.textContent;
  submitButton.textContent = "Creating account...";

  try {
    // Set session key BEFORE signup so auth listener recognizes this as valid session
    // when auth state changes with the new user
    sessionStorage.setItem(AUTH_SESSION_KEY, AUTH_SESSION_VERSION);
    console.log("[BloomCare Auth] Registration attempt:", { email, firstName, lastName });

    // Create Firebase Auth account and Firestore profile
    const user = await signUpUser({ firstName, lastName, email, phone, password });

    console.log("[BloomCare Auth] Registration successful:", { uid: user.uid, email: user.email });

    // Set currentUser - auth state listener will also load this
    currentUser = { uid: user.uid, firstName, lastName, email: user.email, phone, role: "patient" };
    showView("dashboard-view");
    showHome();
  } catch (error) {
    console.error("[BloomCare Auth] Registration error:", {
      code: error.code,
      message: error.message,
      email
    });

    if (error.code === "auth/email-already-in-use") {
      $("#login-email").value = email;
      $("#login-card").classList.remove("hidden");
      $("#register-card").classList.add("hidden");
    } else if (error.code === "firestore/profile-creation-failed") {
      // The Firebase Auth session remains valid. Continue to the dashboard without retrying Auth.
      const user = error.user;
      currentUser = { uid: user.uid, firstName, lastName, email: user.email, phone, role: "patient" };
      showView("dashboard-view");
      showHome();
    } else {
      sessionStorage.removeItem(AUTH_SESSION_KEY);
      currentUser = null;
    }

    openNotice(error.code === "firestore/profile-creation-failed" ? "Profile save issue" : "Registration error", registrationErrorMessage(error.code));
  } finally {
    registrationInProgress = false;
    submitButton.disabled = false;
    submitButton.removeAttribute("aria-busy");
    submitButton.textContent = submitButton.dataset.originalText;
    delete submitButton.dataset.originalText;
  }
});

$("#login-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!event.currentTarget.checkValidity()) return event.currentTarget.reportValidity();
  const email = normaliseEmail($("#login-email").value);
  const password = $("#login-password").value;

  sessionStorage.setItem(AUTH_SESSION_KEY, AUTH_SESSION_VERSION);
  try {
    const user = await signInUser(email, password);
    sessionStorage.setItem(AUTH_SESSION_KEY, AUTH_SESSION_VERSION);
    const client = await getClientProfile(user.uid);
    currentUser = { uid: user.uid, email: user.email, ...(client || {}), displayName: user.displayName || email.split("@")[0] };

    // Sync profile and records from Firestore
    try {
      currentProfile = await getUserProfile(user.uid);
      currentRecords = await getHealthRecords(user.uid);
    } catch (e) {
      console.warn("Firestore sync fallback:", e);
    }

    showView("dashboard-view");
    showHome();
  } catch (error) {
    sessionStorage.removeItem(AUTH_SESSION_KEY);
    openNotice("Sign-in failed", "Invalid email or password.");
  }
});

$("#lmp").addEventListener("change", (event) => {
  if (!event.target.value) return;
  if (!isValidLmp(event.target.value)) {
    event.target.setCustomValidity("Last menstrual period cannot be in the future or be an invalid date.");
    $("#edd").value = "";
    return;
  }
  event.target.setCustomValidity("");
  $("#edd").value = calculateDueDate(event.target.value);
});

$("#profile-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!event.currentTarget.checkValidity()) return event.currentTarget.reportValidity();
  if (!isValidLmp($("#lmp").value)) return openNotice("Check your pregnancy dates", "Enter a valid last menstrual period date that is not in the future.");
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

async function endSession() {
  authTransition += 1;
  try {
    await signOutUser();
  } catch (e) {
    console.warn("Sign out fallback:", e);
  }
  currentUser = null;
  currentProfile = null;
  currentRecords = [];
  currentAppointment = null;
  sessionStorage.removeItem(AUTH_SESSION_KEY);
  showView("auth-view");
}

$("#logout").addEventListener("click", endSession);

document.addEventListener("click", (event) => {
  const whatsapp = event.target.closest("[data-whatsapp]");
  if (whatsapp) {
    event.preventDefault();
    openWhatsApp(whatsapp.dataset.whatsapp || undefined);
    return;
  }
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
  if (action === "edit-account") showClientAccountEditor();
  if (action === "logout") endSession();
});

document.addEventListener("submit", (event) => {
  if (event.target.id === "checkin-form") {
    event.preventDefault();
    if (event.target.checkValidity()) saveCheckin(event.target);
    else event.target.reportValidity();
    return;
  }

  if (event.target.id !== "client-profile-form") return;
  event.preventDefault();
  const phone = validUgandanPhone($("#client-phone").value);
  if (!phone) return openNotice("Invalid phone number", "Please enter a valid Ugandan phone number.");

  const client = {
    firstName: $("#client-first-name").value.trim(),
    lastName: $("#client-last-name").value.trim(),
    phone,
    dateOfBirth: $("#client-date-of-birth").value,
    gender: $("#client-gender").value,
    role: currentUser?.role || "patient"
  };

  updateClientProfile(currentUser.uid, client)
    .then(() => {
      currentUser = { ...currentUser, ...client };
      showHome();
      openNotice("Profile updated", "Your account details have been saved.");
    })
    .catch(() => openNotice("Profile update failed", "We could not save your profile. Please try again."));
});

// Subscribe to Firebase Auth State changes
subscribeAuthState(async (user) => {
  const transition = ++authTransition;
  if (user) {
    // Firebase's default local persistence can restore another person's old
    // browser session. Only restore a session that began in this browser tab.
    if (RESET_SESSION_REQUESTED || sessionStorage.getItem(AUTH_SESSION_KEY) !== AUTH_SESSION_VERSION) {
      await signOutUser().catch(() => {});
      sessionStorage.removeItem(AUTH_SESSION_KEY);
      if (RESET_SESSION_REQUESTED) window.history.replaceState({}, document.title, window.location.pathname);
      showView("auth-view");
      return;
    }
    try {
      systemSettings = await getSystemSettings();
    } catch (_) {
      systemSettings = {};
    }
    if (transition !== authTransition || auth.currentUser?.uid !== user.uid || sessionStorage.getItem(AUTH_SESSION_KEY) !== AUTH_SESSION_VERSION) return;
    try {
      const client = await getClientProfile(user.uid);
      currentUser = { uid: user.uid, email: user.email, ...(client || {}), displayName: user.displayName || user.email.split("@")[0] };
    } catch (_) {
      currentUser = { uid: user.uid, email: user.email, displayName: user.displayName || user.email.split("@")[0] };
    }
    if (transition !== authTransition || auth.currentUser?.uid !== user.uid || sessionStorage.getItem(AUTH_SESSION_KEY) !== AUTH_SESSION_VERSION) return;
    try {
      currentProfile = await getUserProfile(user.uid);
      currentRecords = await getHealthRecords(user.uid);
    } catch (e) {
      console.warn("Firestore initial load fallback:", e);
    }
    if (transition !== authTransition || auth.currentUser?.uid !== user.uid || sessionStorage.getItem(AUTH_SESSION_KEY) !== AUTH_SESSION_VERSION) return;
    // Authentication restores the dashboard consistently. Pregnancy details are
    // optional onboarding data and can be completed from the Profile tab.
    showView("dashboard-view");
    showHome();
  } else {
    currentUser = null;
    currentProfile = null;
    currentRecords = [];
    currentAppointment = null;
    systemSettings = {};
    sessionStorage.removeItem(AUTH_SESSION_KEY);
    showView("auth-view");
  }
});
