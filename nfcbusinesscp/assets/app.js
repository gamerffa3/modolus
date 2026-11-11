import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import {
  getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut,
  sendPasswordResetEmail, sendEmailVerification
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import {
  getDatabase, ref, get, set, update, remove, onValue
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-database.js";
import { firebaseConfig, ADMIN_EMAIL } from "./firebase-config.js";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);
const $ = (s, root=document) => root.querySelector(s);
const esc = (v="") => String(v).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const cleanId = v => String(v || "").trim().replace(/[^a-zA-Z0-9_-]/g, "");
const basePath = () => {
  const p = location.pathname;
  return p.endsWith("/") ? p : p.slice(0, p.lastIndexOf("/") + 1);
};
const publicUrl = id => `${location.origin}${basePath()}${encodeURIComponent(id)}`;
const isPublicRoute = () => {
  const p = location.pathname.replace(/\/+$/, "");
  const base = basePath().replace(/\/+$/, "");
  return p !== base && p !== "";
};
let businesses = {};
let unsubscribe = null;

function renderLogin(message="", emailValue="") {
  $("#app").innerHTML = `
  <main class="auth-layout">
    <section class="auth-visual">
      <div class="brand"><span class="logo">M</span><span>MODULOS <small>NFC BUSINESS CP</small></span></div>
      <div class="visual-copy"><span class="eyebrow">BUSINESS CARD MANAGEMENT</span><h1>One dashboard.<br><em>Every connection.</em></h1><p>Manage NFC business cards, unique IDs and customer touchpoints from one secure place.</p></div>
      <div class="visual-foot">MODULOS · DIGITAL EXPERIENCES</div>
    </section>
    <section class="auth-side">
      <form class="auth-card" id="loginForm">
        <span class="eyebrow blue">ADMIN WORKSPACE</span><h2>Welcome back</h2><p class="muted">Sign in to manage your business cards.</p>
        ${message ? `<div class="notice">${esc(message)}</div>` : ""}
        <label>Email address<input id="email" type="email" autocomplete="username" value="${esc(emailValue || ADMIN_EMAIL)}" required></label>
        <label>Password<input id="password" type="password" autocomplete="current-password" placeholder="Enter your password" required></label>
        <div class="auth-row"><label class="remember"><input type="checkbox" id="showPassword"> Show password</label><button class="text-button" type="button" id="forgot">Forgot password?</button></div>
        <button class="btn primary wide" type="submit">Sign in <span>→</span></button>
        <p class="fine">Admin access is restricted to the configured administrator email.</p>
      </form>
    </section>
  </main>`;
  $("#showPassword").addEventListener("change", e => $("#password").type = e.target.checked ? "text" : "password");
  $("#forgot").addEventListener("click", async () => {
    const email = $("#email").value.trim();
    if (!email) return toast("Pehle email address enter karein.");
    try { await sendPasswordResetEmail(auth, email); toast("Password reset email bhej diya gaya hai."); }
    catch (e) { toast(authError(e)); }
  });
  $("#loginForm").addEventListener("submit", async e => {
    e.preventDefault();
    const btn = e.submitter; btn.disabled = true; btn.textContent = "Signing in…";
    try {
      const email = $("#email").value.trim().toLowerCase();
      if (email !== ADMIN_EMAIL.toLowerCase()) throw new Error("Is email ko admin access nahi hai.");
      const cred = await signInWithEmailAndPassword(auth, email, $("#password").value);
      if (!cred.user.emailVerified) {
        await sendEmailVerification(cred.user);
        await signOut(auth);
        renderLogin("Email verify nahi hai. Inbox mein verification link bheja gaya hai. Verify karke dobara login karein.", email);
        return;
      }
      renderDashboard();
    } catch (err) { renderLogin(authError(err), $("#email")?.value || ADMIN_EMAIL); }
  });
}
function authError(e) {
  const code = e?.code || "";
  if (code.includes("invalid-credential") || code.includes("wrong-password") || code.includes("user-not-found")) return "Email ya password sahi nahi hai.";
  if (code.includes("too-many-requests")) return "Bahut attempts ho gaye. Thodi der baad try karein.";
  if (code.includes("network")) return "Network issue. Internet check karein.";
  return e?.message || "Login nahi ho saka.";
}
function toast(message) {
  let el = $("#toast");
  if (!el) { el = document.createElement("div"); el.id="toast"; el.className="toast"; document.body.append(el); }
  el.textContent = message; el.classList.add("show"); setTimeout(() => el.classList.remove("show"), 3500);
}
function renderDashboard() {
  $("#app").innerHTML = `
  <div class="app-shell">
    <aside class="sidebar">
      <div class="brand"><span class="logo">M</span><span>MODULOS<small>NFC BUSINESS CP</small></span></div>
      <div class="nav-label">WORKSPACE</div>
      <button class="nav active" data-view="overview">▦ <span>Overview</span></button>
      <button class="nav" data-view="businesses">▣ <span>Businesses</span></button>
      <button class="nav" data-view="add">＋ <span>Add business</span></button>
      <div class="sidebar-bottom"><div class="admin-chip"><div class="avatar">A</div><div><b>Administrator</b><small>${esc(auth.currentUser?.email || ADMIN_EMAIL)}</small></div></div><button class="logout" id="logout">↪ Sign out</button></div>
    </aside>
    <main class="workspace">
      <header class="topbar"><div><span class="eyebrow">MODULOS / WORKSPACE</span><h1 id="pageTitle">Overview</h1></div><div class="top-actions"><span class="secure-pill">● Secure session</span><button class="btn primary" id="topAdd">＋ Add business</button></div></header>
      <div id="content"></div>
      <footer class="app-footer">Modulos NFC Business CP <span>Secure admin workspace</span></footer>
    </main>
  </div>`;
  $("#logout").onclick = async () => { if(unsubscribe) unsubscribe(); await signOut(auth); };
  $("#topAdd").onclick = () => showView("add");
  document.querySelectorAll(".nav").forEach(b => b.onclick = () => showView(b.dataset.view));
  subscribeBusinesses();
  showView("overview");
}
function subscribeBusinesses() {
  if (unsubscribe) unsubscribe();
  unsubscribe = onValue(ref(db, "businesses"), snap => {
    businesses = snap.val() || {};
    const active = document.querySelector(".nav.active")?.dataset.view || "overview";
    if (active === "overview") showView("overview");
    if (active === "businesses") showView("businesses");
  }, err => toast("Database error: " + err.message));
}
function showView(view, editId="") {
  document.querySelectorAll(".nav").forEach(b => b.classList.toggle("active", b.dataset.view===view || (view==="edit" && b.dataset.view==="businesses")));
  const title = view==="add" ? "Add business" : view==="edit" ? "Edit business" : view==="businesses" ? "Businesses" : "Overview";
  $("#pageTitle").textContent = title;
  if (view==="add" || view==="edit") renderBusinessForm(view==="edit" ? businesses[editId] : null);
  else if (view==="businesses") renderBusinessList();
  else renderOverview();
}
function renderOverview() {
  const list = Object.entries(businesses);
  $("#content").innerHTML = `
    <section class="welcome"><div><span class="eyebrow">YOUR DIGITAL CARD NETWORK</span><h2>Good to see you.</h2><p>Manage every business profile connected to your NFC cards.</p></div><div class="welcome-art">M<span>✦</span></div></section>
    <section class="metric-grid"><div class="metric"><span>Total businesses</span><b>${list.length}</b><small>Registered card profiles</small></div><div class="metric"><span>Public card pages</span><b>${list.length}</b><small>Unique ID destinations</small></div><div class="metric"><span>Admin security</span><b class="metric-status">Protected</b><small>Firebase Authentication</small></div></section>
    <section class="panel"><div class="panel-head"><div><h3>Recently added businesses</h3><p>Your latest NFC card profiles.</p></div><button class="text-button" id="allBusinesses">View all →</button></div>${list.length ? `<div class="business-list">${list.slice(0,5).map(([id,b])=>businessRow(id,b)).join("")}</div>` : `<div class="empty-state"><div class="empty-icon">▣</div><h3>No businesses yet</h3><p>Add your first business and connect its NFC card ID.</p><button class="btn primary" id="firstAdd">＋ Add first business</button></div>`}</section>`;
  $("#allBusinesses")?.addEventListener("click",()=>showView("businesses"));
  $("#firstAdd")?.addEventListener("click",()=>showView("add"));
  bindRowButtons();
}
function businessRow(id,b) {
  return `<div class="business-row"><div class="business-avatar">${esc((b.name||"B").slice(0,1).toUpperCase())}</div><div class="business-info"><b>${esc(b.name)}</b><small>ID: ${esc(id)}</small></div><a class="public-link" target="_blank" href="${esc(publicUrl(id))}">View card ↗</a><button class="icon-btn edit-btn" data-edit="${esc(id)}" title="Edit">✎</button></div>`;
}
function renderBusinessList() {
  const list=Object.entries(businesses);
  $("#content").innerHTML=`<section class="panel"><div class="panel-head"><div><h3>All businesses</h3><p>${list.length} registered business profile(s).</p></div><input id="filter" class="search" placeholder="Search by name or ID…"></div><div id="listRows">${list.length?list.map(([id,b])=>businessRow(id,b)).join(""):`<div class="empty-state"><h3>No businesses found</h3><p>Start by adding your first card.</p></div>`}</div></section>`;
  $("#filter")?.addEventListener("input",e=>{const q=e.target.value.toLowerCase();$("#listRows").innerHTML=list.filter(([id,b])=>(id+" "+b.name).toLowerCase().includes(q)).map(([id,b])=>businessRow(id,b)).join("")||'<p class="muted pad">No matching businesses.</p>';bindRowButtons();});
  bindRowButtons();
}
function bindRowButtons() {
  document.querySelectorAll("[data-edit]").forEach(b=>b.onclick=()=>showView("edit",b.dataset.edit));
}
function renderBusinessForm(b=null) {
  const editing=!!b;
  $("#content").innerHTML=`
  <section class="panel form-panel"><div class="panel-head"><div><h3>${editing?"Edit business profile":"Create a business profile"}</h3><p>Enter business details, then scan the QR code to capture its unique card ID.</p></div><span class="step-tag">STEP 01 / 02</span></div>
  <form id="businessForm" class="business-form">
    <div class="form-section"><h4>Business information</h4><div class="form-grid"><label>Business name <em>*</em><input name="name" required maxlength="100" value="${esc(b?.name||"")}" placeholder="e.g. The Coffee House"></label><label>Business description<textarea name="description" rows="3" maxlength="500" placeholder="A short introduction about this business…">${esc(b?.description||"")}</textarea></label></div></div>
    <div class="form-section"><h4>NFC card identification</h4><div class="scan-box"><div><b>Scan your card QR code</b><p>Camera se QR scan karein ya full URL paste karein. Last part ko Unique ID maana jayega.</p></div><button class="btn secondary" type="button" id="scanBtn">▦ Scan QR code</button></div><div id="reader" class="reader"></div><label>Full QR target URL<input id="qrUrl" placeholder="https://modulos.in/nfcbusinesscp/20473" value="${editing?esc(publicUrl(b.cardId||"")):""}"></label><label>Unique card ID <em>*</em><input id="cardId" name="cardId" required value="${esc(b?.cardId||"")}" placeholder="e.g. 20473" ${editing?"readonly":""}></label><small class="hint">Har card ki ID unique honi chahiye. QR URL ka last segment ID ke roop mein save hota hai.</small></div>
    <div class="form-section"><h4>Business links</h4><p class="section-note">Google Review button public card par sabse pehle dikhega.</p><div class="form-grid two">
      <label class="span-2">★ Google Review URL<input name="googleReview" type="url" value="${esc(b?.googleReview||"")}" placeholder="https://g.page/r/..."></label>
      <label>WhatsApp number or link<input name="whatsapp" value="${esc(b?.whatsapp||"")}" placeholder="+91 98765 43210 or wa.me link"></label>
      <label>Instagram URL<input name="instagram" type="url" value="${esc(b?.instagram||"")}" placeholder="https://instagram.com/..."></label>
      <label>Facebook URL<input name="facebook" type="url" value="${esc(b?.facebook||"")}" placeholder="https://facebook.com/..."></label>
      <label>YouTube URL<input name="youtube" type="url" value="${esc(b?.youtube||"")}" placeholder="https://youtube.com/..."></label>
      <label class="span-2">Location / Google Maps URL<input name="location" value="${esc(b?.location||"")}" placeholder="https://maps.google.com/..."></label>
    </div></div>
    <div class="form-actions"><button type="button" class="btn secondary" id="cancelForm">Cancel</button><button type="submit" class="btn primary">${editing?"Save changes":"Create business"} <span>→</span></button></div>
  </form></section>`;
  $("#cancelForm").onclick=()=>showView("businesses");
  $("#qrUrl").addEventListener("change",e=>{const id=extractId(e.target.value);if(id&&!editing)$("#cardId").value=id;});
  $("#scanBtn").onclick=startQrScanner;
  $("#businessForm").onsubmit=async e=>{
    e.preventDefault();
    const form=new FormData(e.currentTarget);
    const id=cleanId(form.get("cardId"));
    if(!id)return toast("QR scan karein ya unique ID enter karein.");
    if(!editing && businesses[id])return toast("Ye card ID pehle se registered hai.");
    const record={
      cardId:id,name:String(form.get("name")||"").trim(),description:String(form.get("description")||"").trim(),
      googleReview:String(form.get("googleReview")||"").trim(),whatsapp:normalizeWhatsApp(String(form.get("whatsapp")||"").trim()),
      instagram:String(form.get("instagram")||"").trim(),facebook:String(form.get("facebook")||"").trim(),
      youtube:String(form.get("youtube")||"").trim(),location:String(form.get("location")||"").trim(),
      updatedAt:new Date().toISOString(),createdAt:b?.createdAt||new Date().toISOString()
    };
    if(!record.name)return toast("Business name zaroori hai.");
    const btn=e.submitter;btn.disabled=true;btn.textContent="Saving…";
    try{await set(ref(db,"businesses/"+id),record);toast("Business successfully save ho gaya.");showView("businesses");}
    catch(err){toast("Save failed: "+err.message);btn.disabled=false;btn.textContent=editing?"Save changes":"Create business";}
  };
}
function extractId(value) {
  try { const u=new URL(value);const parts=u.pathname.split("/").filter(Boolean);return cleanId(parts.at(-1)); }
  catch { const parts=String(value).split("/").filter(Boolean);return cleanId(parts.at(-1)); }
}
async function startQrScanner() {
  const box=$("#reader");
  if(!window.Html5Qrcode){
    const s=document.createElement("script");s.src="https://unpkg.com/html5-qrcode@2.3.8/html5-qrcode.min.js";
    s.onload=()=>startQrScanner();s.onerror=()=>toast("QR scanner library load nahi hui.");document.head.append(s);return;
  }
  box.innerHTML='<div id="qr-reader"></div><button type="button" class="text-button" id="stopScan">Stop camera</button>';
  const scanner=new Html5Qrcode("qr-reader");
  $("#stopScan").onclick=async()=>{try{await scanner.stop();}catch{}box.innerHTML="";};
  try{
    await scanner.start({facingMode:"environment"},{fps:10,qrbox:{width:230,height:230}},async decoded=>{
      $("#qrUrl").value=decoded;const id=extractId(decoded);if(id)$("#cardId").value=id;
      await scanner.stop();box.innerHTML='<p class="success-note">QR scanned. Card ID captured: '+esc(id)+'</p>';
    },()=>{});
  }catch(e){box.innerHTML='<p class="error-note">Camera permission ya HTTPS required hai. URL manually paste kar sakte hain.</p>';}
}
async function renderPublicPage() {
  const id=decodeURIComponent(location.pathname.replace(/\/+$/,"").split("/").pop()||"");
  let b=null;
  try{const snap=await get(ref(db,"businesses/"+cleanId(id)));b=snap.val();}
  catch(e){console.error(e);}
  if(!b){
    $("#app").innerHTML=`<main class="public-wrap"><section class="public-card not-found"><div class="logo">M</div><h1>Card not found</h1><p>Ye NFC card abhi register nahi hua hai.</p><small>Card ID: ${esc(id)}</small></section></main>`;return;
  }
  const buttons=[
    ["★","Google Review",b.googleReview,"review"],["◉","WhatsApp",whatsAppUrl(b.whatsapp),"whatsapp"],
    ["◎","Instagram",b.instagram,"instagram"],["f","Facebook",b.facebook,"facebook"],
    ["▶","YouTube",b.youtube,"youtube"],["⌖","Location",b.location,"location"]
  ].filter(x=>x[2]);
  $("#app").innerHTML=`<main class="public-wrap"><article class="public-card"><div class="public-top"><div class="public-brand"><span class="logo small-logo">M</span><span>MODULOS <small>DIGITAL BUSINESS CARD</small></span></div><span class="live-dot">● ONLINE</span></div><div class="public-heading"><span class="eyebrow blue">CONNECT WITH US</span><h1>${esc(b.name)}</h1><p>${esc(b.description||"We would love to connect with you.")}</p></div><div class="public-actions">${buttons.map(([icon,label,url,kind])=>`<a class="public-action ${kind==="review"?"review-action":""}" href="${esc(url)}" target="_blank" rel="noopener noreferrer"><span class="action-icon">${icon}</span><b>${label}</b><span class="arrow">↗</span></a>`).join("")}</div><div class="public-bottom">THANK YOU FOR CONNECTING <span>POWERED BY MODULOS</span></div></article></main>`;
}
function whatsAppUrl(value) {
  if(!value)return "";
  if(/^https?:\/\//i.test(value))return value;
  const n=value.replace(/\D/g,"");return n?`https://wa.me/${n}`:"";
}
onAuthStateChanged(auth, user => {
  if(isPublicRoute()) { renderPublicPage(); return; }
  if(user && user.email?.toLowerCase()===ADMIN_EMAIL.toLowerCase() && user.emailVerified) renderDashboard();
  else { if(user) signOut(auth); renderLogin(); }
});
