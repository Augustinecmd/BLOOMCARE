/**
 * BloomCare - Improved Application Logic
 * Early Pregnancy Monitoring System
 * 
 * Features:
 * - Better pregnancy tracking (weeks + days + trimester)
 * - Enhanced error handling and user feedback
 * - Improved form validation
 * - Consultant contact integration
 * - Better state management
 */

// ========== IMPORTS ==========
import { 
  auth, 
  db, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged, 
  doc, 
  setDoc, 
  serverTimestamp 
} from "./firebase-config.js";
import {
  normalizeUgandanPhone,
  validateUgandanPhone,
  validateEmail,
  validatePassword,
  validateName,
  validateDateOfBirth,
  validateLmp,
  validateEmergencyContact
} from "./validators.js";

// ========== CONFIGURATION ==========
const CONFIG = {
  ACCOUNTS_KEY: "bloomcareAccounts",
  SESSION_KEY: "bloomcareSession",
  PAYMENT_API: "http://127.0.0.1:8787",
  FIREBASE_TIMEOUT_MS: 10000,
  CONSULTANT_NUMBERS: ["0741592069", "0786426344"],
  WEEK_DETAILS: {
    // Week-based educational content
    5: "Your baby is a tiny cluster of cells growing rapidly.",
    6: "Your baby is about the size of a grain of rice.",
    7: "Your baby is about the size of a blueberry.",
    8: "Your baby is about the size of a raspberry.",
    9: "Your baby is about the size of a grape.",
    10: "Your baby is about the size of a prune.",
    11: "Your baby is about the size of a lime.",
    12: "Your baby is about the size of a plum.",
    13: "Your baby is about the size of a peach.",
    14: "Your baby is about the size of a lemon.",
  }
};


let pendingPayment = null;

function withTimeout(promise, milliseconds, message) {
  let timeoutId;
  const timeout = new Promise((_, reject) => {
    timeoutId = setTimeout(() => {
      const error = new Error(message);
      error.code = "app/timeout";
      reject(error);
    }, milliseconds);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timeoutId));
}

// ========== UTILITY FUNCTIONS ==========

/**
 * DOM selector shortcut
 */
const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => document.querySelectorAll(selector);

/**
 * Show/hide view
 */
function showView(viewId) {
  $$("[id$='-view']").forEach((view) => {
    view.classList.toggle("hidden", view.id !== viewId);
  });
}

/**
 * Show notification dialog
 */
function openNotice(title, message) {
  $("#notice-title").textContent = title;
  $("#notice-text").textContent = message;
  $("#notice").showModal();
}

/**
 * Normalize email
 */
function normalizeEmail(email) {
  return email.trim().toLowerCase();
}

function setValidity(field, result) {
  if (!field) return;
  field.setCustomValidity(result.valid ? "" : result.message);
  field.classList.toggle("field-valid", result.valid && Boolean(field.value));
  field.classList.toggle("field-invalid", !result.valid && Boolean(field.value));
}

function validateRegistrationFields() {
  const name = $("#register-name");
  const phone = $("#register-phone");
  const email = $("#register-email");
  const password = $("#register-password");
  const passwordConfirm = $("#register-password-confirm");
  const dateOfBirth = $("#register-dob");
  const nameResult = validateName(name.value);
  const phoneResult = validateUgandanPhone(phone.value);
  const emailResult = validateEmail(email.value);
  const passwordResult = validatePassword(password.value);
  const dateResult = validateDateOfBirth(dateOfBirth.value);
  setValidity(name, nameResult);
  setValidity(phone, phoneResult);
  setValidity(email, emailResult);
  setValidity(password, passwordResult);
  setValidity(passwordConfirm, {
    valid: password.value === passwordConfirm.value,
    message: "Passwords must match."
  });
  setValidity(dateOfBirth, dateResult);
  return { nameResult, phoneResult, emailResult, passwordResult, dateResult };
}

function validateProfileFields() {
  const lmp = $("#lmp");
  const emergencyName = $("#emergency-contact-name");
  const emergencyPhone = $("#emergency-contact-phone");
  const relationship = $("#emergency-contact-relationship");
  const lmpResult = validateLmp(lmp.value);
  const emergencyResult = validateEmergencyContact({
    name: emergencyName.value,
    phone: emergencyPhone.value,
    relationship: relationship.value
  });
  setValidity(lmp, lmpResult);
  setValidity(emergencyName, { valid: !emergencyResult.errors.name, message: emergencyResult.errors.name || "" });
  setValidity(emergencyPhone, { valid: !emergencyResult.errors.phone, message: emergencyResult.errors.phone || "" });
  setValidity(relationship, { valid: !emergencyResult.errors.relationship, message: emergencyResult.errors.relationship || "" });
  return { lmpResult, emergencyResult };
}

/**
 * Show/hide error message
 */
function showError(elementId, message) {
  const errorEl = $(`#${elementId}`);
  if (errorEl) {
    if (message) {
      errorEl.textContent = message;
      errorEl.style.display = "block";
    } else {
      errorEl.style.display = "none";
    }
  }
}

/**
 * Show/hide loading state
 */
function setLoading(elementId, isLoading) {
  const loadingEl = $(`#${elementId}`);
  if (loadingEl) {
    loadingEl.style.display = isLoading ? "block" : "none";
  }
  
  const form = $(`#${elementId.replace('-loading', '-form')}`);
  const submitBtn = form?.querySelector('[type="submit"]');
  if (submitBtn) {
    submitBtn.disabled = isLoading;
    submitBtn.setAttribute("aria-busy", isLoading);
  }
}

/**
 * Firebase error message formatter
 */
function getFirebaseErrorMessage(error) {
  const messages = {
    "auth/email-already-in-use": "An account with this email already exists.",
    "auth/invalid-credential": "The email address or password is incorrect.",
    "auth/weak-password": "Use a stronger password with at least 8 characters.",
    "auth/operation-not-allowed": "Email and password sign-in is not enabled in Firebase Authentication yet.",
    "auth/invalid-email": "Please enter a valid email address.",
    "auth/user-disabled": "This account has been disabled."
  };
  return messages[error.code] || error.message || "An error occurred. Please try again.";
}

// ========== PREGNANCY TRACKING ==========

/**
 * Calculate pregnancy progress from LMP date
 * Returns: { weeks, days, progress, trimester, weekDetail }
 */
function calculatePregnancyProgress(lmpDateString) {
  const lmp = new Date(lmpDateString + "T00:00:00");
  const now = new Date();
  const diffTime = now.getTime() - lmp.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  const weeks = Math.floor(diffDays / 7);
  const days = diffDays % 7;
  
  // Clamp to 0-40 weeks
  const clampedWeeks = Math.max(1, Math.min(40, weeks));
  const progress = Math.round((clampedWeeks / 40) * 100);
  
  // Determine trimester
  let trimester = "First Trimester";
  if (clampedWeeks > 13) trimester = "Second Trimester";
  if (clampedWeeks > 27) trimester = "Third Trimester";
  
  // Get week detail
  const weekDetail = CONFIG.WEEK_DETAILS[clampedWeeks] || "Your baby is growing and developing.";
  
  return {
    weeks: clampedWeeks,
    days,
    progress,
    trimester,
    weekDetail,
    totalDays: diffDays
  };
}

/**
 * Calculate estimated due date (LMP + 280 days)
 */
function calculateDueDate(lmpDateString) {
  const lmp = new Date(lmpDateString + "T00:00:00");
  lmp.setDate(lmp.getDate() + 280);
  return lmp.toISOString().split("T")[0];
}

/**
 * Format date for display
 */
function formatDate(dateString) {
  if (!dateString) return "--";
  return new Intl.DateTimeFormat("en", { 
    day: "numeric", 
    month: "long", 
    year: "numeric" 
  }).format(new Date(dateString + "T00:00:00"));
}

/**
 * Format current date and day
 */
function formatCurrentDate() {
  const today = new Date();
  return new Intl.DateTimeFormat("en", { 
    weekday: "long", 
    month: "short", 
    day: "numeric" 
  }).format(today).toUpperCase();
}

/**
 * Update pregnancy summary in dashboard
 */
function updatePregnancySummary() {
  const profile = getProfile();
  if (!profile || !profile.lmp) return;
  
  const data = calculatePregnancyProgress(profile.lmp);
  
  if ($("#week-number")) {
    $("#week-number").textContent = data.weeks;
  }
  if ($("#day-number")) {
    $("#day-number").textContent = data.days;
  }
  if ($("#progress-value")) {
    $("#progress-value").textContent = data.progress + "%";
  }
  if ($("#progress-bar")) {
    $("#progress-bar").style.width = data.progress + "%";
  }
  if ($("#due-date")) {
    $("#due-date").textContent = formatDate(profile.edd);
  }
  if ($("#trimester-info")) {
    $("#trimester-info").textContent = data.trimester;
  }
  if ($("#week-detail")) {
    $("#week-detail").textContent = data.weekDetail;
  }
}

/**
 * Update current date in header
 */
function updateCurrentDate() {
  const dateEl = $("#current-date");
  if (dateEl) {
    dateEl.textContent = formatCurrentDate();
  }
}

// ========== LOCAL STORAGE MANAGEMENT ==========

function getAccounts() {
  return JSON.parse(localStorage.getItem(CONFIG.ACCOUNTS_KEY) || "{}");
}

function saveAccounts(accounts) {
  localStorage.setItem(CONFIG.ACCOUNTS_KEY, JSON.stringify(accounts));
}

function getActiveEmail() {
  return localStorage.getItem(CONFIG.SESSION_KEY);
}

function getActiveAccount() {
  return getAccounts()[getActiveEmail()] || null;
}

function getUser() {
  return getActiveAccount();
}

function getProfile() {
  return getActiveAccount()?.profile || null;
}

function getRecords() {
  return getActiveAccount()?.records || [];
}

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
  const email = normalizeEmail(legacyUser.email);
  accounts[email] = {
    name: legacyUser.name || "Client",
    email,
    password: "",
    profile: JSON.parse(localStorage.getItem("bloomcareProfile") || "null"),
    records: JSON.parse(localStorage.getItem("bloomcareRecords") || "[]")
  };
  saveAccounts(accounts);
  localStorage.setItem(CONFIG.SESSION_KEY, email);
}

// ========== VIEW FUNCTIONS ==========

function setUserName() {
  const user = getUser();
  if (!user) return;
  const name = user.name.split(" ")[0];
  if ($("#patient-name")) {
    $("#patient-name").textContent = name;
  }
}

function showHome() {
  showView("dashboard-view");
  updateCurrentDate();
  setUserName();
  updatePregnancySummary();
  
  const latest = getRecords()[0];
  if (latest) {
    const latestCard = $(".record");
    if (latestCard) {
      latestCard.querySelector("strong").textContent = "Daily check-in";
      latestCard.querySelector("p").textContent = "Recorded today";
    }
  }
  setActiveNav("dashboard");
}

function setActiveNav(page) {
  $$(".sidebar nav a").forEach((link) => {
    const href = link.getAttribute("href");
    link.classList.toggle("active", href === "#" + page);
  });
}

function showProfileEditor() {
  const profile = getProfile();
  showView("profile-view");
  if ($("#lmp")) $("#lmp").value = profile ? profile.lmp : "";
  if ($("#edd")) $("#edd").value = profile ? profile.edd : "";
}

function showErrorView(message) {
  showView("dashboard-view");
  const content = $("#dashboard-view .dash-content");
  if (content) {
    content.innerHTML = `
      <div class="error-message" style="display: block;">
        <strong>Error:</strong> ${message}
      </div>
    `;
  }
}

async function logOut() {
  localStorage.removeItem(CONFIG.SESSION_KEY);
  await signOut(auth).catch(() => {});
  showView("auth-view");
}

function requestLogout() {
  $("#logout-dialog").showModal();
}

// ========== FORM HANDLERS ==========

/**
 * Handle login form submission
 */
$("#login-form")?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const emailResult = validateEmail($("#login-email").value);
  setValidity($("#login-email"), emailResult);
  if (!event.currentTarget.checkValidity()) {
    return event.currentTarget.reportValidity();
  }
  
  showError("login-error", "");
  setLoading("login-loading", true);
  
  const email = normalizeEmail($("#login-email").value);
  const password = $("#login-password").value;
  
  try {
    // Try Firebase auth first
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      if (error.code !== "auth/operation-not-allowed") {
        throw error;
      }
    }
    
    // Fall back to local accounts
    const account = getAccounts()[email];
    if (!account || account.password !== password) {
      throw new Error("The email address or password is incorrect.");
    }
    
    localStorage.setItem(CONFIG.SESSION_KEY, email);
    
    if (account.profile) {
      showHome();
    } else {
      showProfileEditor();
    }
  } catch (error) {
    showError("login-error", getFirebaseErrorMessage(error));
    setLoading("login-loading", false);
  }
});

/**
 * Handle registration form submission
 */
$("#register-form")?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const validation = validateRegistrationFields();
  if (validation.phoneResult.valid) $("#register-phone").value = validation.phoneResult.value;
  if (!event.currentTarget.checkValidity()) {
    return event.currentTarget.reportValidity();
  }
  
  showError("register-error", "");
  setLoading("register-loading", true);
  
  const name = $("#register-name").value.trim();
  const email = normalizeEmail($("#register-email").value);
  const password = $("#register-password").value;
  const phone = $("#register-phone").value.trim();
  const dateOfBirth = $("#register-dob").value;
  
  try {
    let firebaseCreated = false;
    let firebaseUser = null;
    
    // Try Firebase auth
    try {
      const credential = await withTimeout(
        createUserWithEmailAndPassword(auth, email, password),
        CONFIG.FIREBASE_TIMEOUT_MS,
        "Firebase is taking too long to respond."
      );
      firebaseCreated = true;
      firebaseUser = credential.user;
    } catch (error) {
      if (error.code === "auth/email-already-in-use") {
        showError("register-error", "This email is already registered. Sign in instead.");
        setLoading("register-loading", false);
        return;
      }
      if (error.code === "app/timeout" || error.code === "auth/network-request-failed") {
        openNotice("Continuing in demo mode", "Firebase did not respond within 10 seconds. Your demo account will be saved on this device.");
      } else if (error.code !== "auth/operation-not-allowed") {
        throw error;
      }
    }
    
    // Save to Firestore if Firebase user created
    if (firebaseUser) {
      setDoc(doc(db, "users", firebaseUser.uid), {
        role: "patient",
        fullName: name,
        email,
        phone,
        dateOfBirth,
        consentedAt: serverTimestamp(),
        consentVersion: "v1",
        termsAcceptedAt: serverTimestamp(),
        termsVersion: "v1",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }).catch((error) => {
        console.warn("Firebase profile save failed:", error);
      });
    }
    
    // Save to local accounts
    const accounts = getAccounts();
    if (accounts[email] && !firebaseCreated) {
      showError("register-error", "This email is already registered. Sign in instead.");
      setLoading("register-loading", false);
      return;
    }
    
    accounts[email] = {
      name,
      email,
      password: firebaseCreated ? "" : password,
      phone,
      dateOfBirth,
      termsAcceptedAt: new Date().toISOString(),
      termsVersion: "v1",
      profile: null,
      records: []
    };
    
    saveAccounts(accounts);
    localStorage.setItem(CONFIG.SESSION_KEY, email);
    
    setLoading("register-loading", false);
    showProfileEditor();
  } catch (error) {
    showError("register-error", getFirebaseErrorMessage(error));
    setLoading("register-loading", false);
  }
});

/**
 * Handle profile form submission
 */
$("#profile-form")?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const validation = validateProfileFields();
  if (!event.currentTarget.checkValidity()) {
    return event.currentTarget.reportValidity();
  }
  
  showError("profile-error", "");
  setLoading("profile-loading", true);
  
  const profile = {
    lmp: $("#lmp").value,
    edd: calculateDueDate($("#lmp").value),
    previousPregnancies: $("#previous-pregnancies").value,
    medicalHistory: $("#medical-history").value.trim(),
    allergies: "",
    emergencyContact: {
      name: $("#emergency-contact-name").value.trim(),
      phone: normalizeUgandanPhone($("#emergency-contact-phone").value),
      relationship: $("#emergency-contact-relationship").value.trim()
    }
  };
  
  try {
    updateActiveAccount({ profile });
    
    // Save to Firestore if available
    if (auth.currentUser) {
      const pregnancyId = `${auth.currentUser.uid}_current`;
      setDoc(
        doc(db, "pregnancies", pregnancyId),
        {
          patientUid: auth.currentUser.uid,
          lmpDate: profile.lmp,
          estimatedDueDate: profile.edd,
          previousPregnancies: Number(profile.previousPregnancies),
          medicalHistory: profile.medicalHistory,
          allergies: profile.allergies,
          status: "active",
          updatedAt: serverTimestamp(),
          createdAt: serverTimestamp()
        },
        { merge: true }
      ).catch((error) => {
        console.warn("Firebase save failed:", error);
      });
    }
    
    setLoading("profile-loading", false);
    showHome();
  } catch (error) {
    showError("profile-error", error.message);
    setLoading("profile-loading", false);
  }
});

/**
 * Handle LMP date change - auto-calculate due date
 */
$("#lmp")?.addEventListener("change", (event) => {
  if (event.target.value) {
    const eddEl = $("#edd");
    if (eddEl) {
      eddEl.value = calculateDueDate(event.target.value);
    }
  }
  validateProfileFields();
});

$("#register-form")?.querySelectorAll("input").forEach((field) => {
  field.addEventListener("input", () => validateRegistrationFields());
  field.addEventListener("blur", () => validateRegistrationFields());
});

$("#profile-form")?.querySelectorAll("input, select, textarea").forEach((field) => {
  field.addEventListener("input", () => validateProfileFields());
  field.addEventListener("change", () => validateProfileFields());
});

// ========== EVENT LISTENERS ==========

// Dialog close buttons
$("#close-notice")?.addEventListener("click", () => $("#notice").close());
$("#close-logout")?.addEventListener("click", () => $("#logout-dialog").close());
$("#open-terms")?.addEventListener("click", () => $("#terms-dialog").showModal());
$("#close-terms")?.addEventListener("click", () => $("#terms-dialog").close());
$("#accept-terms")?.addEventListener("click", () => {
  $("#terms-consent").checked = true;
  $("#terms-dialog").close();
});
$("#close-payment")?.addEventListener("click", () => $("#payment-dialog").close());

$("#payment-form")?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const phone = $("#payment-phone");
  const phoneResult = validateUgandanPhone(phone.value);
  setValidity(phone, phoneResult);
  if (!event.currentTarget.checkValidity()) return event.currentTarget.reportValidity();

  const startButton = $("#start-payment");
  startButton.disabled = true;
  phone.value = phoneResult.value;
  try {
    const response = await fetch(`${CONFIG.PAYMENT_API}/api/payments/initialize`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ provider: $("#payment-provider").value, phone: phone.value })
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || result.error || "Payment could not be started.");
    pendingPayment = result;
    $("#payment-reference").textContent = `Payment reference: ${result.reference}`;
    $("#payment-reference").classList.remove("hidden");
    $("#payment-instructions").textContent = result.message;
    startButton.classList.add("hidden");
    $("#verify-payment").classList.remove("hidden");
  } catch (error) {
    openNotice("Payment service unavailable", error.message);
  } finally {
    startButton.disabled = false;
  }
});

$("#verify-payment")?.addEventListener("click", async () => {
  if (!pendingPayment) return;
  try {
    const response = await fetch(`${CONFIG.PAYMENT_API}/api/payments/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reference: pendingPayment.reference })
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || result.message || "Payment verification failed.");
    $("#payment-dialog").close();
    openNotice("Payment verified", `Receipt ${result.receipt.receiptNumber} issued for UGX ${result.receipt.amount}.`);
    pendingPayment = null;
  } catch (error) {
    openNotice("Payment verification failed", error.message);
  }
});

// Logout dialogs
$("#logout")?.addEventListener("click", requestLogout);
$("#confirm-logout")?.addEventListener("click", async () => {
  $("#logout-dialog").close();
  await logOut();
});
$("#cancel-logout")?.addEventListener("click", () => {
  $("#logout-dialog").close();
});

// Navigation
document.addEventListener("click", (event) => {
  // Route navigation
  const route = event.target.closest("[data-route], .sidebar nav a");
  if (route) {
    event.preventDefault();
    const page = route.dataset.route || route.getAttribute("href").slice(1);
    if (page === "dashboard") showHome();
    if (page === "profile") showProfileEditor();
    return;
  }
  
  // Actions
  const action = event.target.closest("[data-action]")?.dataset.action;
  if (action === "logout") requestLogout();
  if (action === "emergency") {
    openNotice(
      "Seek urgent professional care",
      "For severe pain, heavy bleeding, fainting, difficulty breathing, or any urgent concern, contact your healthcare provider or seek immediate medical attention. BloomCare cannot assess emergencies."
    );
  }
});

// View switching for auth
$$("[data-show]").forEach((button) => {
  button.addEventListener("click", () => {
    $("#login-card").classList.toggle("hidden", button.dataset.show !== "login-card");
    $("#register-card").classList.toggle("hidden", button.dataset.show !== "register-card");
  });
});

// ========== INITIALIZATION ==========

// Clear errors when typing
["#login-email", "#login-password", "#register-name", "#register-email"].forEach(selector => {
  $(selector)?.addEventListener("input", () => {
    showError(selector.replace("#", "") + "-error", "");
  });
});

// Migrate legacy data
migrateLegacyData();

// Update current date on load
updateCurrentDate();

// Firebase auth state
onAuthStateChanged(auth, (user) => {
  if (!user) return;
  localStorage.setItem(CONFIG.SESSION_KEY, user.email || "");
  if (getProfile()) {
    showHome();
    setUserName();
    updatePregnancySummary();
  }
});

// Check if user is already logged in
if (getActiveEmail() && getProfile()) {
  showHome();
  setUserName();
  updatePregnancySummary();
}

console.log("BloomCare improved app loaded successfully");
