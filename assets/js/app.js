// ================================
// OIKOS — app.js (COMPLETO)
// Firebase integrado
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
  DEFAULT_THREADS: ["gabriel","alice","ice"],

  mem: {
    c01:false,
    c02:false,
    c03:false,
    admin:false,
    archiveFolders:{},
    archiveFiles:{}
  },

  norm(v){
    return (v||"").toString().trim().toLowerCase().replace(/\s+/g," ");
  },

  resolveKey(obj,rawKey){
    if(!obj) return rawKey;
    if(Object.prototype.hasOwnProperty.call(obj,rawKey)) return rawKey;
    const target=this.norm(rawKey);
    const found=Object.keys(obj).find(k=>this.norm(k)===target);
    return found||rawKey;
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
    if(ok){
      this.sset(this.S.logged,"1");
    }
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

  checkCode(code,type,target=null){
    const x=this.norm(code);
    const map={
      c01:window.OIKOS_KEYS?.CODE_01||[],
      c02:window.OIKOS_KEYS?.CODE_02||[],
      c03:window.OIKOS_KEYS?.CODE_03||[],
      c04:window.OIKOS_KEYS?.CODE_04||[],
      admin:window.OIKOS_KEYS?.ADMIN||[]
    };

    if(type==="archiveFolder"){
      const folderMap=window.OIKOS_KEYS?.ARCHIVE_FOLDERS||{};
      const real=this.resolveKey(folderMap,target||"");
      const list=(folderMap[real]||[]).map(v=>this.norm(v));
      return list.includes(x);
    }

    if(type==="archiveFile"){
      const fileMap=window.OIKOS_KEYS?.ARCHIVE_FILES||{};
      const real=this.resolveKey(fileMap,target||"");
      const list=(fileMap[real]||[]).map(v=>this.norm(v));
      return list.includes(x);
    }

    const list=(map[type]||[]).map(v=>this.norm(v));
    return list.includes(x);
  },

  getAdminName(){
    return localStorage.getItem(this.S.adminName)||"ADMIN";
  },

  setAdminName(v){
    const name=(v||"").toString().trim();
    if(name) localStorage.setItem(this.S.adminName,name);
  },

  // 🔥 FIREBASE MESSAGE
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

// ================================
// HELPERS
// ================================

function $(sel){ return document.querySelector(sel); }
function $all(sel){ return Array.from(document.querySelectorAll(sel)); }

// ================================
// FIREBASE LISTENER
// ================================

function listenThread(threadKey,callback){

  const q=query(
    collection(db,"threads",threadKey,"messages"),
    orderBy("at")
  );

  onSnapshot(q,(snapshot)=>{
    const messages=[];
    snapshot.forEach(doc=>messages.push(doc.data()));
    callback(messages);
  });

}

// ================================
// MODAL
// ================================

function setupCodeModal(){

  const modal=$("#codeModal");
  const modalTitle=$("#modalTitle");
  const modalMsg=$("#modalMsg");
  const modalClose=$("#modalClose");
  const modalForm=$("#modalForm");
  const modalCode=$("#modalCode");

  if(!modal||!modalForm||!modalCode){
    return { openModal:()=>{}, closeModal:()=>{} };
  }

  modal.style.display="none";

  let pendingAction=null;
  let requiredType=null;
  let requiredTarget=null;

  function openModal(title,type,action,opts={}){

    pendingAction=typeof action==="function"?action:null;
    requiredType=type||null;
    requiredTarget=opts.target||null;

    modalTitle.textContent=title||"Inserir código";
    modalMsg.textContent="";
    modalCode.value="";

    modal.style.display="flex";
    setTimeout(()=>modalCode.focus(),30);
  }

  function closeModal(){
    modal.style.display="none";
    pendingAction=null;
    requiredType=null;
    requiredTarget=null;
    modalMsg.textContent="";
    modalCode.value="";
  }

  modalClose?.addEventListener("click",closeModal);
  modal.addEventListener("click",(e)=>{ if(e.target===modal) closeModal(); });

  modalForm.addEventListener("submit",(e)=>{
    e.preventDefault();

    const val=modalCode.value||"";
    const ok=requiredType?OIKOS.checkCode(val,requiredType,requiredTarget):false;

    modalMsg.textContent=ok?"✓ padrão reconhecido":"× padrão não reconhecido";

    if(ok){
      if(requiredType==="c01"||requiredType==="c02"||requiredType==="c03"||requiredType==="admin"){
        OIKOS.markUnlocked(requiredType);
      }
      setTimeout(()=>{
        closeModal();
        if(pendingAction) pendingAction();
      },180);
    }

  });

  return { openModal, closeModal };

}

// ================================
// RESET
// ================================

function bindSecretReset(){
  document.addEventListener("keydown",(e)=>{
    if(e.ctrlKey&&e.shiftKey&&(e.key==="R"||e.key==="r")){
      e.preventDefault();
      localStorage.clear();
      try{sessionStorage.clear();}catch{}
      location.reload();
    }
  });
}

// ================================
// INDEX
// ================================

function initIndex(){

  const form=$("#loginForm");
  if(!form) return;

  form.addEventListener("submit",(e)=>{
    e.preventDefault();

    const pass=$("#senha")?.value||"";
    const ok=OIKOS.login(pass);

    const msg=$("#loginMsg");
    if(msg) msg.textContent=ok?"✓":"×";

    if(ok) setTimeout(()=>window.location.href="rede.html",180);
  });

}
// ================================
// REDE
// ================================

function initRede(){

  const root=$("#redeRoot");
  if(!root) return;

  OIKOS.requireLogin();
  OIKOS.loadSessionFlags();
  bindSecretReset();

  const tabs=$all("[data-tab]");
  const panels=$all("[data-panel]");

  const lockMensagens=$("#lockMensagens");
  const contentMensagens=$("#contentMensagens");

  const tabArquivo=$("#tabArquivo");
  const tabNaoVoltei=$("#tabNaoVoltei");

  const { openModal }=setupCodeModal();

  const logo=document.getElementById("oikosLogo");
  if(logo){
    logo.addEventListener("click",()=>{
      if(OIKOS.mem.admin){
        window.location.href="admin.html";
      }else{
        openModal("Acesso restrito — ADMIN","admin",()=>{
          window.location.href="admin.html";
        });
      }
    });
  }

  function setTab(name){
    tabs.forEach(t=>t.classList.toggle("active",t.dataset.tab===name));
    panels.forEach(p=>p.style.display=(p.dataset.panel===name?"flex":"none"));
  }

  function showMensagensLocked(){
    if(lockMensagens) lockMensagens.style.display="block";
    if(contentMensagens){
      contentMensagens.style.display="none";
      contentMensagens.style.pointerEvents="none";
      contentMensagens.style.opacity=".35";
    }
  }

  function showMensagensUnlocked(){
    if(lockMensagens) lockMensagens.style.display="none";
    if(contentMensagens){
      contentMensagens.style.display="block";
      contentMensagens.style.pointerEvents="auto";
      contentMensagens.style.opacity="1";
    }
  }

  setTab("mensagens");
  if(OIKOS.mem.c01) showMensagensUnlocked();
  else showMensagensLocked();

  function unlockMensagens(){
    openModal("Requer Código 01 — Mensagens","c01",()=>{
      showMensagensUnlocked();
      setTab("mensagens");
    });
  }

  tabs.forEach(t=>{
    t.addEventListener("click",()=>{
      if(t.dataset.tab==="mensagens"){
        if(!OIKOS.mem.c01) return unlockMensagens();
        setTab("mensagens");
        showMensagensUnlocked();
      }
    });
  });

  lockMensagens?.addEventListener("click",unlockMensagens);

  tabArquivo?.addEventListener("click",(e)=>{
    e.preventDefault();
    if(OIKOS.mem.c02) return window.location.href="arquivos.html";
    openModal("Requer Código 02 — Arquivo","c02",()=>window.location.href="arquivos.html");
  });

  tabNaoVoltei?.addEventListener("click",(e)=>{
    e.preventDefault();
    if(OIKOS.mem.c03) return window.location.href="nao-voltei.html";
    openModal("Requer Código 03 — Se eu não voltar","c03",()=>window.location.href="nao-voltei.html");
  });

  // 🔥 CHAT FIREBASE

  let currentThread=null;

  $all(".msgBtn").forEach(btn=>{
    btn.addEventListener("click",()=>{
      currentThread=btn.dataset.msg;

      $("#msgTitle").textContent="Conversa — "+currentThread;

      listenThread(currentThread,(messages)=>{

        const log=$("#msgLog");
        if(!log) return;

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
    if(!currentThread) return;

    const input=$("#msgInput");
    const txt=(input?.value||"").trim();
    if(!txt) return;

    OIKOS.pushMessage(currentThread,OIKOS.USER_NAME,txt);
    input.value="";
  });

  $("#btnLogout")?.addEventListener("click",()=>OIKOS.logout());
}

// ================================
// ARQUIVO
// ================================

function initArquivos(){

  const root=$("#arquivoRoot");
  if(!root) return;

  OIKOS.requireLogin();
  OIKOS.loadSessionFlags();
  bindSecretReset();

  const lock=$("#lockArquivoPage");
  const content=$("#contentArquivoPage");

  const folderList=$("#folderList");
  const folderStatus=$("#folderStatus");
  const fileList=$("#fileList");
  const fileStatus=$("#fileStatus");

  const viewerTitle=$("#viewerTitle");
  const viewerHint=$("#viewerHint");
  const viewerBox=$("#viewerBox");
  const imgView=$("#imgView");

  const { openModal }=setupCodeModal();

  function lockUI(){
    if(lock) lock.style.display="block";
    if(content) content.style.display="none";
  }

  function unlockUI(){
    if(lock) lock.style.display="none";
    if(content) content.style.display="block";
  }

  if(OIKOS.mem.c02) unlockUI();
  else{
    lockUI();
    openModal("Requer Código 02 — Arquivo","c02",()=>unlockUI());
  }

  folderList?.addEventListener("click",(e)=>{
    const btn=e.target.closest("[data-folder]");
    if(!btn) return;

    const folder=btn.getAttribute("data-folder");
    if(!folder) return;

    fileList.innerHTML="";
    folderStatus.textContent="Verificando acesso — "+folder+"…";

    const folderMap=window.OIKOS_KEYS?.ARCHIVE_FOLDERS||{};
    const realFolder=OIKOS.resolveKey(folderMap,folder);

    if(!OIKOS.hasFolderAccess(realFolder)){
      openModal("Requer sub-código — "+realFolder,"archiveFolder",()=>{
        OIKOS.mem.archiveFolders[realFolder]=true;
        renderFiles(realFolder);
      },{target:realFolder});
      return;
    }

    renderFiles(realFolder);
  });

  function renderFiles(folder){

    const idx=window.OIKOS_KEYS?.ARCHIVE_INDEX||{};
    const files=Array.isArray(idx[folder])?idx[folder]:[];

    if(!files.length){
      fileStatus.textContent="Sem ficheiros.";
      return;
    }

    fileStatus.textContent="Seleciona um ficheiro.";

    files.forEach(name=>{

      const btn=document.createElement("button");
      btn.type="button";
      btn.className="item2 fileBtn";

      btn.innerHTML=`
        <p class="h">${name}</p>
        <div class="fileMeta">
          <span class="pill">PNG</span>
          <span class="pill">${folder}</span>
        </div>
      `;

      btn.addEventListener("click",()=>{
        imgView.src="./arquivos/"+folder+"/"+name;
        viewerTitle.textContent="VISUALIZAÇÃO — "+name;
        viewerHint.style.display="none";
        viewerBox.style.display="block";
      });

      fileList.appendChild(btn);
    });

  }

  $("#btnLogout")?.addEventListener("click",()=>OIKOS.logout());
}
// ================================
// SE EU NÃO VOLTAR
// ================================

function initNaoVoltei(){

  const root=$("#naoVolteiRoot");
  if(!root) return;

  OIKOS.requireLogin();
  OIKOS.loadSessionFlags();
  bindSecretReset();

  const lock=$("#lockNaoVolteiPage");
  const content=$("#contentNaoVolteiPage");

  const { openModal }=setupCodeModal();

  function lockUI(){
    if(lock) lock.style.display="block";
    if(content) content.style.display="none";
  }

  function unlockUI(){
    if(lock) lock.style.display="none";
    if(content) content.style.display="block";
  }

  if(OIKOS.mem.c03) unlockUI();
  else{
    lockUI();
    openModal("Requer Código 03 — Se eu não voltar","c03",()=>unlockUI());
  }

  lock?.addEventListener("click",()=>{
    openModal("Requer Código 03 — Se eu não voltar","c03",()=>unlockUI());
  });

  $("#btnLogout")?.addEventListener("click",()=>OIKOS.logout());
}

// ================================
// ADMIN (Firebase Real-time)
// ================================

function initAdmin(){

  const root=$("#adminRoot");
  if(!root) return;

  OIKOS.requireLogin();
  OIKOS.loadSessionFlags();
  bindSecretReset();

  const lock=$("#lockAdminPage");
  const content=$("#contentAdminPage");

  const threadsBox=$("#adminThreads");
  const title=$("#adminTitle");
  const logBox=$("#adminLog");

  const form=$("#adminForm");
  const adminName=$("#adminName");
  const adminInput=$("#adminInput");

  const { openModal }=setupCodeModal();

  let currentThread=null;

  function lockUI(){
    if(lock) lock.style.display="block";
    if(content) content.style.display="none";
  }

  function unlockUI(){
    if(lock) lock.style.display="none";
    if(content) content.style.display="block";
  }

  if(OIKOS.mem.admin) unlockUI();
  else{
    lockUI();
    openModal("Acesso restrito — ADMIN","admin",()=>unlockUI());
  }

  lock?.addEventListener("click",()=>{
    openModal("Acesso restrito — ADMIN","admin",()=>unlockUI());
  });

  if(adminName){
    adminName.value=OIKOS.getAdminName();
    adminName.addEventListener("change",()=>{
      OIKOS.setAdminName(adminName.value);
    });
  }

  function esc(s){
    return (s||"").toString()
      .replace(/&/g,"&amp;")
      .replace(/</g,"&lt;")
      .replace(/>/g,"&gt;");
  }

  function renderLog(messages){

    if(!logBox) return;

    logBox.innerHTML="";

    messages.forEach(m=>{
      const div=document.createElement("div");
      div.className="msgLine";
      div.innerHTML=`<strong>${esc(m.name)}:</strong> ${esc(m.text)}`;
      logBox.appendChild(div);
    });

    logBox.scrollTop=logBox.scrollHeight;
  }

  function openThread(thread){

    currentThread=thread;
    title.textContent="Conversa — "+thread;

    listenThread(thread,(messages)=>{
      renderLog(messages);
    });
  }

  function renderThreads(){

    if(!threadsBox) return;

    threadsBox.innerHTML="";

    OIKOS.DEFAULT_THREADS.forEach(k=>{

      const btn=document.createElement("button");
      btn.type="button";
      btn.className="item2";
      btn.innerHTML=`<p class="h">${k}</p>`;

      btn.addEventListener("click",()=>openThread(k));

      threadsBox.appendChild(btn);
    });

  }

  form?.addEventListener("submit",(e)=>{
    e.preventDefault();

    if(!currentThread) return;

    const txt=(adminInput?.value||"").trim();
    if(!txt) return;

    const sign=(adminName?.value||"ADMIN").trim();
    OIKOS.setAdminName(sign);

    OIKOS.pushMessage(currentThread,sign,txt);

    adminInput.value="";
  });

  renderThreads();

  $("#btnLogout")?.addEventListener("click",()=>OIKOS.logout());
}

// ================================
// AUTO INIT
// ================================

document.addEventListener("DOMContentLoaded",()=>{

  initIndex();
  initRede();
  initArquivos();
  initNaoVoltei();
  initAdmin();

});
