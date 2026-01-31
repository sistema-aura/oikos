// ================================
// OIKOS — app.js (COMPLETO)
// LOGIN: 1x por sessão (sessionStorage)
// CÓDIGOS 01/02/03/ADMIN: 1x por sessão (sessionStorage)
// ARQUIVO: Código 02 + Sub-códigos por pasta/ficheiro (sessão)
// MENSAGENS: persistem (localStorage)
// ADMIN: gatilho secreto no logo "OIKOS" (hold 1.6s + duplo clique)
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

  // ===== session helpers =====
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
      const list = (folderMap[target] || []).map(v => this.norm(v));
      return list.includes(x);
    }

    if (type === "archiveFile") {
      const fileMap = window.OIKOS_KEYS?.ARCHIVE_FILES || {};
      const list = (fileMap[target] || []).map(v => this.norm(v));
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
        OIKOS.mem.archiveFolders[requiredTarget] = true;
      }
      if (requiredType === "archiveFile" && requiredTarget) {
        OIKOS.mem.archiveFiles[requiredTarget] = true;
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

  // default
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
    if ($("#adminLog")) renderThread(adminActive, $("#adminLog"));
  });

  function openAdminGate() {
    openModal("Área reservada — ADMIN", "admin", () => {
      setTab("admin");
      renderAdmin();
    });
  }

  // ✅ BOTÃO SECRETO NO LOGO "OIKOS" (anti-acidente)
  // Sequência: segurar 1.6s -> soltar -> duplo clique em até 0.8s
  const logo = root.querySelector(".logo");
  if (logo) {
    logo.style.userSelect = "none";
    logo.style.cursor = "default";

    let holdTimer = null;
    let armed = false;
    let lastArmAt = 0;
    let dblClicks = 0;
    let dblTimer = null;
    let cooldownUntil = 0;

    function armSecret() {
      armed = true;
      lastArmAt = Date.now();
      dblClicks = 0;

      if (dblTimer) clearTimeout(dblTimer);
      dblTimer = setTimeout(() => {
        armed = false;
        dblClicks = 0;
      }, 800);
    }

    function triggerSecret() {
      const now = Date.now();
      if (now < cooldownUntil) return;
      cooldownUntil = now + 4000;

      armed = false;
      dblClicks = 0;
      if (dblTimer) clearTimeout(dblTimer);

      openAdminGate();
    }

    // PC: mouse
    logo.addEventListener("mousedown", () => {
      if (Date.now() < cooldownUntil) return;
      if (holdTimer) clearTimeout(holdTimer);
      holdTimer = setTimeout(() => {
        armSecret();
      }, 1600);
    });

    logo.addEventListener("mouseup", () => {
      if (holdTimer) clearTimeout(holdTimer);
      holdTimer = null;
    });

    logo.addEventListener("mouseleave", () => {
      if (holdTimer) clearTimeout(holdTimer);
      holdTimer = null;
    });

    logo.addEventListener("dblclick", (e) => {
      if (!armed) return;
      if (Date.now() - lastArmAt > 800) return;
      e.preventDefault();
      triggerSecret();
    });

    // Mobile: touch
    logo.addEventListener("touchstart", () => {
      if (Date.now() < cooldownUntil) return;
      if (holdTimer) clearTimeout(holdTimer);
      holdTimer = setTimeout(() => {
        armSecret();
      }, 1600);
    }, { passive: true });

    logo.addEventListener("touchend", () => {
      if (holdTimer) clearTimeout(holdTimer);
      holdTimer = null;
    });

    // Mobile fallback: dois taps rápidos após armar
    logo.addEventListener("click", () => {
      if (!armed) return;
      if (Date.now() - lastArmAt > 800) return;

      dblClicks += 1;
      if (dblClicks >= 2) triggerSecret();
    });
  }

  $("#btnLogout")?.addEventListener("click", () => OIKOS.logout());
}

// ========= ARQUIVO (subpastas a funcionar) =========
function initArquivos() {
  const root = $("#arquivoRoot");
  if (!root) return;

  OIKOS.requireLogin();
  OIKOS.loadSessionFlags();
  bindSecretReset();

  const lock = $("#lockArquivoPage");
  const content = $("#contentArquivoPage");

  const { openModal } = setupCodeModal();

  function lockUI() {
    if (lock) lock.style.display = "block";
    if (content) content.style.display = "none";
  }
  function unlockUI() {
    if (lock) lock.style.display = "none";
    if (content) content.style.display = "block";
  }

  // Gate principal: Código 02
  if (OIKOS.mem.c02) unlockUI();
  else {
    lockUI();
    openModal("Requer Código 02 — Arquivo", "c02", () => unlockUI());
  }
  lock?.addEventListener("click", () => openModal("Requer Código 02 — Arquivo", "c02", () => unlockUI()));

  $("#btnLogout")?.addEventListener("click", () => OIKOS.logout());

  // ===== Subpastas + viewer (usa IDs do teu arquivos.html) =====
  const folderList = $("#folderList");
  const filePath = $("#filePath");
  const btnOpen = $("#btnOpenFile");

  if (!folderList || !filePath || !btnOpen) return;

  const viewerTitle = $("#viewerTitle");
  const viewerBox = $("#viewerBox");
  const pdfFrame = $("#pdfFrame");
  const imgView = $("#imgView");
  const viewerError = $("#viewerError");
  const openNewTab = $("#openNewTab");
  const closeViewer = $("#closeViewer");

  function safePath(v) {
    const s = (v || "").toString().trim().replace(/\\/g, "/");
    if (!s) return "";
    if (s.includes("..")) return "";
    return s.replace(/^\/+/, "");
  }
  function extOf(path) {
    const m = (path || "").toLowerCase().match(/\.([a-z0-9]+)$/);
    return m ? m[1] : "";
  }

  function resetViewer() {
    if (!viewerBox) return;
    viewerBox.style.display = "none";
    if (pdfFrame) { pdfFrame.style.display = "none"; pdfFrame.removeAttribute("src"); }
    if (imgView) { imgView.style.display = "none"; imgView.removeAttribute("src"); }
    if (viewerError) { viewerError.style.display = "none"; viewerError.textContent = ""; }
    if (openNewTab) { openNewTab.style.display = "none"; openNewTab.href = "#"; }
    if (closeViewer) { closeViewer.style.display = "none"; }
    if (viewerTitle) viewerTitle.textContent = "VISUALIZAÇÃO";
  }

  function showError(msg) {
    if (!viewerBox) return;
    viewerBox.style.display = "block";
    if (pdfFrame) pdfFrame.style.display = "none";
    if (imgView) imgView.style.display = "none";
    if (viewerError) {
      viewerError.style.display = "block";
      viewerError.textContent = msg || "Não foi possível abrir.";
    }
    if (openNewTab) openNewTab.style.display = "none";
    if (closeViewer) closeViewer.style.display = "inline-flex";
  }

  function requireFolder(folder, cb) {
    if (OIKOS.hasFolderAccess(folder)) return cb();
    openModal("Requer sub-código — " + folder, "archiveFolder", cb, { target: folder });
  }

  function requireFile(fileKey, cb) {
    const fileMap = window.OIKOS_KEYS?.ARCHIVE_FILES || {};
    if (!fileMap[fileKey]) return cb(); // sem código próprio
    if (OIKOS.hasFileAccess(fileKey)) return cb();
    openModal("Requer sub-código — Documento", "archiveFile", cb, { target: fileKey });
  }

  function openFile() {
    const raw = safePath(filePath.value);
    if (!raw) return showError("Caminho inválido.");

    const folder = raw.split("/")[0] || "";
    if (!folder) return showError("Indica a pasta primeiro (ex: Ice/ficheiro.png).");

    requireFolder(folder, () => {
      requireFile(raw, () => {
        const url = "arquivos/" + raw;
        const ext = extOf(url);

        if (viewerTitle) viewerTitle.textContent = "VISUALIZAÇÃO — " + raw;
        if (viewerBox) viewerBox.style.display = "block";
        if (viewerError) viewerError.style.display = "none";
        if (closeViewer) closeViewer.style.display = "inline-flex";

        if (openNewTab) {
          openNewTab.href = url;
          openNewTab.style.display = "inline-flex";
        }

        if (ext === "pdf") {
          if (imgView) { imgView.style.display = "none"; imgView.removeAttribute("src"); }
          if (pdfFrame) {
            pdfFrame.style.display = "block";
            pdfFrame.src = url + "#view=FitH";
          }
          return;
        }

        if (["png", "jpg", "jpeg", "webp"].includes(ext)) {
          if (pdfFrame) { pdfFrame.style.display = "none"; pdfFrame.removeAttribute("src"); }
          if (imgView) {
            imgView.style.display = "block";
            imgView.src = url;
            imgView.onerror = () => showError("Imagem não encontrada.");
          }
          return;
        }

        showError("Extensão não suportada.");
      });
    });
  }

  folderList.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-folder]");
    if (!btn) return;
    const folder = btn.getAttribute("data-folder");
    if (!folder) return;

    filePath.value = folder + "/";
    resetViewer();

    // já pede o sub-código ao clicar (se for preciso)
    requireFolder(folder, () => {});
  });

  btnOpen.addEventListener("click", openFile);
  filePath.addEventListener("keydown", (e) => {
    if (e.key === "Enter") { e.preventDefault(); openFile(); }
  });

  closeViewer?.addEventListener("click", resetViewer);

  resetViewer();
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
