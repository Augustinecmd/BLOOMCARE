import React, { useState } from "react";

const ACCOUNT_KEY = "bloomcare-staff-account";
const SESSION_KEY = "bloomcare-staff-session";
const patients = ["Amina Nanyonga", "Sarah Namusoke", "Grace Ochieng"];
const stock = ["Folic Acid 5mg", "Ferrous Sulphate", "Calcium Carbonate"];

function Logo() {
  return <div className="logo"><span>+</span><strong>BloomCare</strong><small>MATERNAL HEALTH</small></div>;
}

function AuthScreen({ onAuthenticated }) {
  const [registering, setRegistering] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });
  const [error, setError] = useState("");
  function update(event) { setForm({ ...form, [event.target.name]: event.target.value }); setError(""); }
  function submit(event) {
    event.preventDefault();
    const email = form.email.trim().toLowerCase();
    if (!email || !form.password) return setError("Enter your work email and password.");
    if (registering) {
      if (!form.name.trim()) return setError("Enter your full name.");
      if (form.password.length < 8) return setError("Use at least 8 characters for your password.");
      if (form.password !== form.confirm) return setError("Passwords do not match.");
      const account = { name: form.name.trim(), email, password: form.password };
      localStorage.setItem(ACCOUNT_KEY, JSON.stringify(account));
      sessionStorage.setItem(SESSION_KEY, "active");
      onAuthenticated(account);
      return;
    }
    const account = JSON.parse(localStorage.getItem(ACCOUNT_KEY) || "null");
    if (!account || account.email !== email || account.password !== form.password) return setError("The email or password is incorrect.");
    sessionStorage.setItem(SESSION_KEY, "active");
    onAuthenticated(account);
  }
  return <main className="auth-page"><aside className="auth-rail"><Logo /><div className="rail-copy"><p className="kicker">MATERNAL CARE OPERATIONS</p><h1>One calmer shift starts here.</h1><p>Keep antenatal prescriptions, patient follow-ups, and essential stock visible to the whole care team.</p></div><p className="rail-foot">24/7 care team visibility</p></aside><section className="auth-panel"><div className="auth-top"><Logo /><span>Staff workspace <b>●</b></span></div><div className="auth-form"><p className="kicker">{registering ? "NEW TEAM MEMBER" : "STAFF SIGN IN"}</p><h2>{registering ? "Create staff access." : "Welcome back."}</h2><p>Sign in to support your pregnancy-care team.</p><form onSubmit={submit} noValidate>{registering && <label>Full name<input name="name" value={form.name} onChange={update} placeholder="Amina Nanyonga" /></label>}<label>Work email<input name="email" type="email" value={form.email} onChange={update} placeholder="name@bloomcare.org" /></label><label>Password<input name="password" type="password" value={form.password} onChange={update} placeholder="Enter your password" /></label>{registering && <label>Confirm password<input name="confirm" type="password" value={form.confirm} onChange={update} placeholder="Repeat your password" /></label>}{error && <div className="form-error">{error}</div>}<button className="submit-button" type="submit">{registering ? "Create staff account" : "Sign in to workspace"}<span>↗</span></button></form><p className="auth-switch">{registering ? "Already have access?" : "New to the team?"} <button type="button" onClick={() => { setRegistering(!registering); setError(""); }}>{registering ? "Sign in" : "Create an account"}</button></p></div><small className="auth-foot">Protected workspace · Development mode</small></section></main>;
}

function Dashboard({ account, onSignOut }) {
  const initials = account.name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase();
  return <div className="dashboard"><aside className="sidebar"><Logo /><p className="workspace-label">MATERNAL CARE TEAM</p><nav><a className="active" href="#overview">01 <span>Overview</span></a><a href="#patients">02 <span>Patients</span></a><a href="#prescriptions">03 <span>Prescriptions</span><i>7</i></a><a href="#inventory">04 <span>Pharmacy stock</span><i>3</i></a><a href="#reports">05 <span>Reports</span></a></nav><button className="sign-out" onClick={onSignOut} type="button">Sign out ↗</button></aside><main className="dashboard-main"><header><div><p className="kicker">SATURDAY · 22 AUGUST 2026</p><h1>Good morning, {account.name.split(" ")[0]}.</h1></div><div className="staff-chip"><span className="avatar">{initials}</span><span><strong>{account.name}</strong><small>Pharmacy staff</small></span></div></header><section className="shift-banner"><span className="banner-mark">+</span><div><p className="kicker">YOUR SHIFT AT A GLANCE</p><h2>Care is moving well today.</h2><p>Keep an eye on the review queue and low-stock maternal supplements.</p></div><strong>08 <small>patients due<br />for review</small></strong></section><section className="metrics"><article><p>Patients supported</p><strong>186</strong><small>+12% this month</small></article><article><p>Awaiting prescription review</p><strong>07</strong><small>3 urgent today</small></article><article><p>Stock items to replenish</p><strong>03</strong><small>1 critical item</small></article></section><div className="section-heading"><div><p className="kicker">CARE WORKLIST</p><h2>Today’s priorities</h2></div><a href="#all">View all activity ↗</a></div><section className="work-grid"><article className="panel"><div className="panel-title"><h3>Patient follow-ups</h3><span>08 open</span></div>{patients.map((name, index) => <div className="patient-row" key={name}><b>{name.split(" ").map((part) => part[0]).join("")}</b><div><strong>{name}</strong><small>{["28 weeks", "12 weeks", "35 weeks"][index]} · Antenatal care</small></div><em>{["Prescription ready", "Needs review", "Dispensed today"][index]}</em><i>→</i></div>)}</article><article className="panel"><div className="panel-title"><h3>Maternal-health stock</h3><a href="#inventory">Open inventory ↗</a></div>{stock.map((name, index) => <div className="stock-row" key={name}><div><strong>{name}</strong><small>{["12 packs", "28 packs", "64 packs"][index]} remaining</small></div><em>{["Urgent", "Monitor", "Healthy"][index]}</em></div>)}</article></section></main></div>;
}

export default function App() {
  const [account, setAccount] = useState(() => sessionStorage.getItem(SESSION_KEY) === "active" ? JSON.parse(localStorage.getItem(ACCOUNT_KEY) || "null") : null);
  function signOut() { sessionStorage.removeItem(SESSION_KEY); setAccount(null); }
  return account ? <Dashboard account={account} onSignOut={signOut} /> : <AuthScreen onAuthenticated={setAccount} />;
}
