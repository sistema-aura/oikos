// ================================
// OIKOS — app.js (FINAL ESTÁVEL)
// Compatível com o rede.html atual
// ADMIN: segurar no "OIKOS" por 2.2s
// ================================

const OIKOS = {
  S: {
    logged: "oikos_logged_session",
    c01: "oikos_c01_session",
    c02: "oikos_c02_session",
    c03: "oikos_c03_session",
    admin: "oikos_admin_session",
    threads: "oikos_threads",
    adminName: "oikos_admin_name"
  },

  USER_NAME: "Duda",
  DEFAULT_THREADS: ["gabriel", "alice", "ice"],

  mem: { c01:false, c02:false, c03:false, admin:false },

  norm(v){
    return (v||"").toString().trim().toLowerCase().replace(/\s+/g," ");
  },

  sget(k){ try{return sessionStorage.getItem(k);}catch{return null;} },
  sset(k,v){ try{sessionStorage.setItem(k,v);}catch{} },

  isLogged(){ return this.sget(this.S.logged)==="1"; },

  requireLogin(){
    if(!this.isLogged()) location.href="index.html";
  },

  login(pass){
    const x=this.norm(pass);
    const list=(window.OIKOS_KEYS?.LOGIN||[]).map(v=>this.norm(v));
    if(list.includes(x)){
      this.sset(this.S.logged,"1");
      this.ensureThreads();
      return true;
    }
    return false;
  },

  logout(){
    try{sessionStorage.clear();}catch{}
    location.href="index.html";
  },

  loadSessionFlags(){
    this.mem.c01=this.sget(this.S.c01)==="1";
    this.mem.c02=this.sget(this.S.c02)==="1";
    this.mem.c03=this.sget(this.S.c03)==="1";
    this.mem.admin=this.sget(this.S.admin)==="1";
  },

  markUnlocked(t){
    this.mem[t]=true;
    this.sset(this.S[t],"1");
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

  getThreads(){
    try{return JSON.parse(localStorage.getItem(this.S.threads))||{};}
    catch{return {};}
  },

  setThreads(t){
    localStorage.setItem(this.S.threads,JSON.stringify(t));
  },

  ensureThreads(){
    const t=this.getThreads();
    this.DEFAULT_THREADS.forEach(k=>{ if(!Array.isArray(t[k])) t[k]=[]; });
    this.setThreads(t);
  },

  pushMessage(who,name,text){
    const k=this.norm(who);
    const t=this.getThreads();
    t[k]=t[k]||[];
    t[k].push({name,text,at:Date.now()});
    this.setThreads(t);
  },

  getAdminName(){
    return localStorage.getItem(this.S.adminName)||"ADMIN";
  },

  setAdminName(v){
    if(v) localStorage.setItem(this.S.adminName,v);
  }
};

const $=s=>document.querySelector(s);
const $all=s=>Array.from(document.querySelectorAll(s));

// ========= MODAL =========
function setupCodeModal(){
  const modal=$("#codeModal");
  const form=$("#modalForm");
  const input=$("#modalCode");
  const msg=$("#modalMsg");
  const title=$("#modalTitle");
  const close=$("#modalClose");

  let type=null, action=null;

  function open(t,ty,cb){
    title.textContent=t;
    msg.textContent="";
    input.value="";
    type=ty;
    action=cb;
    modal.style.display="flex";
    setTimeout(()=>input.focus(),30);
  }

  function shut(){
    modal.style.display="none";
    type=null; action=null;
  }

  close.onclick=shut;
  modal.onclick=e=>{ if(e.target===modal)shut(); };

  form.onsubmit=e=>{
    e.preventDefault();
    const ok=OIKOS.checkCode(input.value,type);
    msg.textContent=ok?"✓ padrão reconhecido":"× padrão não reconhecido";
    if(ok){
      OIKOS.markUnlocked(type);
      setTimeout(()=>{
        shut();
        action&&action();
      },180);
    }
  };

  return {open};
}

// ========= INDEX =========
function initIndex(){
  const f=$("#loginForm");
  if(!f) return;
  f.onsubmit=e=>{
    e.preventDefault();
    const ok=OIKOS.login($("#senha").value);
    $("#loginMsg").textContent=ok?"✓":"×";
    if(ok) setTimeout(()=>location.href="rede.html",180);
  };
}

// ========= REDE =========
function initRede(){
  const root=$("#redeRoot");
  if(!root) return;

  OIKOS.requireLogin();
  OIKOS.loadSessionFlags();
  OIKOS.ensureThreads();

  const modal=setupCodeModal();

  // ---- ADMIN SECRETO ----
  const logo=root.querySelector(".logo");
  if(logo){
    let timer=null;
    logo.style.userSelect="none";
    logo.addEventListener("mousedown",()=>{
      timer=setTimeout(()=>{
        modal.open("Área reservada — ADMIN","admin",()=>{
          document.querySelector('[data-panel="admin"]').style.display="flex";
          document.querySelector('[data-panel="mensagens"]').style.display="none";
          renderAdmin();
        });
      },2200);
    });
    ["mouseup","mouseleave"].forEach(ev=>{
      logo.addEventListener(ev,()=>{ clearTimeout(timer); });
    });
    logo.addEventListener("touchstart",()=>{
      timer=setTimeout(()=>{
        modal.open("Área reservada — ADMIN","admin",()=>{
          document.querySelector('[data-panel="admin"]').style.display="flex";
          document.querySelector('[data-panel="mensagens"]').style.display="none";
          renderAdmin();
        });
      },2200);
    });
    ["touchend","touchcancel"].forEach(ev=>{
      logo.addEventListener(ev,()=>{ clearTimeout(timer); });
    });
  }

  // ---- MENSAGENS ----
  const lock=$("#lockMensagens");
  const content=$("#contentMensagens");

  function showLocked(){
    lock.style.display="block";
    content.style.display="none";
  }
  function showOpen(){
    lock.style.display="none";
    content.style.display="block";
    content.style.pointerEvents="auto";
    content.style.opacity="1";
  }

  if(OIKOS.mem.c01) showOpen();
  else showLocked();

  lock.onclick=()=>{
    modal.open("Requer Código 01 — Mensagens","c01",showOpen);
  };

  const btns=$all(".msgBtn");
  let active=null;

  function renderThread(who){
    const log=$("#msgLog");
    log.innerHTML="";
    (OIKOS.getThreads()[who]||[]).forEach(m=>{
      const d=document.createElement("div");
      d.textContent=m.name+": "+m.text;
      log.appendChild(d);
    });
  }

  btns.forEach(b=>{
    b.onclick=()=>{
      active=b.dataset.msg;
      renderThread(active);
    };
  });

  $("#msgForm").onsubmit=e=>{
    e.preventDefault();
    if(!OIKOS.mem.c01) return;
    const t=$("#msgInput").value.trim();
    if(!t) return;
    OIKOS.pushMessage(active,OIKOS.USER_NAME,t);
    $("#msgInput").value="";
    renderThread(active);
  };

  $("#btnLogout").onclick=()=>OIKOS.logout();
}

// ========= ADMIN =========
function renderAdmin(){
  if(!OIKOS.mem.admin) return;
  const box=$("#adminThreads");
  const log=$("#adminLog");
  const title=$("#adminTitle");
  box.innerHTML="";
  const t=OIKOS.getThreads();
  Object.keys(t).forEach(k=>{
    const d=document.createElement("div");
    d.textContent=k.toUpperCase();
    d.onclick=()=>{
      title.textContent=k.toUpperCase();
      log.innerHTML="";
      t[k].forEach(m=>{
        const p=document.createElement("div");
        p.textContent=m.name+": "+m.text;
        log.appendChild(p);
      });
    };
    box.appendChild(d);
  });

  $("#adminForm").onsubmit=e=>{
    e.preventDefault();
    const text=$("#adminInput").value.trim();
    if(!text) return;
    const name=$("#adminName").value||OIKOS.getAdminName();
    OIKOS.setAdminName(name);
    const k=title.textContent.toLowerCase();
    OIKOS.pushMessage(k,name,text);
    $("#adminInput").value="";
    renderAdmin();
  };
}

// ========= OUTROS =========
function initArquivos(){}
function initNaoVoltei(){}

// ========= START =========
document.addEventListener("DOMContentLoaded",()=>{
  initIndex();
  initRede();
  initArquivos();
  initNaoVoltei();
});
