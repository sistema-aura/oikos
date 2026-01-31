// ================================
// OIKOS — app.js (ESTÁVEL)
// LOGIN: 1x por sessão (sessionStorage)
// CÓDIGOS 01/02/03/ADMIN: 1x por sessão (sessionStorage)
// MENSAGENS: persistem (localStorage)
// ADMIN: segurar no "OIKOS" 2.2s
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

  mem: { c01:false, c02:false, c03:false, admin:false },

  norm(v) {
    return (v || "")
      .toString()
      .trim()
      .toLowerCase()
      .replace(/\s+/g, " ");
  },

  sget(k) { try { return sessionStorage.getItem(k); } catch { return null; } },
  sset(k, v) { try { sessionStorage.setItem(k, v); } catch {} },

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
  checkCode(code, type) {
    const x = this.norm(code);
    const map = {
      c01: window.OIKOS_KEYS?.CODE_01 || [],
      c02: window.OIKOS_KEYS?.CODE_02 || [],
      c03: window.OIKOS_KEYS?.CODE_03 || [],
      admin: window.OIKOS_KEYS?.ADMIN || []
    };
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
  }
};

function $(sel) { return document.querySelector(sel); }
function $all(sel) { return Array.from(document.querySelectorAll(sel)); }

// ========= Painéis robustos =========
function showPanel(name) {
  const panels = $all("[data-panel]");
  panels.forEach(p => {
    p.style.display = (p.dataset.panel === name) ? "flex" : "none";
  });

  // tabs: só existe "mensagens" (não dependemos disto para o layout)
  const tabs = $all("[data-tab]");
  tabs.forEach(t => t.classList.toggle("active", t.dataset.tab === name));
}

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

  function openModal(title, type, action) {
    pendingAction = typeof action === "function" ? action : null;
    requiredType = type || null;

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
    if (modalMsg) modalMsg.textContent = "";
    modalCode.value = "";
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
    const ok = requiredType ? OIKOS.checkCode(val, requiredType) : false;

    if (modalMsg) modalMsg.textContent = ok ? "✓ padrão reconhecido" : "× padrão não reconhecido";

    if (ok) {
      OIKOS.markUnlocked(requiredType);

      setTimeout(() => {
        closeModal();
        if (pendingAction) pendingAction();
      }, 120);
    }
  });

  return { openModal, closeModal };
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
    if (ok) setTimeout(() => window.location.href = "rede.html", 120);
  });
}

// ========= REDE =========
function initRede() {
  const root = $("#redeRoot");
  if (!root) return;

  OIKOS.requireLogin();
  OIKOS.ensureThreads();
  OIKOS.loadSessionFlags();

  const lockMensagens = $("#lockMensagens");
  const contentMensagens = $("#contentMensagens");
  const tabArquivo = $("#tabArquivo");
  const tabNaoVoltei = $("#tabNaoVoltei");

  const { openModal } = setupCodeModal();

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

  // painel inicial
  showPanel("mensagens");
  if (OIKOS.mem.c01) showMensagensUnlocked();
  else showMensagensLocked();

  function unlockMensagens() {
    openModal("Requer Código 01 — Mensagens", "c01", () => {
      showMensagensUnlocked();
      showPanel("mensagens");
    });
  }

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

  // ========= CHAT =========
  const msgBtns = $all(".msgBtn");
  const msgTitle = $("#msgTitle");
  const msgLog = $("#msgLog");
  const msgForm = $("#msgForm");
  const msgInput = $("#msgInput");

  let activeThread = null;

  function renderThread(who, targetEl) {
    const key = OIKOS.norm(who);
    const threads = OIKOS.getThreads();
    const items = threads[key] || [];
    targetEl.innerHTML = "";

    items.forEach((m) => {
      const wrap = document.createElement("div");
      wrap.style.border = "1px solid rgba(120,255,214,.14)";
      wrap.style.background = "rgba(0,0,0,.22)";
      wrap.style.borderRadius = "12px";
      wrap.style.padding = "10px";
      wrap.style.fontFamily = "var(--mono)";
      wrap.style.fontSize = "12px";
      wrap.style.color = "rgba(232,237,246,.82)";

      const whoLine = document.createElement("div");
      whoLine.style.marginBottom = "6px";
      whoLine.textContent = m.name || "—";
      whoLine.style.color = (m.name === OIKOS.USER_NAME)
        ? "rgba(232,237,246,.75)"
        : "rgba(120,255,214,.95)";

      const text = document.createElement("div");
      text.style.whiteSpace = "pre-wrap";
      text.textContent = m.text;

      wrap.appendChild(whoLine);
      wrap.appendChild(text);
      targetEl.appendChild(wrap);
    });

    targetEl.scrollTop = targetEl.scrollHeight;
  }

  function setActiveThread(raw) {
    const t = OIKOS.norm(raw);
    activeThread = t;

    msgBtns.forEach(x => x.classList.toggle("active", OIKOS.norm(x.dataset.msg) === t));
    if (msgTitle) msgTitle.textContent = t.toUpperCase();
    if (msgLog) renderThread(t, msgLog);
    msgInput?.focus();
  }

  msgBtns.forEach(b => b.addEventListener("click", () => setActiveThread(b.dataset.msg)));
  if (msgBtns.length) setActiveThread(msgBtns[0].dataset.msg || "gabriel");

  msgForm?.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!activeThread) return;
    if (!OIKOS.mem.c01) return unlockMensagens();

    const text = (msgInput?.value || "").trim();
    if (!text) return;

    OIKOS.pushMessage(activeThread, OIKOS.USER_NAME, text);
    msgInput.value = "";
    if (msgLog) renderThread(activeThread, msgLog);
  });

  // ========= ADMIN =========
  let adminActive = null;

  function renderAdmin() {
    if (!OIKOS.mem.admin) return;

    const box = $("#adminThreads");
    const adminLog = $("#adminLog");
    const adminTitle = $("#adminTitle");
    const adminName = $("#adminName");
    if (!box || !adminLog || !adminTitle) return;

    if (adminName) adminName.value = OIKOS.getAdminName();

    OIKOS.ensureThreads();
    const threads = OIKOS.getThreads();
    const allKeys = Array.from(new Set([...OIKOS.DEFAULT_THREADS, ...Object.keys(threads)]));

    box.innerHTML = "";

    allKeys.forEach((k) => {
      const key = OIKOS.norm(k);
      const card = document.createElement("div");
      card.className = "item2";
      card.style.cursor = "pointer";
      card.innerHTML = `<p class="h">${key.toUpperCase()}</p><p class="p">${(threads[key] || []).length} mensagens</p>`;
      card.addEventListener("click", () => {
        adminActive = key;
        adminTitle.textContent = "RESPOSTA — " + key.toUpperCase();
        renderThread(key, adminLog);
      });
      box.appendChild(card);
    });
  }

  $("#adminForm")?.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!OIKOS.mem.admin) return;
    if (!adminActive) return;

    const nameInput = $("#adminName");
    const inp = $("#adminInput");

    const chosen = (nameInput?.value || "").trim();
    const text = (inp?.value || "").trim();

    if (chosen) OIKOS.setAdminName(chosen);

    const finalName = chosen || OIKOS.getAdminName();
    if (!text) return;

    OIKOS.pushMessage(adminActive, finalName, text);
    if (inp) inp.value = "";

    renderAdmin();
    if (adminLog) renderThread(adminActive, adminLog);
  });

  function enterAdmin() {
    showPanel("admin");
    renderAdmin();
  }

  function openAdminGate() {
    openModal("Área reservada — ADMIN", "admin", () => {
      enterAdmin();
    });
  }

  // ✅ ADMIN secreto: segurar no "OIKOS" por 2.2s (PC + mobile)
  const logo = root.querySelector(".logo");
  if (logo) {
    let holdTimer = null;

    function startHold() {
      clearTimeout(holdTimer);
      holdTimer = setTimeout(() => {
        openAdminGate();
      }, 2200);
    }
    function cancelHold() {
      clearTimeout(holdTimer);
      holdTimer = null;
    }

    logo.addEventListener("mousedown", startHold);
    logo.addEventListener("mouseup", cancelHold);
    logo.addEventListener("mouseleave", cancelHold);

    logo.addEventListener("touchstart", startHold, { passive: true });
    logo.addEventListener("touchend", cancelHold);
    logo.addEventListener("touchcancel", cancelHold);
  }

  $("#btnLogout")?.addEventListener("click", () => OIKOS.logout());
}

// ========= ARQUIVO / NAO VOLTEI (mantidos simples) =========
function initArquivos() {}
function initNaoVoltei() {}

// ========= AUTO INIT =========
document.addEventListener("DOMContentLoaded", () => {
  initIndex();
  initRede();
  initArquivos();
  initNaoVoltei();
});
