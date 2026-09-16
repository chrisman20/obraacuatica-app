/* ============================================================
   ObraAcuática — proveedores.js
   Directorio de proveedores por zona: cadenas nacionales según
   provincia/ciudad elegidas, TU directorio local (agregable con
   distancia y WhatsApp, guardado en el navegador), tiendas
   online reales y búsqueda directa en Google Maps/MercadoLibre
   ya filtrada por tu ciudad y la categoría del rubro.
   ============================================================ */

const Proveedores = (() => {

  const $ = id => document.getElementById(id);
  const LS_ZONE = "piletalab_zona";
  const LS_DIR = "piletalab_directorio";

  /* ---------- estado ---------- */
  function loadZone() {
    try { return JSON.parse(localStorage.getItem(LS_ZONE)) || {}; } catch (e) { return {}; }
  }
  function saveZone(z) { localStorage.setItem(LS_ZONE, JSON.stringify(z)); }
  function loadDir() {
    try { return JSON.parse(localStorage.getItem(LS_DIR)) || []; } catch (e) { return []; }
  }
  function saveDir(d) { localStorage.setItem(LS_DIR, JSON.stringify(d)); }

  /* ---------- zona (card en presupuesto) ---------- */
  function renderZone() {
    const z = loadZone();
    const prov = $("zProv"), city = $("zCity"), km = $("zKm");
    if (!prov) return;
    if (!prov.options.length) {
      prov.innerHTML = `<option value="">Elegí tu provincia…</option>` +
        Object.keys(ZONES).map(p => `<option ${p === z.prov ? "selected" : ""}>${p}</option>`).join("");
    }
    syncCities();
    city.value = z.city || city.options[0]?.value || "";
    km.value = z.km || 30;
    wireZone();
  }

  function syncCities() {
    const z = loadZone();
    const prov = $("zProv"), city = $("zCity");
    const cities = ZONES[prov.value] || ["(tu ciudad)"];
    city.innerHTML = cities.map(c => `<option ${c === z.city ? "selected" : ""}>${c}</option>`).join("") +
      (cities.includes(z.city) || !z.city ? "" : `<option selected>${z.city}</option>`);
  }

  function wireZone() {
    $("zProv").onchange = () => { const z = loadZone(); z.prov = $("zProv").value; z.city = ""; saveZone(z); syncCities(); $("zCity").value = ($("zCity").options[0] || {}).value || ""; persist(); };
    $("zCity").onchange = persist;
    $("zKm").oninput = persist;
    function persist() {
      const z = loadZone();
      z.prov = $("zProv").value; z.city = $("zCity").value;
      z.km = parseFloat($("zKm").value) || 30;
      saveZone(z);
      if (document.querySelector(".prov-modal")) closeModal();   // recalcula al reabrir
    }
  }

  /* ---------- helpers de links reales ---------- */
  const mapsURL = (query, city) =>
    `https://www.google.com/maps/search/${encodeURIComponent(query + " " + (city || ""))}`;
  const mlURL = q => `https://listado.mercadolibre.com.ar/${encodeURIComponent(q).replace(/%20/g, "-")}`;
  const waURL = n => `https://wa.me/${String(n).replace(/[^0-9]/g, "")}`;

  /* ---------- directorio local ---------- */
  function dirFor(catId, zone) {
    return loadDir().filter(p => {
      if (p.cat !== catId) return false;
      if (p.km == null || p.km === "") return true;                 // sin distancia → siempre
      return parseFloat(p.km) <= (zone.km || 30);                   // dentro del radio
    });
  }

  function addLocal(catId) {
    const name = prompt("Nombre del proveedor local (corralón, ferretería, casa de piscinas…):");
    if (!name) return;
    const km = prompt("¿A cuántos km de tu obra? (número — dejá vacío si es online/envío):", "5");
    const phone = prompt("WhatsApp/teléfono (opcional, con característica — ej: 3794151234567):", "");
    const zone = loadZone();
    const dir = loadDir();
    dir.push({ cat: catId, name, km: km === "" ? null : parseFloat(km), phone: phone || "", city: zone.city || "", added: new Date().toISOString().slice(0, 10) });
    saveDir(dir);
    openModal(catId);   // re-render con el nuevo
  }

  function removeLocal(idx, catId) {
    const dir = loadDir();
    dir.splice(idx, 1);
    saveDir(dir);
    if (catId) openModal(catId);
  }

  /* ---------- modal ---------- */
  function openModal(itemKey, itemName) {
    const catId = ITEM_PROVIDER[itemKey];
    const cat = PROVIDERS[catId];
    const opts = SUPPLIER_OPTIONS[catId];
    const zone = loadZone();
    if (!opts) return;

    const local = loadDir().map((p, i) => ({ ...p, _i: i })).filter(p =>
      p.cat === catId && (p.km == null || parseFloat(p.km) <= (zone.km || 30)));

    const html = `
    <div class="prov-modal" onclick="if(event.target===this) Proveedores.close()">
      <div class="prov-box">
        <button class="prov-close" onclick="Proveedores.close()">✕</button>
        <h3>${cat.icon} ¿Dónde consigo <span class="aqua">${itemName || "este rubro"}</span>?</h3>
        <p class="prov-zone">📍 ${zone.prov || "elegí tu provincia"}${zone.city ? " · " + zone.city : ""} · radio ${zone.km || 30} km ${zone.prov ? "" : "(configuralo arriba)"}</p>

        <div class="prov-sec"><h4>Tu directorio local</h4>
          ${local.length ? local.map(p => `
            <div class="prov-row">
              <div><b>${Sec.escapeHtml(p.name)}</b>${p.km != null ? ` <span class="tag aqua">a ${p.km} km</span>` : ' <span class="tag">envío/online</span>'}${p.city ? ` <small style="color:var(--muted)">· ${Sec.escapeHtml(p.city)}</small>` : ""}</div>
              <div>
                ${p.phone ? `<a class="btn mini" href="${waURL(p.phone)}" target="_blank">WhatsApp</a>` : ""}
                <button class="btn mini danger" onclick="Proveedores.remove(${p._i},'${catId}')">borrar</button>
              </div>
            </div>`).join("")
          : `<p class="prov-empty">Todavía no agregaste proveedores locales de esta categoría. Agregá los tuyos una vez y quedan para siempre.</p>`}
          <button class="btn" onclick="Proveedores.add('${catId}')">➕ Agregar proveedor local</button>
        </div>

        ${opts.chains.length ? `<div class="prov-sec"><h4>Cadenas y opciones según tu zona</h4>
          ${opts.chains.map(c => `
            <div class="prov-row">
              <div><b>${c.name}</b> <span class="tag ${c.maps ? "warn" : "ok"}">${c.maps ? "buscar cerca" : c.type}</span><br>
              <small style="color:var(--muted)">${c.coverage}</small></div>
              <div>
                ${c.url ? `<a class="btn mini" href="${c.url}" target="_blank">sitio</a>` : ""}
                ${c.maps ? `<a class="btn mini" href="${mapsURL(c.name.includes(" local") || c.name.includes("barrio") || c.name.includes("Distribuidores") ? opts.mapsQuery : c.name, zone.city)}" target="_blank">📍 Maps</a>` : ""}
              </div>
            </div>`).join("")}
        </div>` : ""}

        ${catId === "fabrica" ? `<div class="prov-sec"><h4>Fabricación propia</h4><p>Este rubro sale de nuestra propia planta de prefabricados — no se compra afuera.</p></div>` : `
        <div class="prov-sec"><h4>Tiendas de internet</h4>
          ${opts.online.map(o => `<div class="prov-row"><div><b>${o.name}</b></div>
            <a class="btn mini" href="${o.url}" target="_blank">abrir</a></div>`).join("")}
          <div class="prov-row">
            <div><b>Búsqueda directa en tu ciudad</b><br><small style="color:var(--muted)">abre Google Maps / MercadoLibre ya filtrado</small></div>
            <div>
              <a class="btn mini" href="${mapsURL(opts.mapsQuery, zone.city)}" target="_blank">📍 Maps: “${opts.mapsQuery}”</a>
              <a class="btn mini" href="${mlURL(opts.mlQuery)}" target="_blank">🛒 MercadoLibre</a>
            </div>
          </div>
        </div>`}
      </div>
    </div>`;
    closeModal();
    document.body.insertAdjacentHTML("beforeend", html);
  }

  function closeModal() {
    document.querySelectorAll(".prov-modal").forEach(m => m.remove());
  }

  return { renderZone, openModal, closeModal, close: closeModal, addLocal, remove: removeLocal, mapsURL, mlURL };
})();
