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
    archiveFolders: {},
    archiveFiles: {}
  },

  norm(v) {
    return (v || "")
      .toString()
      .trim()
      .toLowerCase()
      .replace(/\s+/g, " ");
  },

  // 🔧 resolve "Ice" vs "ice"
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

    if (type === "archiveFolder") {
      const folderMap = window.OIKOS_KEYS?.ARCHIVE_FOLDERS || {};
      const realKey = this.resolveKey(folderMap, target || "");
      return (folderMap[realKey] || []).map(v => this.norm(v)).includes(x);
    }

    if (type === "archiveFile") {
      const fileMap = window.OIKOS_KEYS?.ARCHIVE_FILES || {};
      const realKey = this.resolveKey(fileMap, target || "");
      return (fileMap[realKey] || []).map(v => this.norm(v)).includes(x);
    }

    return (map[type] || []).map(v => this.norm(v)).includes(x);
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
  let requiredType = null;
  let requiredTarget = null;

  function openModal(title, type, action, opts = {}) {
    pendingAction = action;
    requiredType = type;
    requiredTarget = opts.target || null;
    modalTitle.textContent = title || "Inserir código";
    modalMsg.textContent = "";
    modalCode.value = "";
    modal.style.display = "flex";
    setTimeout(() => modalCode.focus(), 30);
  }

  function closeModal() {
    modal.style.display = "none";
    pendingAction = null;
    requiredType = null;
    requiredTarget = null;
  }

  modalClose?.addEventListener("click", closeModal);
  modal.addEventListener("click", e => { if (e.target === modal) closeModal(); });

  modalForm.addEventListener("submit", e => {
    e.preventDefault();
    const ok = OIKOS.checkCode(modalCode.value, requiredType, requiredTarget);
    modalMsg.textContent = ok ? "✓ padrão reconhecido" : "× padrão não reconhecido";

    if (ok) {
      if (["c01","c02","c03","admin"].includes(requiredType)) {
        OIKOS.markUnlocked(requiredType);
      }
      if (requiredType === "archiveFolder") {
        OIKOS.mem.archiveFolders[requiredTarget] = true;
      }
      if (requiredType === "archiveFile") {
        OIKOS.mem.archiveFiles[requiredTarget] = true;
      }
      setTimeout(() => {
        closeModal();
        pendingAction && pendingAction();
      }, 180);
    }
  });

  return { openModal, closeModal };
}

// ========= RESET secreto =========
function bindSecretReset() {
  document.addEventListener("keydown", e => {
    if (e.ctrlKey && e.shiftKey && (e.key === "R" || e.key === "r")) {
      e.preventDefault();
      localStorage.clear();
      sessionStorage.clear();
      location.reload();
    }
  });
}

// ========= INDEX =========
function initIndex() {
  const form = $("#loginForm");
  if (!form) return;

  form.addEventListener("submit", e => {
    e.preventDefault();
    const pass = $("#senha")?.value || "";
    const ok = OIKOS.login(pass);
    if (ok) setTimeout(() => location.href = "rede.html", 180);
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

  const { openModal } = setupCodeModal();

  // 🔐 ADMIN ESCONDIDO NA LOGO OIKOS
  const logo = document.getElementById("oikosLogo");
  if (logo) {
    logo.addEventListener("click", () => {
      if (OIKOS.mem.admin) {
        window.location.href = "admin.html";
      } else {
        openModal("Acesso restrito — ADMIN", "admin", () => {
          window.location.href = "admin.html";
        });
      }
    });
  }

  $("#btnLogout")?.addEventListener("click", () => OIKOS.logout());
}

// ========= AUTO INIT =========
document.addEventListener("DOMContentLoaded", () => {
  initIndex();
  initRede();
});
