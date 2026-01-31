// ================================
// OIKOS — app.js (COMPLETO)
// LOGIN: 1x por sessão (sessionStorage)
// CÓDIGOS 01/02/03/ADMIN: 1x por sessão (sessionStorage)
// ARQUIVO: Código 02 + Sub-códigos por pasta/ficheiro (sessão)
// MENSAGENS: persistem (localStorage)
// ================================

const OIKOS = {
  S: {
    // sessão
    logged: "oikos_logged_session",
    c01: "oikos_c01_session",
    c02: "oikos_c02_session",
    c03: "oikos_c03_session",
    admin: "oikos_admin_session",

    // persistente
    threads: "oikos_threads",
    adminName: "oikos_admin_name"
  },

  USER_NAME: "Duda",
  DEFAULT_THREADS: ["gabriel", "alice", "ice"],

  mem: {
    c01: false,
    c02: false,
    c03: false,
    admin: false,

    // sub-acessos (sessão)
    archiveFolders: {}, // { Ice:true, ... }
    archiveFiles: {}    // { "Ice/relatorio.pdf":true, ... }
  },

  norm(v) {
    return (v || "")
      .toString()
      .trim()
      .toLowerCase()
      .replace(/\s+/g, " ");
  },

  // 🔧 resolve "Ice" vs "ice" (devolve a key real do objeto)
  resolveKey(obj, rawKey) {
    if (!obj) return rawKey;
    if (Object.prototype.hasOwnProperty.call(obj, rawKey)) return rawKey;

    const target = this.norm(rawKey);
    const found = Object.keys(obj).find(k => this.norm(k) === target);
    return found || rawKey;
  },

  // ===== session helpers =====
  sget(k) { try { return sessionStorage.getItem(k); } catch { return null; } },
  sset(k, v) { try { sessionStorage.setItem(k, v); } catch {} },
  sdel(k) { try { sessionStorage.removeItem(k); } catch {} },

  // ===== Login =====
  isLogged() { return this.sget(this.S.logged) === "1"; },

  requireLogin() {
    if (!this.isLogged()) window.location.href = "index.html";
  },

  login(pass) {
    const x = this.norm(pass);
    const list = (window.OIKOS_KEYS?.LOGIN || []).map(v => this.norm(v));
    const ok = list.includes(x);
    if (ok) {
      this.sset(this.S.logged, "1");
      this.ensureThreads();
      return true;
    }
    return false;
  },

  logout() {
    try { sessionStorage.clear(); } catch {}
    window.location.href = "index.html";
  },

  loadSessionFlags() {
    this.mem.c01 = (this.sget(this.S.c01) === "1");
    this.mem.c02 = (this.sget(this.S.c02) === "1");
    this.mem.c03 = (this.sget(this.S.c03) === "1");
    this.mem.admin = (this.sget(this.S.admin) === "1");
  },

  markUnlocked(type) {
    if (type === "c01") { this.mem.c01 = true; this.sset(this.S.c01, "1"); }
    if (type === "c02") { this.mem.c02 = true; this.sset(this.S.c02, "1"); }
    if (type === "c03") { this.mem.c03 = true; this.sset(this.S.c03, "1"); }
    if (type === "admin") { this.mem.admin = true; this.sset(this.S.admin, "1"); }
  },

  // ===== Codes =====
  checkCode(code, type, target = null) {
    const x = this.norm(code);

    const map = {
      c01: window.OIKOS_KEYS?.CODE_01 || [],
      c02: window.OIKOS_KEYS?.CODE_02 || [],
      c03: window.OIKOS_KEYS?.CODE_03 || [],
      c04: window.OIKOS_KEYS?.CODE_04 || [],
      admin: window.OIKOS_KEYS?.ADMIN || []
    };

    // ✅ PASTA: resolve key real mesmo se vier "ice" e o keys tiver "Ice"
    if (type === "archiveFolder") {
      const folderMap = window.OIKOS_KEYS?.ARCHIVE_FOLDERS || {};
      const realKey = this.resolveKey(folderMap, target || "");
      const list = (folderMap[realKey] || []).map(v => this.norm(v));
      return list.includes(x);
    }

    // ✅ FICHEIRO: resolve key real mesmo com diferenças
    if (type === "archiveFile") {
      const fileMap = window.OIKOS_KEYS?.ARCHIVE_FILES || {};
      const realKey = this.resolveKey(fileMap, target || "");
      const list = (fileMap[realKey] || []).map(v => this.norm(v));
      return list.includes(x);
    }

    const list = (map[type] || []).map(v => this.norm(v));
    return list.includes(x);
  },

  // ===== Admin name =====
  getAdminName() { return localStorage.getItem(this.S.adminName) || "ADMIN"; },
  setAdminName(v) {
    const name = (v || "").toString().trim();
    if (name) localStorage.setItem(this.S.adminName, name);
  },

  // ===== Threads =====
  getThreads() {
    try { return JSON.parse(localStorage.getItem(this.S.threads)) || {}; }
    catch { return {}; }
  },
  setThreads(t) { localStorage.setItem(this.S.threads, JSON.stringify(t)); },
  ensureThreads() {
    const t = this.getThreads();
    this.DEFAULT_THREADS.forEach(k => { if (!Array.isArray(t[k])) t[k] = []; });
    this.setThreads(t);
  },
  pushMessage(who, name, text) {
    const key = this.norm(who);
    const threads = this.getThreads();
    threads[key] = threads[key] || [];
    threads[key].push({ name, text, at: Date.now() });
    this.setThreads(threads);
  },

  // ===== Arquivo session access =====
  hasFolderAccess(folder) { return !!this.mem.archiveFolders[(folder || "").toString()]; },
  hasFileAccess(filePath) { return !!this.mem.archiveFiles[(filePath || "").toString()]; }
};

// Helpers
function $(sel) { return document.querySelector(sel); }
function $all(sel) { return Array.from(document.querySelectorAll(sel)); }

// ========= Modal =========
function setupCodeModal() {
  const modal = $("#codeModal");
  const modalTitle = $("#modalTitle");
  const modalMsg = $("#modalMsg");
  const modalClose = $("#modalClose");
  const modalForm = $("#modalForm");
  const modalCode = $("#modalCode");

  if (!modal || !modalForm || !modalCode) {
    return { openModal: () => {}, closeModal: () => {} };
  }

  modal.style.display = "none";

  let pendingAction = null;
  let requiredType = null;     // c01|c02|c03|admin|archiveFolder|archiveFile|c04
  let requiredTarget = null;   // pasta ou "Pasta/ficheiro.ext"
  let onClose = null;

  function openModal(title, type, action, opts = {}) {
    pendingAction = typeof action === "function" ? action : null;
    requiredType = type || null;
    requiredTarget = opts.target || null;
    onClose = typeof opts.onClose === "function" ? opts.onClose : null;

    if (modalTitle) modalTitle.textContent = title || "Inserir código";
    if (modalMsg) modalMsg.textContent = "";
    modalCode.value = "";

    modal.style.display = "flex";
    setTimeout(() => modalCode.focus(), 30);
  }

  function closeModal() {
    modal.style.display = "none";
    pendingAction = null;
    requiredType = null;
    requiredTarget = null;

    if (modalMsg) modalMsg.textContent = "";
    modalCode.value = "";

    if (onClose) onClose();
    onClose = null;
  }

  modalClose?.addEventListener("click", closeModal);
  modal.addEventListener("click", (e) => { if (e.target === modal) closeModal(); });

  modalForm.addEventListener("submit", (e) => {
    e.preventDefault();

    if (!window.OIKOS_KEYS) {
      if (modalMsg) modalMsg.textContent = "× keys.js não carregado";
      return;
    }

    const val = modalCode.value || "";
    const ok = requiredType ? OIKOS.checkCode(val, requiredType, requiredTarget) : false;

    if (modalMsg) modalMsg.textContent = ok ? "✓ padrão reconhecido" : "× padrão não reconhecido";

    if (ok) {
      // principais -> guardam sessão
      if (requiredType === "c01" || requiredType === "c02" || requiredType === "c03" || requiredType === "admin") {
        OIKOS.markUnlocked(requiredType);
      }

      // subpastas / subficheiros -> sessão também
      if (requiredType === "archiveFolder" && requiredTarget) {
        const folderMap = window.OIKOS_KEYS?.ARCHIVE_FOLDERS || {};
        const real = OIKOS.resolveKey(folderMap, requiredTarget);
        OIKOS.mem.archiveFolders[real] = true;
      }
      if (requiredType === "archiveFile" && requiredTarget) {
        const fileMap = window.OIKOS_KEYS?.ARCHIVE_FILES || {};
        const real = OIKOS.resolveKey(fileMap, requiredTarget);
        OIKOS.mem.archiveFiles[real] = true;
      }

      setTimeout(() => {
        closeModal();
        if (pendingAction) pendingAction();
      }, 180);
    }
  });

  return { openModal, closeModal };
}

// ========= RESET secreto =========
function bindSecretReset() {
  document.addEventListener("keydown", (e) => {
    if (e.ctrlKey && e.shiftKey && (e.key === "R" || e.key === "r")) {
      e.preventDefault();
      localStorage.clear();
      try { sessionStorage.clear(); } catch {}
      location.reload();
    }
  });
}

// ========= INDEX =========
function initIndex() {
  const form = $("#loginForm");
  if (!form) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const pass = $("#senha")?.value || "";
    const ok = OIKOS.login(pass);

    const msg = $("#loginMsg");
    if (msg) msg.textContent = ok ? "✓" : "×";
    if (ok) setTimeout(() => window.location.href = "rede.html", 180);
  });
}

// ========= REDE =========
function initRede() {
  const root = $("#redeRoot");
  if (!root) return;

  OIKOS.requireLogin();
  OIKOS.ensureThreads();
  OIKOS.loadSessionFlags();
  bindSecretReset();

  const tabs = $all("[data-tab]");
  const panels = $all("[data-panel]");

  const lockMensagens = $("#lockMensagens");
  const contentMensagens = $("#contentMensagens");

  const tabArquivo = $("#tabArquivo");
  const tabNaoVoltei = $("#tabNaoVoltei");

  const { openModal } = setupCodeModal();

  function setTab(name) {
    tabs.forEach(t => t.classList.toggle("active", t.dataset.tab === name));
    panels.forEach(p => p.style.display = (p.dataset.panel === name ? "flex" : "none"));
  }

  function showMensagensLocked() {
    if (lockMensagens) lockMensagens.style.display = "block";
    if (contentMensagens) {
      contentMensagens.style.display = "none";
      contentMensagens.style.pointerEvents = "none";
      contentMensagens.style.opacity = ".35";
    }
  }

  function showMensagensUnlocked() {
    if (lockMensagens) lockMensagens.style.display = "none";
    if (contentMensagens) {
      contentMensagens.style.display = "block";
      contentMensagens.style.pointerEvents = "auto";
      contentMensagens.style.opacity = "1";
    }
  }

  setTab("mensagens");
  if (OIKOS.mem.c01) showMensagensUnlocked();
  else showMensagensLocked();

  function unlockMensagens() {
    openModal("Requer Código 01 — Mensagens", "c01", () => {
      showMensagensUnlocked();
      setTab("mensagens");
    });
  }

  tabs.forEach(t => t.addEventListener("click", () => {
    if (t.dataset.tab === "mensagens") {
      if (!OIKOS.mem.c01) return unlockMensagens();
      setTab("mensagens");
      showMensagensUnlocked();
    }
  }));

  lockMensagens?.addEventListener("click", unlockMensagens);

  tabArquivo?.addEventListener("click", (e) => {
    e.preventDefault();
    if (OIKOS.mem.c02) return window.location.href = "arquivos.html";
    openModal("Requer Código 02 — Arquivo", "c02", () => window.location.href = "arquivos.html");
  });

  tabNaoVoltei?.addEventListener("click", (e) => {
    e.preventDefault();
    if (OIKOS.mem.c03) return window.location.href = "nao-voltei.html";
    openModal("Requer Código 03 — Se eu não voltar", "c03", () => window.location.href = "nao-voltei.html");
  });

  $("#btnLogout")?.addEventListener("click", () => OIKOS.logout());
}

// ========= ARQUIVO (UI nova: folderList + fileList + viewer) =========
function initArquivos() {
  const root = $("#arquivoRoot");
  if (!root) return;

  OIKOS.requireLogin();
  OIKOS.loadSessionFlags();
  bindSecretReset();

  const lock = $("#lockArquivoPage");
  const content = $("#contentArquivoPage");

  const folderList = $("#folderList");
  const folderStatus = $("#folderStatus");

  const fileList = $("#fileList");
  const fileStatus = $("#fileStatus");

  const viewerTitle = $("#viewerTitle");
  const viewerHint = $("#viewerHint");
  const viewerBox = $("#viewerBox");
  const pdfFrame = $("#pdfFrame");
  const imgView = $("#imgView");
  const viewerError = $("#viewerError");
  const openNewTab = $("#openNewTab");
  const closeViewer = $("#closeViewer");

  const { openModal } = setupCodeModal();

  function lockUI() {
    if (lock) lock.style.display = "block";
    if (content) content.style.display = "none";
  }
  function unlockUI() {
    if (lock) lock.style.display = "none";
    if (content) content.style.display = "block";
  }

  function extOf(path){
    const m = (path || "").toLowerCase().match(/\.([a-z0-9]+)$/);
    return m ? m[1] : "";
  }

  function resetViewer(){
    if(viewerBox) viewerBox.style.display = "none";
    if(pdfFrame){ pdfFrame.style.display = "none"; pdfFrame.removeAttribute("src"); }
    if(imgView){ imgView.style.display = "none"; imgView.removeAttribute("src"); }
    if(viewerError){ viewerError.style.display = "none"; viewerError.textContent = ""; }
    if(openNewTab){ openNewTab.style.display = "none"; openNewTab.href = "#"; }
    if(closeViewer){ closeViewer.style.display = "none"; }
    if(viewerTitle) viewerTitle.textContent = "VISUALIZAÇÃO";
    if(viewerHint) viewerHint.style.display = "block";
  }

  function showError(msg){
    if(viewerBox) viewerBox.style.display = "block";
    if(pdfFrame) pdfFrame.style.display = "none";
    if(imgView) imgView.style.display = "none";
    if(viewerError){
      viewerError.style.display = "block";
      viewerError.textContent = msg || "Não foi possível abrir.";
    }
    if(closeViewer) closeViewer.style.display = "inline-flex";
    if(viewerHint) viewerHint.style.display = "none";
  }

  function openFile(fileKey){
    // ✅ caminho robusto (funciona em subpastas)
    const url = "./arquivos/" + fileKey.split("/").map(encodeURIComponent).join("/");


    const ext = extOf(url);

    if(viewerTitle) viewerTitle.textContent = "VISUALIZAÇÃO — " + fileKey;
    if(viewerHint) viewerHint.style.display = "none";
    if(viewerBox) viewerBox.style.display = "block";
    if(viewerError) viewerError.style.display = "none";
    if(closeViewer) closeViewer.style.display = "inline-flex";

    if(openNewTab){
      openNewTab.href = url;
      openNewTab.style.display = "inline-flex";
    }

    // ✅ APENAS PNG
    if (ext === "png") {
      if (pdfFrame) {
        pdfFrame.style.display = "none";
        pdfFrame.removeAttribute("src");
      }

      if (imgView) {
        imgView.style.display = "block";
        imgView.src = url;
        imgView.onerror = () => showError("Imagem não encontrada.");
      }
      return;
    }

    showError("Apenas ficheiros PNG são permitidos.");
  }

  function requireFolder(folder, cb){
    const folderMap = window.OIKOS_KEYS?.ARCHIVE_FOLDERS || {};
    const realFolder = OIKOS.resolveKey(folderMap, folder);

    if (OIKOS.hasFolderAccess(realFolder)) return cb();

    openModal("Requer sub-código — " + realFolder, "archiveFolder", cb, { target: realFolder });
  }

  function requireFile(fileKey, cb){
    const fileMap = window.OIKOS_KEYS?.ARCHIVE_FILES || {};
    const realFileKey = OIKOS.resolveKey(fileMap, fileKey);

    if (!fileMap[realFileKey]) return cb(); // sem código próprio
    if (OIKOS.hasFileAccess(realFileKey)) return cb();

    openModal("Requer sub-código — Documento", "archiveFile", cb, { target: realFileKey });
  }

  function renderFiles(folder){
    if (!fileList) return;
    fileList.innerHTML = "";

    const idx = window.OIKOS_KEYS?.ARCHIVE_INDEX || {};
    const files = Array.isArray(idx[folder]) ? idx[folder] : [];

    // ✅ mostra só PNG na lista
    const pngs = files.filter(n => (n || "").toLowerCase().endsWith(".png"));

    if(!pngs.length){
      if (fileStatus) fileStatus.textContent = "Sem ficheiros PNG listados para esta pasta (ARCHIVE_INDEX).";
      return;
    }

    if (fileStatus) fileStatus.textContent = "Seleciona um ficheiro para abrir.";

    pngs.forEach((name)=>{
      const fileKey = folder + "/" + name;

      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "item2 fileBtn";

      btn.innerHTML = `
        <p class="h">${name}</p>
        <div class="fileMeta">
          <span class="pill">PNG</span>
          <span class="pill">${folder}</span>
        </div>
      `;

      btn.addEventListener("click", ()=>{
        requireFile(fileKey, () => openFile(fileKey));
      });

      fileList.appendChild(btn);
    });
  }

  closeViewer && closeViewer.addEventListener("click", resetViewer);
  resetViewer();

  // Gate principal: Código 02
  if (OIKOS.mem.c02) unlockUI();
  else {
    lockUI();
    openModal("Requer Código 02 — Arquivo", "c02", () => unlockUI());
  }
  lock?.addEventListener("click", () => openModal("Requer Código 02 — Arquivo", "c02", () => unlockUI()));

  // clicar pastas
  folderList && folderList.addEventListener("click",(e)=>{
    const btn = e.target.closest("[data-folder]");
    if(!btn) return;
    const folder = btn.getAttribute("data-folder");
    if(!folder) return;

    resetViewer();
    if(folderStatus) folderStatus.textContent = "Verificando acesso — " + folder + "…";
    if(fileStatus) fileStatus.textContent = "Aguardando…";
    if(fileList) fileList.innerHTML = "";

    requireFolder(folder, ()=>{
      const folderMap = window.OIKOS_KEYS?.ARCHIVE_FOLDERS || {};
      const realFolder = OIKOS.resolveKey(folderMap, folder);

      if(folderStatus) folderStatus.textContent = "✓ Pasta desbloqueada: " + realFolder;
      renderFiles(realFolder);
    });
  });

  $("#btnLogout")?.addEventListener("click", () => OIKOS.logout());
}

// ========= SE EU NÃO VOLTAR =========
function initNaoVoltei() {
  const root = $("#naoVolteiRoot");
  if (!root) return;

  OIKOS.requireLogin();
  OIKOS.loadSessionFlags();
  bindSecretReset();

  const lock = $("#lockNaoVolteiPage");
  const content = $("#contentNaoVolteiPage");
  const { openModal } = setupCodeModal();

  function lockUI() {
    if (lock) lock.style.display = "block";
    if (content) content.style.display = "none";
  }
  function unlockUI() {
    if (lock) lock.style.display = "none";
    if (content) content.style.display = "block";
  }

  if (OIKOS.mem.c03) unlockUI();
  else {
    lockUI();
    openModal("Requer Código 03 — Se eu não voltar", "c03", () => unlockUI());
  }

  lock?.addEventListener("click", () => openModal("Requer Código 03 — Se eu não voltar", "c03", () => unlockUI()));
  $("#btnLogout")?.addEventListener("click", () => OIKOS.logout());
}

// ========= AUTO INIT =========
document.addEventListener("DOMContentLoaded", () => {
  initIndex();
  initRede();
  initArquivos();
  initNaoVoltei();
});
