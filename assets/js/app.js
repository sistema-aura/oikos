// 🔥 FIREBASE
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

// ================================
// OIKOS CORE (INALTERADO)
// ================================

const OIKOS = {

  S: {
    logged: "oikos_logged_session",
    c01: "oikos_c01_session",
    c02: "oikos_c02_session",
    c03: "oikos_c03_session",
    admin: "oikos_admin_session"
  },

  USER_NAME: "Duda",
  DEFAULT_THREADS: ["gabriel","alice","ice"],

  mem:{
    c01:false,
    c02:false,
    c03:false,
    admin:false
  },

  norm(v){
    return (v||"").toString().trim().toLowerCase().replace(/\s+/g," ");
  },

  sget(k){ try{return sessionStorage.getItem(k);}catch{return null;} },
  sset(k,v){ try{sessionStorage.setItem(k,v);}catch{} },

  isLogged(){ return this.sget(this.S.logged)==="1"; },

  requireLogin(){
    if(!this.isLogged()) window.location.href="index.html";
  },

  login(pass){
    const x=this.norm(pass);
    const list=(window.OIKOS_KEYS?.LOGIN||[]).map(v=>this.norm(v));
    const ok=list.includes(x);
    if(ok) this.sset(this.S.logged,"1");
    return ok;
  },

  logout(){
    try{sessionStorage.clear();}catch{}
    window.location.href="index.html";
  },

  loadSessionFlags(){
    this.mem.c01=(this.sget(this.S.c01)==="1");
    this.mem.c02=(this.sget(this.S.c02)==="1");
    this.mem.c03=(this.sget(this.S.c03)==="1");
    this.mem.admin=(this.sget(this.S.admin)==="1");
  },

  markUnlocked(type){
    if(type==="c01"){this.mem.c01=true;this.sset(this.S.c01,"1");}
    if(type==="c02"){this.mem.c02=true;this.sset(this.S.c02,"1");}
    if(type==="c03"){this.mem.c03=true;this.sset(this.S.c03,"1");}
    if(type==="admin"){this.mem.admin=true;this.sset(this.S.admin,"1");}
  },

  checkCode(code,type){
    const x=this.norm(code);
    const map={
      c01:window.OIKOS_KEYS?.CODE_01||[],
      c02:window.OIKOS_KEYS?.CODE_02||[],
      c03:window.OIKOS_KEYS?.CODE_03||[],
      admin:window.OIKOS_KEYS?.ADMIN||[]
    };
    return (map[type]||[]).map(v=>this.norm(v)).includes(x);
  },

  // 🔥 NOVA pushMessage (FIREBASE)
  pushMessage(thread,name,text){
    addDoc(
      collection(db,"threads",this.norm(thread),"messages"),
      {
        name,
        text,
        at:serverTimestamp()
      }
    );
  }

};

function $(s){return document.querySelector(s);}
function $all(s){return Array.from(document.querySelectorAll(s));}

// 🔥 FIREBASE LISTENER
function listenThread(threadKey,callback){
  const q=query(
    collection(db,"threads",threadKey,"messages"),
    orderBy("at")
  );
  onSnapshot(q,(snap)=>{
    const msgs=[];
    snap.forEach(d=>msgs.push(d.data()));
    callback(msgs);
  });
}

// ================================
// INDEX
// ================================

function initIndex(){
  const form=$("#loginForm");
  if(!form)return;
  form.addEventListener("submit",(e)=>{
    e.preventDefault();
    const pass=$("#senha")?.value||"";
    const ok=OIKOS.login(pass);
    $("#loginMsg").textContent=ok?"✓":"×";
    if(ok)setTimeout(()=>window.location.href="rede.html",200);
  });
}

// ================================
// REDE (CHAT)
// ================================

function initRede(){
  const root=$("#redeRoot");
  if(!root)return;

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
          div.className="msgLine";
          div.innerHTML=`<strong>${m.name}:</strong> ${m.text}`;
          log.appendChild(div);
        });
        log.scrollTop=log.scrollHeight;
      });
    });
  });

  $("#msgForm")?.addEventListener("submit",(e)=>{
    e.preventDefault();
    if(!currentThread)return;
    const input=$("#msgInput");
    const txt=(input?.value||"").trim();
    if(!txt)return;
    OIKOS.pushMessage(currentThread,OIKOS.USER_NAME,txt);
    input.value="";
  });

  $("#btnLogout")?.addEventListener("click",()=>OIKOS.logout());
}

// ================================
// ADMIN
// ================================

function initAdmin(){
  const root=$("#adminRoot");
  if(!root)return;

  OIKOS.requireLogin();
  OIKOS.loadSessionFlags();

  const threadsBox=$("#adminThreads");
  const logBox=$("#adminLog");
  const title=$("#adminTitle");
  const form=$("#adminForm");
  const adminName=$("#adminName");
  const adminInput=$("#adminInput");

  let currentThread=null;

  const threadNames=["gabriel","alice","ice"];

  threadNames.forEach(k=>{
    const btn=document.createElement("button");
    btn.type="button";
    btn.className="item2";
    btn.innerHTML=`<p class="h">${k}</p>`;
    btn.addEventListener("click",()=>openThread(k));
    threadsBox.appendChild(btn);
  });

  function openThread(k){
    currentThread=k;
    title.textContent="Conversa — "+k;
    listenThread(k,(messages)=>{
      logBox.innerHTML="";
      messages.forEach(m=>{
        const div=document.createElement("div");
        div.className="msgLine";
        div.innerHTML=`<strong>${m.name}:</strong> ${m.text}`;
        logBox.appendChild(div);
      });
      logBox.scrollTop=logBox.scrollHeight;
    });
  }

  form?.addEventListener("submit",(e)=>{
    e.preventDefault();
    if(!currentThread)return;
    const txt=(adminInput?.value||"").trim();
    if(!txt)return;
    const sign=(adminName?.value||"ADMIN").trim();
    OIKOS.pushMessage(currentThread,sign,txt);
    adminInput.value="";
  });

  $("#btnLogout")?.addEventListener("click",()=>OIKOS.logout());
}

// ================================
// AUTO INIT
// ================================

document.addEventListener("DOMContentLoaded",()=>{
  initIndex();
  initRede();
  initAdmin();
});
