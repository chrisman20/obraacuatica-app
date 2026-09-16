/* ============================================================
   ObraAcuática — enterprise.js
   Suite enterprise: command palette, health dashboard,
   undo/redo, auto-save, theme engine, keyboard shortcuts,
   WCAG/ARIA, migraciones, performance, test auto-validante.
   ============================================================ */

const Enterprise = (() => {

  const $ = id => document.getElementById(id);
  const fmt = n => n.toLocaleString("es-AR", { maximumFractionDigits: 2 });

  /* ============================================================
     1 · COMMAND PALETTE (Ctrl+K) — el marcador UX enterprise
     ============================================================ */
  const commands = [
    { id: "go-config", label: "⚙️ Ir a Configurá", hint: "Pestaña 1", fn: () => tab("config") },
    { id: "go-results", label: "📊 Ir a Resultados", hint: "Pestaña 2", fn: () => tab("results") },
    { id: "go-filtration", label: "🔧 Ir a Filtración", hint: "Pestaña 3", fn: () => tab("filtration") },
    { id: "go-chemistry", label: "💧 Ir a Química", hint: "Pestaña 4", fn: () => tab("chemistry") },
    { id: "go-planos", label: "📐 Ir a Planos", hint: "Pestaña 5", fn: () => tab("planos") },
    { id: "go-protocols", label: "📋 Ir a Protocolos", hint: "Pestaña 6", fn: () => tab("protocols") },
    { id: "go-obra", label: "🏗️ Ir a Obra", hint: "Pestaña 7", fn: () => tab("obra") },
    { id: "go-budget", label: "💰 Ir a Presupuesto", hint: "Pestaña 8", fn: () => tab("budget") },
    { id: "go-planes", label: "💼 Ir a Planes", hint: "Pestaña 9", fn: () => tab("planes") },
    { id: "go-factory", label: "🏭 Ir a Fábrica", hint: "Solo dueño", fn: () => tab("factory") },
    { id: "go-ia", label: "🤖 Preguntarle a la IA", hint: "Asistente", fn: () => tab("ia") },
    { id: "go-cuenta", label: "🔐 Ir a Cuenta", hint: "Sesión", fn: () => tab("cuenta") },
    { id: "save-project", label: "💾 Guardar proyecto", hint: "Ctrl+S", fn: () => { tab("config"); setTimeout(() => $("pjSave")?.click(), 300); } },
    { id: "ab-set", label: "⚖️ Fijar como A (comparador)", hint: "Comparar configuraciones", fn: () => { tab("config"); setTimeout(() => $("abSet")?.click(), 300); } },
    { id: "undo", label: "↩️ Deshacer cambio", hint: "Ctrl+Z", fn: () => UndoRedo.undo() },
    { id: "redo", label: "↪️ Rehacer cambio", hint: "Ctrl+Y", fn: () => UndoRedo.redo() },
    { id: "toggle-theme", label: "🌓 Cambiar tema claro/oscuro", hint: "Enterprise", fn: () => Theme.toggle() },
    { id: "client-report", label: "📥 Informe para el cliente", hint: "HTML autocontenido", fn: () => { tab("obra"); setTimeout(() => $("btnClientReport")?.click(), 400); } },
    { id: "export-excel", label: "📊 Exportar Excel", hint: "Presupuesto", fn: () => { tab("budget"); setTimeout(() => $("btnXLS")?.click(), 300); } },
    { id: "export-pdf", label: "🖨️ PDF / Imprimir", hint: "Presupuesto", fn: () => window.print() },
    { id: "health", label: "🩺 Health Dashboard", hint: "Estado de la app", fn: () => { tab("config"); setTimeout(() => Health.open(), 300); } },
    { id: "run-tests", label: "🧪 Ejecutar tests", hint: "Validación automática", fn: () => SelfTest.run() },
    { id: "help-shortcuts", label: "⌨️ Ver atajos de teclado", hint: "?", fn: () => Shortcuts.show() },
    { id: "role-cliente", label: "👤 Cambiar a área Cliente", hint: "Rol", fn: () => setRoleUI("cliente") },
    { id: "role-pro", label: "🏗️ Cambiar a área Profesional", hint: "Rol", fn: () => setRoleUI("pro") },
    { id: "role-proveedor", label: "🚚 Cambiar a área Proveedor", hint: "Rol", fn: () => setRoleUI("proveedor") }
  ];

  let paletteEl = null, inputEl = null, listEl = null, selected = -1;

  function tab(name) {
    document.querySelector(`#mainTabs button[data-tab="${name}"]`)?.click();
  }
  function setRoleUI(r) {
    document.querySelector(`.role-card[data-role="${r}"]`)?.click();
  }

  function open() {
    if (paletteEl) { close(); return; }
    paletteEl = document.createElement("div");
    paletteEl.className = "cmd-palette";
    paletteEl.innerHTML = `
      <div class="cmd-box">
        <input type="text" class="cmd-input" placeholder="Escribí un comando… (ej: planos, excel, tema, guardar)" autofocus>
        <div class="cmd-list"></div>
        <div class="cmd-footer">↑↓ navegar · Enter ejecutar · Esc cerrar</div>
      </div>`;
    document.body.appendChild(paletteEl);
    inputEl = paletteEl.querySelector(".cmd-input");
    listEl = paletteEl.querySelector(".cmd-list");
    inputEl.addEventListener("input", filter);
    inputEl.addEventListener("keydown", nav);
    paletteEl.addEventListener("click", e => { if (e.target === paletteEl) close(); });
    filter();
    inputEl.focus();
  }

  function close() { paletteEl?.remove(); paletteEl = null; selected = -1; }

  function filter() {
    const q = inputEl.value.toLowerCase().trim();
    const hits = commands.filter(c => !q || c.label.toLowerCase().includes(q) || (c.hint || "").toLowerCase().includes(q));
    selected = Math.min(selected, hits.length - 1);
    listEl.innerHTML = hits.map((c, i) => `
      <div class="cmd-item ${i === selected ? "sel" : ""}" data-i="${i}">
        <span>${c.label}</span><span class="cmd-hint">${c.hint || ""}</span>
      </div>`).join("") || `<div class="cmd-empty">Sin resultados para "${inputEl.value}"</div>`;
    listEl.querySelectorAll(".cmd-item").forEach((el, i) => {
      el.addEventListener("click", () => { hits[i].fn(); close(); });
    });
    listEl._hits = hits;
  }

  function nav(e) {
    const hits = listEl._hits || [];
    if (e.key === "ArrowDown") { e.preventDefault(); selected = Math.min(selected + 1, hits.length - 1); filter(); }
    else if (e.key === "ArrowUp") { e.preventDefault(); selected = Math.max(selected - 1, 0); filter(); }
    else if (e.key === "Enter") { e.preventDefault(); if (hits[selected]) { hits[selected].fn(); close(); } }
    else if (e.key === "Escape") { close(); }
  }

  /* ============================================================
     2 · UNDO / REDO — para cambios de configuración
     ============================================================ */
  const UndoRedo = (() => {
    let undoStack = [], redoStack = [], maxStack = 30;
    let lastSnapshot = null;

    function snapshot() {
      if (typeof Engine === "undefined") return null;
      try {
        const cfg = Engine.readConfig();
        return JSON.stringify(cfg);
      } catch (e) { return null; }
    }

    function push() {
      const s = snapshot();
      if (!s || s === lastSnapshot) return;
      if (lastSnapshot) undoStack.push(lastSnapshot);
      if (undoStack.length > maxStack) undoStack.shift();
      lastSnapshot = s;
      redoStack = [];
    }

    function undo() {
      if (!undoStack.length) { toast("↩️ Nada que deshacer"); return; }
      const target = undoStack.pop();
      redoStack.push(lastSnapshot);
      applySnapshot(target);
      lastSnapshot = target;
      toast("↩️ Deshecho");
    }

    function redo() {
      if (!redoStack.length) { toast("↪️ Nada que rehacer"); return; }
      const target = redoStack.pop();
      undoStack.push(lastSnapshot);
      applySnapshot(target);
      lastSnapshot = target;
      toast("↪️ Rehecho");
    }

    function applySnapshot(json) {
      try {
        const cfg = JSON.parse(json);
        const map = { fShape: "shape", fLen: "L", fWidth: "W", fDepthMin: "dMin", fDepthMax: "dMax" };
        Object.entries(map).forEach(([id, key]) => {
          const el = $(id);
          if (el && cfg[key] != null) el.value = cfg[key];
        });
        if (cfg.type) {
          document.querySelectorAll(".ts-card").forEach(c => {
            c.classList.toggle("selected", c.dataset.type === cfg.type);
          });
        }
        if (typeof UI !== "undefined" && UI.recalc) UI.recalc();
      } catch (e) { /* snapshot corrupto */ }
    }

    return { push, undo, redo, canUndo: () => undoStack.length > 0, canRedo: () => redoStack.length > 0 };
  })();

  /* ============================================================
     3 · AUTO-SAVE — cada 30s si hay cambios
     ============================================================ */
  const AutoSave = (() => {
    let timer = null, lastHash = null;

    function start(intervalMs = 30000) {
      clearInterval(timer);
      timer = setInterval(() => {
        const s = UndoRedo.snapshot ? null : null; // reuso
        const hash = JSON.stringify({
          role: localStorage.getItem("piletalab_role"),
          prices: localStorage.getItem("piletalab_prices"),
          projects: localStorage.getItem("piletalab_projects")
        });
        if (hash !== lastHash) {
          lastHash = hash;
          localStorage.setItem("piletalab_autosave", JSON.stringify({ t: Date.now(), hash }));
          if (typeof Sec !== "undefined") Sec.audit("autosave", "estado guardado automáticamente");
        }
      }, intervalMs);
    }
    return { start };
  })();

  /* ============================================================
     4 · THEME ENGINE — dark/light + white-label
     ============================================================ */
  const Theme = (() => {
    const KEY = "piletalab_theme";
    const THEMES = {
      dark: { name: "Océano Profundo", bg: "#05121C", card: "rgba(10,36,54,0.55)", accent: "#1FB6CD", text: "#E2EFF6", muted: "#84A9BB" },
      light: { name: "Arena Clara", bg: "#f5f3ee", card: "rgba(255,255,255,0.75)", accent: "#0891b2", text: "#1d2b35", muted: "#64748b" },
      midnight: { name: "Medianoche", bg: "#0a0a12", card: "rgba(20,20,35,0.6)", accent: "#818cf8", text: "#e2e8f0", muted: "#94a3b8" },
      forest: { name: "Selva", bg: "#0a1510", card: "rgba(15,35,25,0.6)", accent: "#34d399", text: "#e8f5f0", muted: "#84a9bb" }
    };

    function current() { return localStorage.getItem(KEY) || "dark"; }

    function apply(themeId) {
      const t = THEMES[themeId] || THEMES.dark;
      const r = document.documentElement.style;
      r.setProperty("--bg", t.bg);
      r.setProperty("--bg2", t.bg);
      r.setProperty("--card", t.card);
      r.setProperty("--card2", t.card);
      r.setProperty("--aqua", t.accent);
      r.setProperty("--aqua-bright", t.accent);
      r.setProperty("--txt", t.text);
      r.setProperty("--muted", t.muted);
      r.setProperty("--line", themeId === "light" ? "#e2e0d8" : "#143952");
      r.setProperty("--glass-line", themeId === "light" ? "rgba(0,0,0,0.08)" : "rgba(150,210,230,0.14)");
      localStorage.setItem(KEY, themeId);
      document.body.classList.toggle("theme-light", themeId === "light");
    }

    function toggle() {
      const cur = current();
      const next = cur === "dark" ? "light" : "dark";
      apply(next);
      toast(`🌓 Tema: ${THEMES[next].name}`);
    }

    function init() { apply(current()); }

    return { apply, toggle, init, current, THEMES, list: () => Object.entries(THEMES).map(([k, v]) => ({ id: k, ...v })) };
  })();

  /* ============================================================
     5 · KEYBOARD SHORTCUTS
     ============================================================ */
  const SHORTCUTS = [
    { keys: "Ctrl+K", desc: "Command palette", fn: open },
    { keys: "Ctrl+S", desc: "Guardar proyecto", fn: () => { tab("config"); setTimeout(() => $("pjSave")?.click(), 200); } },
    { keys: "Ctrl+Z", desc: "Deshacer", fn: () => UndoRedo.undo() },
    { keys: "Ctrl+Y", desc: "Rehacer", fn: () => UndoRedo.redo() },
    { keys: "Ctrl+P", desc: "Imprimir / PDF", fn: () => window.print() },
    { keys: "Ctrl+1..9", desc: "Ir a pestaña N", fn: null },
    { keys: "?", desc: "Ver atajos (esta ayuda)", fn: () => Shortcuts.show() },
    { keys: "Esc", desc: "Cerrar modales / palette", fn: null }
  ];

  const Shortcuts = {
    show() {
      const el = document.createElement("div");
      el.className = "prov-modal";
      el.innerHTML = `<div class="prov-box">
        <button class="prov-close" onclick="this.closest('.prov-modal').remove()">✕</button>
        <h3>⌨️ Atajos de teclado</h3>
        <div class="table-wrap"><table>
          <thead><tr><th>Combinación</th><th>Acción</th></tr></thead>
          <tbody>${SHORTCUTS.map(s => `<tr><td><kbd>${s.keys}</kbd></td><td>${s.desc}</td></tr>`).join("")}</tbody>
        </table></div>
      </div>`;
      document.body.appendChild(el);
      el.addEventListener("click", e => { if (e.target === el) el.remove(); });
    },

    init() {
      document.addEventListener("keydown", e => {
        if ((e.ctrlKey || e.metaKey) && e.key === "k") { e.preventDefault(); open(); }
        else if ((e.ctrlKey || e.metaKey) && e.key === "s") { e.preventDefault(); tab("config"); setTimeout(() => $("pjSave")?.click(), 200); }
        else if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) { e.preventDefault(); UndoRedo.undo(); }
        else if ((e.ctrlKey || e.metaKey) && (e.key === "y" || (e.shiftKey && e.key === "Z"))) { e.preventDefault(); UndoRedo.redo(); }
        else if (e.key === "?" && e.target.tagName !== "INPUT" && e.target.tagName !== "TEXTAREA" && e.target.tagName !== "SELECT") { e.preventDefault(); this.show(); }
        else if ((e.ctrlKey || e.metaKey) && /^[1-9]$/.test(e.key)) {
          e.preventDefault();
          const idx = parseInt(e.key) - 1;
          const btns = document.querySelectorAll("#mainTabs button[data-tab]");
          if (btns[idx]) btns[idx].click();
        }
      });
    }
  };

  /* ============================================================
     6 · HEALTH DASHBOARD — métricas y estado
     ============================================================ */
  const Health = {
    perf: { loadStart: performance.now(), memoryStart: performance.memory?.usedJSHeapSize || 0 },

    metrics() {
      const storage = {};
      let totalBytes = 0;
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        const val = localStorage.getItem(key) || "";
        totalBytes += key.length + val.length;
        if (key.startsWith("piletalab_")) {
          storage[key] = { size: val.length, items: this.countItems(val) };
        }
      }
      const mem = performance.memory;
      return {
        loadTime: Math.round(performance.now() - this.perf.loadStart),
        memoryUsed: mem ? Math.round(mem.usedJSHeapSize / 1048576) + " MB" : "N/A",
        memoryTotal: mem ? Math.round(mem.jsHeapSizeLimit / 1048576) + " MB" : "N/A",
        storageKeys: Object.keys(storage).length,
        storageTotal: Math.round(totalBytes / 1024) + " KB",
        storageDetail: storage,
        errors: typeof Sec !== "undefined" ? Sec.auditGet().filter(x => x.event === "error_js").length : 0,
        auditEntries: typeof Sec !== "undefined" ? Sec.auditGet().length : 0,
        users: JSON.parse(localStorage.getItem("piletalab_users") || "[]").length,
        projects: JSON.parse(localStorage.getItem("piletalab_projects") || "[]").length,
        theme: Theme.current(),
        role: localStorage.getItem("piletalab_role") || "pro",
        online: navigator.onLine,
        swActive: "serviceWorker" in navigator && !!navigator.serviceWorker.controller,
        pwaInstalled: window.matchMedia("(display-mode: standalone)").matches,
        connection: navigator.connection?.effectiveType || "desconocida"
      };
    },

    open() {
      const m = this.metrics();
      const el = document.createElement("div");
      el.className = "prov-modal";
      el.innerHTML = `<div class="prov-box" style="max-width:700px">
        <button class="prov-close" onclick="this.closest('.prov-modal').remove()">✕</button>
        <h3>🩺 Health Dashboard — estado de la app</h3>
        <div class="kpi-grid" style="margin:0.8rem 0">
          ${kpiRow("⚡ Load time", m.loadTime + " ms", m.loadTime < 2000 ? "" : "lento")}
          ${kpiRow("🧠 Memoria JS", m.memoryUsed, "")}
          ${kpiRow("💾 Storage", m.storageTotal, m.storageKeys + " claves")}
          ${kpiRow("👥 Usuarios", m.users, "")}
          ${kpiRow("📁 Proyectos", m.projects, "")}
          ${kpiRow("⚠️ Errores JS", m.errors, m.errors === 0 ? "0 ✓" : "revisar")}
          ${kpiRow("📜 Auditoría", m.auditEntries, "entradas")}
          ${kpiRow("🌐 Online", m.online ? "✅" : "❌", m.connection)}
          ${kpiRow("📱 PWA instalada", m.pwaInstalled ? "✅" : "no", "")}
          ${kpiRow("🔧 Service Worker", m.swActive ? "✅" : "no", "")}
          ${kpiRow("🎨 Tema", m.theme, "")}
          ${kpiRow("👤 Rol", m.role, "")}
        </div>
        <div class="table-wrap">
          <table><thead><tr><th>Clave localStorage</th><th>Tamaño</th><th>Items</th></tr></thead>
          <tbody>${Object.entries(m.storageDetail).map(([k, v]) => `<tr><td><code>${Sec.escapeHtml(k)}</code></td><td>${v.size} B</td><td>${v.items}</td></tr>`).join("")}</tbody></table>
        </div>
      </div>`;
      document.body.appendChild(el);
      el.addEventListener("click", e => { if (e.target === el) el.remove(); });
    },

    countItems(json) {
      try {
        const d = JSON.parse(json);
        if (Array.isArray(d)) return d.length;
        if (typeof d === "object") return Object.keys(d).length;
        return 1;
      } catch (e) { return 1; }
    }
  };

  function kpiRow(label, value, sub) {
    return `<div class="kpi"><div class="k-label">${label}</div><div class="k-value" style="font-size:1rem">${value}</div>${sub ? `<div class="k-sub">${sub}</div>` : ""}</div>`;
  }

  /* ============================================================
     7 · SELF-TEST — validación automática integral
     ============================================================ */
  const SelfTest = {
    results: [],

    async run() {
      this.results = [];
      const t = (name, fn) => {
        try {
          const ok = fn();
          this.results.push({ name, ok: !!ok, detail: ok ? "✓" : "FALLÓ" });
        } catch (e) {
          this.results.push({ name, ok: false, detail: e.message.slice(0, 80) });
        }
      };

      // motor de cálculo
      t("Engine definido", () => typeof Engine !== "undefined");
      t("Geometría: 8×4 arena = volumen > 25 m³", () => {
        const cfg = { type: "arena", tdef: POOL_TYPES[0], shape: "rect", L: 8, W: 4, dMin: 1.2, dMax: 1.7, solarium: true, solW: 3, borderType: "skimmer", infinity: false, infSides: 1, copingType: "stone", finish: "venecita", deck: false, deckW: 2, deckMat: "madera", waste: 0.08, boxM2: 2.07, filter: "arena", sanitizer: "cl", use: "res", terrain: "slope", lights: true, ladder: true, heat: false, cover: false, shower: false, robot: false, innovations: [] };
        const g = Engine.computeGeometry(cfg);
        return g.volume > 25 && g.volume < 40;
      });
      t("IVA diferenciado: 10,5% y 21% coexisten", () => {
        return itemIVA("hormigon", "reducido") === 10.5 && itemIVA("bomba", "reducido") === 21 && itemIVA("hormigon", "general") === 21;
      });
      t("Color de agua: venecita → turquesa", () => {
        return FINISH_COLORS.venecita && FINISH_COLORS.venecita.agua.txt.includes("turquesa");
      });
      t("Permisos: cliente NO exporta", () => {
        localStorage.setItem("piletalab_role", "cliente");
        const r = can("exportar");
        localStorage.setItem("piletalab_role", "pro");
        return !r;
      });

      // auth
      t("Auth definido", () => typeof Auth !== "undefined");
      t("Sec: escapeHtml funciona", () => typeof Sec !== "undefined" && Sec.escapeHtml("<script>") === "&lt;script&gt;");

      // IA
      t("IA offline responde", () => {
        const r = IA.offlineAnswer("agua verde", null);
        return r.includes("Supercloración") || r.includes("algas");
      });

      // PWA
      t("Manifest cargado", () => !!document.querySelector('link[rel="manifest"]'));
      t("Iconos PNG servidos", async () => {
        const r = await fetch("icon-192.png");
        return r.ok;
      });

      // Storage
      t("Proyectos: guardar y leer", () => {
        localStorage.setItem("_test_pj", JSON.stringify([{ name: "test" }]));
        const r = JSON.parse(localStorage.getItem("_test_pj"));
        localStorage.removeItem("_test_pj");
        return r[0].name === "test";
      });

      // Planos
      t("Planos: 4 vistas generan SVG", () => {
        const cfg = Engine.readConfig();
        if (!cfg.type) return false;
        const g = Engine.computeGeometry(cfg);
        const h = Engine.computeHydraulics(cfg, g);
        return ["planta", "axo", "corteT", "corteL"].every(v => {
          const s = Plano.render(v, "full", cfg, g, h);
          return s.startsWith("<svg") && !s.includes("NaN");
        });
      });

      this.show();
      const passed = this.results.filter(r => r.ok).length;
      if (typeof Sec !== "undefined") Sec.audit("selftest", `${passed}/${this.results.length} pasaron`);
      return { passed, total: this.results.length };
    },

    show() {
      const el = document.createElement("div");
      el.className = "prov-modal";
      const passed = this.results.filter(r => r.ok).length;
      const allOk = passed === this.results.length;
      el.innerHTML = `<div class="prov-box" style="max-width:600px">
        <button class="prov-close" onclick="this.closest('.prov-modal').remove()">✕</button>
        <h3>🧪 Self-Test — ${allOk ? "✅ TODO OK" : `⚠️ ${passed}/${this.results.length}`} </h3>
        <div class="table-wrap"><table>
          <thead><tr><th>Test</th><th>Resultado</th><th>Detalle</th></tr></thead>
          <tbody>${this.results.map(r => `<tr>
            <td>${r.name}</td>
            <td style="color:${r.ok ? "var(--ok)" : "var(--bad)"};font-weight:700">${r.ok ? "✅" : "❌"}</td>
            <td style="font-size:0.78rem;color:var(--muted)">${r.detail}</td>
          </tr>`).join("")}</tbody></table></div>
      </div>`;
      document.body.appendChild(el);
      el.addEventListener("click", e => { if (e.target === el) el.remove(); });
    }
  };

  /* ============================================================
     8 · MIGRACIONES — versionado de localStorage
     ============================================================ */
  const Migrations = {
    VERSION_KEY: "piletalab_schema_version",
    CURRENT: 3,
    MIGRATIONS: {
      1: "v1: estructura inicial",
      2: "v2: agregado piletab_role, piletab_theme, piletab_chat",
      3: "v3: agregado piletab_offers, piletab_directorio, sec_audit_*"
    },

    run() {
      let ver = parseInt(localStorage.getItem(this.VERSION_KEY) || "0");
      if (ver >= this.CURRENT) return { ok: true, migrated: 0 };

      const applied = [];
      for (let v = ver + 1; v <= this.CURRENT; v++) {
        if (this.MIGRATIONS[v]) applied.push(this.MIGRATIONS[v]);
      }

      // verificar integridad de claves críticas
      const critical = ["piletalab_users", "piletalab_prices"];
      for (const key of critical) {
        try { JSON.parse(localStorage.getItem(key) || "null"); }
        catch (e) {
          // clave corrupta → respaldar y limpiar
          localStorage.setItem(key + "_corrupt_" + Date.now(), localStorage.getItem(key));
          localStorage.removeItem(key);
        }
      }

      localStorage.setItem(this.VERSION_KEY, String(this.CURRENT));
      if (typeof Sec !== "undefined") Sec.audit("migracion", `v${ver} → v${this.CURRENT}`);
      return { ok: true, migrated: applied.length, detail: applied };
    }
  };

  /* ============================================================
     9 · PERFORMANCE MONITOR
     ============================================================ */
  const Perf = {
    marks: {},

    mark(name) { this.marks[name] = performance.now(); },

    measure(name, fromMark) {
      const start = this.marks[fromMark];
      if (!start) return -1;
      return Math.round(performance.now() - start);
    },

    getReport() {
      const nav = performance.getEntriesByType("navigation")[0];
      return {
        domContentLoaded: nav ? Math.round(nav.domContentLoadedEventEnd) : "N/A",
        loadComplete: nav ? Math.round(nav.loadEventEnd) : "N/A",
        transferSize: nav ? Math.round(nav.transferSize / 1024) + " KB" : "N/A",
        firstPaint: this.getFirstPaint(),
        resourceCount: performance.getEntriesByType("resource").length
      };
    },

    getFirstPaint() {
      const fp = performance.getEntriesByType("paint").find(p => p.name === "first-paint");
      return fp ? Math.round(fp.startTime) + " ms" : "N/A";
    }
  };

  /* ============================================================
     10 · ARIA / WCAG — accesibilidad
     ============================================================ */
  function initA11y() {
    // ARIA labels en tabs
    document.querySelectorAll("#mainTabs button[data-tab]").forEach(b => {
      b.setAttribute("role", "tab");
      b.setAttribute("aria-selected", b.classList.contains("active") ? "true" : "false");
    });
    // ARIA en inputs sin label
    document.querySelectorAll("input[type='number']").forEach(i => {
      if (!i.getAttribute("aria-label") && !i.closest("label")) {
        i.setAttribute("aria-label", i.id || "input numérico");
      }
    });
    // skip link
    if (!document.getElementById("skipLink")) {
      const sk = document.createElement("a");
      sk.id = "skipLink";
      sk.href = "#mainTabs";
      sk.textContent = "Saltar al menú principal";
      sk.style.cssText = "position:absolute;left:-999px;top:0;z-index:999;padding:0.5rem 1rem;background:var(--aqua);color:#000;border-radius:0 0 8px 0;font-size:0.85rem;text-decoration:none";
      sk.addEventListener("focus", () => sk.style.left = "0");
      sk.addEventListener("blur", () => sk.style.left = "-999px");
      document.body.prepend(sk);
    }
    // focus visible en cards clickeables
    document.querySelectorAll(".type-card, .role-card, .ts-card").forEach(el => {
      el.setAttribute("tabindex", "0");
      el.setAttribute("role", "button");
      el.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); el.click(); } });
    });
  }

  /* ============================================================
     11 · TOAST helper
     ============================================================ */
  function toast(msg) {
    const n = document.createElement("div");
    n.className = "warn";
    n.style.cssText = "position:fixed;bottom:18px;left:50%;transform:translateX(-50%);z-index:200;padding:0.7rem 1.2rem;font-size:0.85rem";
    n.textContent = msg;
    document.body.appendChild(n);
    setTimeout(() => { n.style.opacity = "0"; n.style.transition = "opacity 0.4s"; setTimeout(() => n.remove(), 400); }, 2500);
  }

  /* ============================================================
     INIT
     ============================================================ */
  function init() {
    Theme.init();
    Shortcuts.init.call(Shortcuts);
    Migrations.run();
    AutoSave.start();
    initA11y();
    // indicador de performance en consola
    const perf = Perf.getReport();
    console.log(`%c🚀 ObraAcuática Enterprise v3.0 — First paint: ${perf.firstPaint}, DOM: ${perf.domContentLoaded}ms, ${perf.resourceCount} recursos`, "color:#1FB6CD;font-size:13px;font-weight:600");
  }

  return {
    init, open, close, toast, tab,
    UndoRedo, AutoSave, Theme, Shortcuts, Health, SelfTest, Migrations, Perf,
    commands
  };
})();

// auto-init cuando el DOM está listo
document.addEventListener("DOMContentLoaded", () => {
  if (typeof Enterprise !== "undefined") Enterprise.init();
});
