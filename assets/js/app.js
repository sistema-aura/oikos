// ================================
// OIKOS — app.js (FIREBASE CHAT)
// LOGIN / CÓDIGOS / ARQUIVO iguais
// MENSAGENS: Firebase em tempo real
// ================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { 
  getFirestore,
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyArqJ70FWqjk4fQ_chYO8AjfBxYgOB-J3E",
  authDomain: "oikos-chat.firebaseapp.com",
  projectId: "oikos-chat",
  storageBucket: "oikos-chat.firebasestorage.app",
  messagingSenderId: "61612665792",
  appId: "1:61612665792:web:99cbbd6f4fb0f8c381b625"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const OIKOS = {
  S: {
    logged: "oikos_logged_session",
    c01: "oikos_c01_session",
    c02: "oikos_c02_session",
    c03: "oikos_c03_session",
    admin: "oikos_admin_session",
    adminName: "oikos_admin_name"
  },

  USER_NAME: "Duda",
  DEFAULT_THREADS: ["gabriel", "alice", "ice"],

  mem: {
    c01: false,
    c02: false,
    c03: false,
    admin: false
  },

  norm(v) {
    return (v || "").toString().trim().toLowerCase().replace(/\s+/g, " ");
  },

  sget(k) { try { return sessionStorage.getItem(k); } catch { return null; } },
  sset(k, v) { try { sessionStorage.setItem(k, v); } catch {} },

  isLogged() { return this.sget(this.S.logged) === "1"; },

  requireLogin() {
    if (!this.isLogged()) window.location.href = "index.html";
  },

  login(pass) {
    const x = this.norm(pass);
    const list = (window.OIKOS_KEYS?.LOGIN || []).map(v => this.norm(v));
    if (list.includes(x)) {
      this.sset(this.S.logged, "1");
      return true;
    }
    return false;
  },

  logout() {
    sessionStorage.clear();
    window.location.href = "index.html";
  },

  loadSessionFlags() {
    this.mem.c01 = (this.sget(this.S.c01) === "1");
    this.mem.c02 = (this.sget(this.S.c02) === "1");
    this.mem.c03 = (this.sget(this.S.c03) === "1");
    this.mem.admin = (this.sget(this.S.admin) === "1");
  },

  markUnlocked(type) {
    this.mem[type] = true;
    this.sset(this.S[type], "1");
  },

  checkCode(code, type) {
    const x = this.norm(code);
    const map = {
      c01: window.OIKOS_KEYS?.CODE_01 || [],
      c02: window.OIKOS_KEYS?.CODE_02 || [],
      c03: window.OIKOS_KEYS?.CODE_03 || [],
      admin: window.OIKOS_KEYS?.ADMIN || []
    };
    return (map[type] || []).map(v => this.norm(v)).includes(x);
  },

  getAdminName() { return localStorage.getItem(this.S.adminName) || "ADMIN"; },
  setAdminName(v) {
    if (v) localStorage.setItem(this.S.adminName, v);
  },

  // 🔥 FIREBASE MESSAGE SEND
pushMessage(thread, name, text) {
  addDoc(
    collection(db, "threads", this.norm(thread), "messages"),
    {
      name,
      text,
      at: serverTimestamp()
    }
  );
},

function $(s){ return document.querySelector(s); }
function $all(s){ return Array.from(document.querySelectorAll(s)); }

// 🔥 FIREBASE LISTENER
function listenThread(threadKey, callback) {

  if (!window.OIKOS_FIREBASE) return;

  const { db, collection, onSnapshot, query, orderBy } = window.OIKOS_FIREBASE;

  const q = query(
    collection(db, "threads", threadKey, "messages"),
    orderBy("at")
  );

  onSnapshot(q, (snap)=>{
    const msgs=[];
    snap.forEach(d=>msgs.push(d.data()));
    callback(msgs);
  });
}

// ========= INDEX =========
function initIndex(){
  const form=$("#loginForm");
  if(!form) return;

  form.addEventListener("submit",(e)=>{
    e.preventDefault();
    const ok=OIKOS.login($("#senha")?.value||"");
    if(ok) window.location.href="rede.html";
  });
}

// ========= REDE =========
function initRede(){
  if(!$("#redeRoot")) return;

  OIKOS.requireLogin();
  OIKOS.loadSessionFlags();

  let currentThread=null;

  $all(".msgBtn").forEach(btn=>{
    btn.addEventListener("click",()=>{
      currentThread=btn.dataset.msg;
      $("#msgTitle").textContent="Conversa — "+currentThread;

      listenThread(currentThread,(messages)=>{
        const log=$("#msgLog");
        log.innerHTML="";
        messages.forEach(m=>{
          const div=document.createElement("div");
          div.innerHTML=`<strong>${m.name}:</strong> ${m.text}`;
          log.appendChild(div);
        });
        log.scrollTop=log.scrollHeight;
      });
    });
  });

  $("#msgForm")?.addEventListener("submit",(e)=>{
    e.preventDefault();
    if(!currentThread) return;

    const txt=$("#msgInput")?.value.trim();
    if(!txt) return;

    OIKOS.pushMessage(currentThread,OIKOS.USER_NAME,txt);
    $("#msgInput").value="";
  });

  $("#btnLogout")?.addEventListener("click",()=>OIKOS.logout());
}

// ========= ADMIN =========
function initAdmin(){
  if(!$("#adminRoot")) return;

  OIKOS.requireLogin();
  OIKOS.loadSessionFlags();

  let currentThread=null;
  const logBox=$("#adminLog");

  $all("#adminThreads button").forEach(btn=>{
    btn.addEventListener("click",()=>{
      currentThread=btn.textContent.trim();
      $("#adminTitle").textContent="Conversa — "+currentThread;

      listenThread(currentThread,(messages)=>{
        logBox.innerHTML="";
        messages.forEach(m=>{
          const div=document.createElement("div");
          div.className="msgLine";
          div.innerHTML=`<strong>${m.name}:</strong> ${m.text}`;
          logBox.appendChild(div);
        });
        logBox.scrollTop=logBox.scrollHeight;
      });
    });
  });

  $("#adminForm")?.addEventListener("submit",(e)=>{
    e.preventDefault();
    if(!currentThread) return;

    const txt=$("#adminInput")?.value.trim();
    if(!txt) return;

    const name=$("#adminName")?.value.trim()||"ADMIN";
    OIKOS.setAdminName(name);

    OIKOS.pushMessage(currentThread,name,txt);
    $("#adminInput").value="";
  });

  $("#btnLogout")?.addEventListener("click",()=>OIKOS.logout());
}

document.addEventListener("DOMContentLoaded",()=>{
  initIndex();
  initRede();
  initAdmin();
});
