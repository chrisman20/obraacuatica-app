/* ============================================================
   dialogos.js — Sistema propio de dialogos y toasts (regla 12)
   Cero dialogos nativos del navegador: todo dialogo de la
   casa es vidrio con TRES salidas: boton X + clic en el fondo +
   tecla Escape. Nadie queda atrapado en una ventana.
   Sin dependencias, funciona offline (app estatica).
   ============================================================ */

const Dialogos = (() => {

  const escHtml = s => String(s ?? "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");

  /* ---------- toasts con aria-live ---------- */
  let toastsBox = null;
  function cajaToasts() {
    if (!toastsBox) {
      toastsBox = document.createElement("div");
      toastsBox.id = "dlgToasts";
      toastsBox.setAttribute("role", "status");
      toastsBox.setAttribute("aria-live", "polite");
      document.body.appendChild(toastsBox);
    }
    return toastsBox;
  }

  function toast(msg, tipo) {
    const t = document.createElement("div");
    t.className = "dlg-toast" + (tipo ? " dlg-toast-" + tipo : "");
    t.textContent = msg;                       // textContent: cero XSS
    cajaToasts().appendChild(t);
    requestAnimationFrame(() => t.classList.add("dlg-toast-on"));
    setTimeout(() => {
      t.classList.remove("dlg-toast-on");
      setTimeout(() => t.remove(), 350);
    }, 3200);
  }

  /* ---------- pila de modales (vidrio, 3 salidas) ---------- */
  const pila = [];                             // modales abiertos, el ultimo arriba

  function overlay(titulo, opciones) {
    const op = opciones || {};
    const el = document.createElement("div");
    el.className = "dlg-overlay";
    el.innerHTML =
      '<div class="dlg-box" role="dialog" aria-modal="true" aria-label="' + escHtml(titulo) + '">' +
      '  <div class="dlg-head"><h3>' + escHtml(titulo) + '</h3>' +
      '    <button class="dlg-x" type="button" aria-label="Cerrar">✕</button></div>' +
      '  <div class="dlg-body"></div>' +
      '  <div class="dlg-foot"></div>' +
      '</div>';
    document.body.appendChild(el);
    pila.push(el);

    const cerrar = () => cerrarModal(el);
    el.querySelector(".dlg-x").addEventListener("click", cerrar);
    el.addEventListener("mousedown", e => { if (e.target === el) cerrar(); });
    return { el, cerrar, body: el.querySelector(".dlg-body"), foot: el.querySelector(".dlg-foot") };
  }

  function cerrarModal(el) {
    const i = pila.indexOf(el);
    if (i >= 0) pila.splice(i, 1);
    if (el) el.remove();
  }

  /* Escape cierra SIEMPRE el modal de arriba */
  document.addEventListener("keydown", e => {
    if (e.key === "Escape" && pila.length) {
      e.stopPropagation();
      cerrarModal(pila[pila.length - 1]);
    }
  });

  /* ---------- confirmar(): Promise<boolean> ---------- */
  function confirmar(op) {
    return new Promise(resolve => {
      const m = overlay(op.titulo || "¿Confirmás?", {});
      m.body.innerHTML = '<p class="dlg-text">' + (op.html || escHtml(op.texto || "")) + '</p>';
      const btnNo = document.createElement("button");
      btnNo.className = "btn";
      btnNo.textContent = op.btnNo || "Cancelar";
      btnNo.onclick = () => { cerrarModal(m.el); resolve(false); };
      const btnOk = document.createElement("button");
      btnOk.className = "btn primary" + (op.peligro ? " dlg-peligro" : "");
      btnOk.textContent = op.btnOk || "Confirmar";
      btnOk.onclick = () => { cerrarModal(m.el); resolve(true); };
      m.foot.appendChild(btnNo);
      m.foot.appendChild(btnOk);
      setTimeout(() => btnOk.focus(), 30);
    });
  }

  /* ---------- pedir(): Promise<valores|null> (formularios) ---------- */
  function pedir(op) {
    return new Promise(resolve => {
      const m = overlay(op.titulo || "Completá los datos", {});
      const campos = op.campos || [];
      m.body.innerHTML = campos.map((c, i) => {
        const req = c.req === false ? "" : " required";
        const inp = c.tipo === "password"
          ? '<input type="password" class="dlg-inp" id="dlg_i' + i + '" autocomplete="current-password"'
          : c.tipo === "number"
            ? '<input type="number" class="dlg-inp" id="dlg_i' + i + '" inputmode="decimal"'
            : '<input type="text" class="dlg-inp" id="dlg_i' + i + '"';
        return '<label class="dlg-label">' + escHtml(c.label) +
          inp + ' placeholder="' + escHtml(c.ph || "") + '" value="' + escHtml(c.valor || "") + '"' + req + '></label>';
      }).join("") +
      (op.texto ? '<p class="dlg-text">' + escHtml(op.texto) + '</p>' : "");
      const btnNo = document.createElement("button");
      btnNo.className = "btn";
      btnNo.textContent = op.btnNo || "Cancelar";
      btnNo.onclick = () => { cerrarModal(m.el); resolve(null); };
      const btnOk = document.createElement("button");
      btnOk.className = "btn primary";
      btnOk.textContent = op.btnOk || "Guardar";
      btnOk.onclick = () => {
        const vals = campos.map((c, i) => m.el.querySelector("#dlg_i" + i).value.trim());
        if (campos.some((c, i) => c.req !== false && !vals[i])) {
          toast("Completá los campos obligatorios", "error");
          return;
        }
        cerrarModal(m.el);
        resolve(vals);
      };
      m.foot.appendChild(btnNo);
      m.foot.appendChild(btnOk);
      m.body.addEventListener("keydown", e => {
        if (e.key === "Enter") { e.preventDefault(); btnOk.click(); }
      });
      setTimeout(() => { const f = m.el.querySelector(".dlg-inp"); if (f) f.focus(); }, 30);
    });
  }

  /* ---------- info(): contenido con acciones opcionales ---------- */
  function info(op) {
    return new Promise(resolve => {
      const m = overlay(op.titulo || "", {});
      m.body.innerHTML = op.html || '<p class="dlg-text">' + escHtml(op.texto || "") + '</p>';
      const btnOk = document.createElement("button");
      btnOk.className = "btn" + (op.primario ? " primary" : "");
      btnOk.textContent = op.btnOk || "Entendido";
      btnOk.onclick = () => { cerrarModal(m.el); resolve(true); };
      m.foot.appendChild(btnOk);
      if (op.extra) {           // acciones extra {texto, fn, clase}
        op.extra.forEach(x => {
          const b = document.createElement("button");
          b.className = x.clase || "btn";
          b.textContent = x.texto;
          b.onclick = () => { cerrarModal(m.el); x.fn && x.fn(); };
          m.foot.appendChild(b);
        });
      }
    });
  }

  return { toast, confirmar, pedir, info, cerrarModal, escHtml };
})();
