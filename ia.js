/* ============================================================
   ObraAcuática — ia.js
   Agente especialista con DOBLE cerebro:
   · OFFLINE — experto local: responde al instante usando el
     conocimiento de la app + los números del proyecto actual.
     Funciona sin internet, sin clave, siempre.
   · ONLINE — motor IA conectable (BYOK): endpoint compatible
     OpenAI (GLM de Z.ai, OpenAI, DeepSeek, OpenRouter o custom).
     La clave vive SOLO en el localStorage del navegador y se
     envía únicamente al endpoint que elijas. Si falla, cae
     automáticamente al experto offline.
   ============================================================ */

const IA = (() => {

  const LS = "piletalab_ia_settings";
  const $ = id => document.getElementById(id);
  const fmt = n => n.toLocaleString("es-AR", { maximumFractionDigits: 2 });
  const ars = n => "$ " + Math.round(n).toLocaleString("es-AR");

  /* ---------- settings ---------- */
  const PRESETS = {
    glm:     { label: "GLM (Z.ai)", base: "https://open.bigmodel.cn/api/paas/v4", model: "glm-4-flash" },
    openai:  { label: "OpenAI", base: "https://api.openai.com/v1", model: "gpt-4o-mini" },
    deepseek:{ label: "DeepSeek", base: "https://api.deepseek.com/v1", model: "deepseek-chat" },
    openrouter:{ label: "OpenRouter", base: "https://openrouter.ai/api/v1", model: "openai/gpt-4o-mini" },
    custom:  { label: "Personalizado", base: "", model: "" }
  };

  function loadSettings() {
    try { return JSON.parse(localStorage.getItem(LS)) || {}; } catch (e) { return {}; }
  }
  function saveSettings(s) { localStorage.setItem(LS, JSON.stringify(s)); }

  function isOnlineReady() {
    const s = loadSettings();
    return !!(s.base && s.key && s.model);
  }

  /* ============================================================
     OFFLINE — el experto local
     ============================================================ */
  const has = (q, ...words) => words.some(w => q.includes(w));

  function offlineAnswer(qRaw, STATE) {
    const q = qRaw.toLowerCase();
    const { cfg, geo, hyd, mat } = STATE || {};

    /* --- saludo / ayuda --- */
    if (has(q, "hola", "buenas", "ayuda", "qué podés", "que podes", "como funciona", "cómo funciona")) {
      return `¡Hola! Soy el experto de ObraAcuática 🤖 Podés preguntarme:
• **Recomendaciones** — "¿qué sistema me conviene para 6×3 en un patio chico?"
• **Comparativas** — "compará arena vs contenedor" o "cloro vs sal"
• **Tu proyecto** — "¿qué equipo necesito?" (uso los números que ya calculaste)
• **Diagnóstico de agua** — "el agua está verde"
• **Precios y cobro** — "¿cuánto cobro esta pileta?"
• **Compras** — "¿dónde compro la venecita más barato?"
• **Obra** — "cronograma" o "protocolo de hormigón"
${isOnlineReady() ? "\n🟢 Tenés la IA conectada activa: preguntame cualquier otra cosa." : "\n⚪ Modo offline: respondó con el conocimiento local. Conectá un motor IA (botón ⚙ arriba) para preguntas abiertas."}`;
    }

    /* --- recomendación de sistema --- */
    if (has(q, "conviene", "recomend", "qué sistema", "que sistema", "cuál me sirve", "cual me sirve", "asesor")) {
      const chico = geo && geo.volume <= 15;
      const lines = [
        `Te armo la recomendación como constructor 👇`,
        ``,
        `**Si el terreno es chico y querés entrega rápida** → **Plunge** (monobloque de fábrica, 1-2 semanas) o **Contenedor 20 pies** (12-14 m³, montaje en 2 días).`,
        `**Si querés el look que vende fotos** → **Arena/Bali** con revestimiento verde y playa: es lo que más se comparte en redes.`,
        `**Si el cliente tiene presupuesto y vista** → **Vidrio con borde infinito**: el combo Instagram, pero calculalo bien (el paño es lo más caro de toda la app).`,
        `**Si es para un hotel/club y valoran cero químicas** → **Natural/bio** (30-50% extra de superficie para regeneración).`,
        `**Si el cliente entrena** → **Contra corriente** en 4 metros lineales.`,
        ``,
        geo ? `Sobre tu proyecto actual (${cfg.tdef.name} ${cfg.L}×${cfg.W}, ${fmt(geo.volume)} m³): ${geo.volume > 45 ? "por ese volumen ya vas a uso semi-público de equipo — considerá recambio de 4 h y bomba de 1 HP mínimo." : "el equipamiento que tenés calculado en la pestaña 3 está bien dimensionado para uso privado."}` : ""
      ];
      return lines.filter(Boolean).join("\n");
    }

    /* --- comparativa de tipos --- */
    if (has(q, "compará", "compara", " vs ", "diferencia entre")) {
      const a = POOL_TYPES.find(t => q.includes(t.id) || q.includes(t.name.toLowerCase().split(" ")[0]));
      const b = POOL_TYPES.find(t => t !== a && (q.includes(t.id) || q.includes(t.name.toLowerCase().split(" ")[0])));
      if (a && b) {
        return `**${a.name} vs ${b.name}** ⚔️

| | ${a.name} | ${b.name} |
|---|---|---|
| Plazo | ${a.timeLabel} | ${b.timeLabel} |
| Costo relativo | ${a.costRel}× | ${b.costRel}× |
| Estructura | ${a.structure} | ${b.structure} |
| Borde infinito | ${a.infinity ? "sí" : "no"} | ${b.infinity ? "sí" : "no"} |

**${a.name}:** ${a.notes[0]}
**${b.name}:** ${b.notes[0]}

Veredicto rápido: si manda el ${a.costRel <= b.costRel ? "plazo/costo" : "impacto"} → ${a.costRel <= b.costRel ? a.name : b.name}; si manda la ${b.costRel >= a.costRel ? "diferenciación premium" : "simplicidad"} → ${b.costRel >= a.costRel ? b.name : a.name}.`;
      }
      return "Decime qué querés comparar y te armo la tabla: podés comparar **sistemas** (arena vs contenedor, tradicional vs prefabricada, natural vs tradicional…), **filtros** (arena vs vidrio vs cartucho) o **desinfección** (cloro vs sal vs ozono).";
    }

    /* --- filtración / equipo --- */
    if (has(q, "filtración", "filtracion", "filtro", "bomba", "equipo necesito", "qué equipo", "que equipo")) {
      if (!hyd) return "Configurá una pileta primero y te doy el equipo exacto para tu volumen.";
      return `Para tu ${cfg.tdef.name} de ${fmt(geo.volume)} m³ 🔧:

• **Caudal de diseño:** ${fmt(hyd.flowDesign)} m³/h (recambio cada ${hyd.turnover} h + 10%)
• **Bomba:** ${hyd.pumpHP} HP
• **Filtro:** ${hyd.filterDesc}
• **Cañería:** Ø ${hyd.pipeMM} mm · ${hyd.skimmers} skimmer(s) · ${hyd.returns} retornos
• **Filtración diaria:** ${hyd.filtHoursDay} h${hyd.makeupNote ? " · " + hyd.makeupNote : ""}

Si querés subir la calidad del agua sin cambiar el cuerpo: **vidrio** en vez de arena (filtra más fino y dura 8-10 años) y **electrólisis salina** para olvidarte del dosificado manual.`;
    }

    /* --- agua verde / turbia / química --- */
    if (has(q, "verde", "turbia", "algas", "olor", "ojos", "espuma")) {
      return `Diagnóstico rápido de agua 💚→💙

**¿Verde?** = algas (cloro insuficiente + sol). Protocolo:
1. Medir pH y cloro AHORA (pestaña Química con dosificador)
2. Corregir pH a 7,2-7,4 PRIMERO (si no, el cloro no trabaja)
3. **Supercloración:** 15 g de hipoclorito 65% por m³ (${geo ? ars(geo.volume * 15) + " de producto en tu pileta" : "calculado a tu volumen"})
4. Filtrar 8 h seguidas + barrer fondo (el bicho no se va solo)
5. Al día siguiente: alguicida de mantenimiento si reaparece

**¿Turbia sin color?** = filtración fina o floculante: verificá el manómetro (retrolavado si +0,3 bar) y pasá clarificante.
**¿Olor fuerte a "pileta"?** = cloraminas (no es exceso de cloro, es cloro "usado"): supercloración y UV/ozono para el futuro.
**¿Ojos rojos?** = pH fuera de rango casi siempre.

${geo ? `Tu volumen: ${fmt(geo.volume)} m³ — dosificá según ese número en la pestaña 4.` : ""}`;
    }

    /* --- precio / cobro --- */
    if (has(q, "cuánto cuesta", "cuanto cuesta", "precio", "cobr", "presupuesto", "cuánto cobro", "cuanto cobro")) {
      const bClient = document.getElementById("bClientMode");
      const el = document.getElementById("bMargin");
      const margin = el ? parseFloat(el.value) / 100 : 0.35;
      return `Sobre el cobro de esta pileta 💰:

• Regla del rubro: **costo de materiales × 1,35 a 1,5** como margen de obra (en la pestaña 7 lo configurás en "Margen de obra" y te da el precio directo con IVA y plan de pagos por hitos 30/40/30).
• Nunca caigas de 25% de margen: la reposición de materiales y las pruebas de llenado se comen el 10% solos.
• Aclará por escrito qué NO incluye (vereda, quincho, electricidad hasta el tablero) — el 80% de los reclamos nacen ahí.
• Cobrá el anticipo antes de mover un metro de tierra.

${bClient && bClient.checked ? "Ojo: tenés el modo cliente activo — desactivalo para ver costos." : "Abrí la pestaña 7 y jugá con el margen: el precio de venta se recalcula al toque."}`;
    }

    /* --- dónde comprar / proveedores --- */
    if (has(q, "dónde compr", "donde compr", "proveedor", "barato", "comprar")) {
      const zone = JSON.parse(localStorage.getItem("piletalab_zona") || "{}");
      return `Estrategia de compras 🛒 (zona: ${zone.city || "sin configurar — configurá arriba en Presupuesto"}):

• **Materiales pesados** (cemento, arena, hormigón): corralón LOCAL más cercano — el flete del interior mata cualquier descuento de cadena. Pedí precio por bulto cerrado con entrega incluida.
• **Equipos** (bomba, filtro, luces): casa de piscinas local + cotizá el mismo modelo en MercadoLibre — el mismo distribuidor suele vender 10-15% más barato online.
• **Venecita/revestimientos importados**: si el cliente quiere volumen, cotizá Alibaba por contenedor (MOG ~500 m²) — margen brutal para revender; para una sola pileta, importador de CABA con envío.
• **Tocá cualquier celda "Dónde comprarlo" del presupuesto** y te doy cadenas, tu directorio local y búsqueda directa en Maps/ML para esa categoría.
• Paga SIEMPRE con factura A: es IVA que recuperás.`;
    }

    /* --- borde infinito --- */
    if (has(q, "borde infinito", "infinito", "desbordante", "rebalse", "weir")) {
      return geo && cfg.infinity
        ? `Sobre TU borde infinito ∞: weir de ${fmt(geo.weirLen)} m, rebalse de ${fmt(hyd.infFlow)} m³/h con bomba de ${hyd.infPumpHP} HP y estanque compensador de ${fmt(hyd.basinVol)} m³ (${hyd.basinDim}). Lo que no se negocia: arista nivelada a ±3 mm (regla + láser), flotante de nivel en el estanque (sin eso, una semana de viento funde la bomba) y reposición automática. El protocolo completo está en la pestaña 5 → "Borde infinito".`
        : `El borde infinito en 4 líneas ∞: (1) es NIVEL — toda la magia es una arista perfectamente horizontal; (2) necesita estanque compensador del 5-10% del volumen; (3) doble bomba (filtración + compensación); (4) en terreno plano hay que fabricar el desnivel — encarece. Cambiá el tipo de borde en la pestaña 1 y te lo calculo completo.`;
    }

    /* --- mantenimiento / rutina --- */
    if (has(q, "mantenimiento", "rutina", "cuidar", "semana")) {
      const R = CHEM_ROUTINE;
      return `Rutina de mantenimiento 🗓

**A diario (2 min):** ${R.daily.join(" · ")}
**Semanal (30 min):** ${R.weekly.join(" · ")}
**Mensual:** ${R.monthly.join(" · ")}

La regla de oro: medir pH y cloro SIEMPRE juntos y a la misma hora. El 90% de los problemas de agua se detectan en 2 minutos de medición diaria.`;
    }

    /* --- invernada --- */
    if (has(q, "inviern", "invernada", "frío", "frio", "helada")) {
      return `Invernada ❄️: nivel 10 cm bajo skimmers, purgar TODO el circuito por las canillas de baja, bomba bajo techo, lona o malla tensada + algicida de invierno mensual. Y la regla de oro: **NUNCA vaciar la pileta del todo en suelo arcilloso** — la presión del terreno hinchado levanta el fondo ("popping the pool", el error más caro del rubro). Todo el protocolo por sistema está en la pestaña 5 → fase Invernada.`;
    }

    /* --- calefacción --- */
    if (has(q, "calefacci", "calentar", "climatiz", "bomba de calor", "temperatura del agua")) {
      return geo && hyd.heatKW
        ? `Tu bomba de calor calculada: ${hyd.heatKW} kW para ${fmt(geo.volume)} m³ (sube ~10 °C en arranque estándar). Tips: (1) SIN cobertor térmico tirás 2-3 °C por noche — el cobertor se paga solo en una temporada; (2) corréla de 10 a 16 h (temperatura ambiente máxima); (3) panel solar precalentador = 40-60% menos electricidad (está en Innovaciones).`
        : `Para climatizar: regla gruesa de bomba de calor ≈ 0,4-0,5 kW por m³ (subida de 10 °C en ~3 días). Marcate "Calefacción" en Detalles (pestaña 1) y te dimensiono el equipo para tu volumen exacto. Lo que cambia la economía: el cobertor térmico — sin él, la mitad del calor se va de noche.`;
    }

    /* --- obra / cronograma --- */
    if (has(q, "cronograma", "cuánto tarda", "cuanto tarda", "plazo", "semanas", "avance")) {
      const d = PHASE_DURATIONS[cfg?.type || "arena"];
      const total = Object.values(d || {}).reduce((a, b) => a + b, 0);
      return `Plazos de tu sistema (${cfg?.tdef.name || "arena"}) 🏗: ${cfg?.tdef.timeLabel} — pre-obra ${d.pre} sem · estructura ${d.struct} · impermeabilización ${d.water} · equipo ${d.install} · puesta en marcha ${d.startup} (total ~${total} semanas). En la pestaña 9 armás el cronograma con fechas reales y seguís el avance tildando los controles — y el cliente lo ve en su informe.`;
    }

    /* --- fórmulas de fábrica --- */
    if (has(q, "fórmula", "formula", "pastina", "grc", "fábrica", "fabrica", "molde", "microcemento", "revestimiento cement")) {
      return `Nuestra línea de fábrica 🏭 (pestaña 6): pastinas y revestimientos cementicios propios para pileta, paneles y coping de GRC, y la línea de moldes para prefabricados.

**Las formulaciones exactas son secreto industrial** 🔒 — solo el dueño las ve con sesión iniciada (pestaña Cuenta). Lo público: qué producto es, para qué sirve y cuánto rinde por kilo, que es lo que se usa para presupuestar.

Si sos el dueño: iniciá sesión y la pestaña 6 te muestra la dosificación completa escalada por lote.`;
    }

    /* --- química parámetros --- */
    if (/\bph\b/.test(q) || has(q, "cloro", "alcalinidad", "dureza", "cianúrico", "parámetros")) {
      return `Parámetros objetivo 💧: pH 7,2-7,6 (ideal 7,4) · cloro libre 1-3 ppm · combinado <0,6 · alcalinidad 80-120 · dureza 200-400 (¡cuidado con venecita: agua blanda disuelve las juntas!) · cianúrico 20-50 · ORP >650 mV. Corrección SIEMPRE en orden: **alcalinidad → pH → dureza → cloro**. Cargá tus mediciones reales en la pestaña 4 y te doy las dosis exactas para tu volumen.`;
    }

    /* --- sal vs cloro vs ozono --- */
    if (has(q, "sal", "ozono", "uv", "electrólisis", "electrolisis")) {
      return `Desinfección 🧪:
• **Cloro manual**: el más barato, el más probado, requiere disciplina de medición
• **Sal (electrólisis)**: agua suave, dosificación automática, celda se repone a los 3-5 años, el pH tiende a subir
• **UV / Ozono**: destruyen cloraminas y virus — pero NO dejan residual: siempre con cloro atrás. El ozono es el top para spa (agua caliente lo exige)
${cfg ? `Para tu caso (${cfg.tdef.name}${cfg.type === "spa" ? " — spa: ozono altamente recomendable" : " uso familiar: sal es el mejor equilibrio costo/confort"})` : ""}`;
    }

    /* --- protocolos --- */
    if (has(q, "protocolo", "cómo se construye", "como se construye", "pasos", "hormigón", "hormigon")) {
      const p = PROTOCOLS[cfg?.type || "arena"];
      return `Protocolo de ${cfg?.tdef.name || "arena"} 📋 — 5 fases (pestaña 5 con cada paso y sus controles CN):
1. **Pre-obra:** ${p.pre[0].t.split(":")[0]}…
2. **Estructura:** platea H-21 + paredes ${cfg?.type === "contenedor" ? "reforzadas con UPN (¡presión hidrostática, no apilamiento!)" : "de hormigón con media caña en encuentros"}
3. **Impermeabilización:** 2 manos cruzadas + PRUEBA DE LLENADO 72 h antes de revestir (el control que separa obra seria de reclamo)
4. **Equipo:** prueba hidráulica 24 h a 1,5× antes de tapar
5. **Puesta en marcha:** filtración 48 h + química en orden

La regla que nunca se saltea: prueba hidráulica antes de tapar cañerías y prueba de llenado antes de revestir. Todo lo demás tiene plan B; eso no.`;
    }

    /* --- fallback offline --- */
    return `Esa consulta específica la resuelve mejor el **motor IA conectado** 🟢 (botón ⚙ arriba: GLM de Z.ai, OpenAI, DeepSeek o el que tengas — la clave queda solo en tu navegador).

Mientras tanto, probá con:
• "¿Qué sistema me conviene?"
• "El agua está verde"
• "Compará contenedor vs tradicional"
• "¿Qué equipo necesito?"
• "¿Cómo cobro esta pileta?"
• "Cronograma" · "Invernada" · "Borde infinito"`;
  }

  /* ============================================================
     ONLINE — motor conectable (OpenAI-compatible)
     ============================================================ */
  function buildSystemPrompt(STATE) {
    const { cfg, geo, hyd, mat } = STATE || {};
    const budget = (typeof UI !== "undefined" && UI.getPrices && STATE)
      ? Engine.computeBudget(cfg, geo, hyd, mat, UI.getPrices())
      : null;
    const proyecto = STATE ? {
      sistema: cfg.tdef.name, forma: cfg.shape, medidas: `${cfg.L}×${cfg.W} m`,
      profundidades: `${cfg.dMin}-${cfg.dMax} m`, borde: BORDERS[cfg.borderType].name,
      revestimiento: FINISHES[cfg.finish].name, volumen_m3: geo.volume,
      caudal_diseno: hyd.flowDesign, bomba_hp: hyd.pumpHP, filtro: hyd.filterDesc,
      luces: hyd.lights, calor_kw: hyd.heatKW || null, precio_referencia: budget ? Math.round(budget.items.reduce((s, i) => s + i.qty * i.price, 0)) : null
    } : null;
    return `Sos el asistente experto de ObraAcuática: arquitecto + constructor de piletas senior + especialista en compras de Argentina, con 20 años de obra. Asesorás al DUEÑO de la app (constructor profesional), no al consumidor final.

Contexto del proyecto actual: ${JSON.stringify(proyecto)}

Conocimiento base (usalo, no lo contradigas):
- Sistemas disponibles: ${POOL_TYPES.map(t => `${t.name} (${t.costRel}× costo, ${t.timeLabel})`).join("; ")}.
- Filtros: arena 50 m/h · vidrio 40 m/h más fino · cartucho sin retrolavado · diatomeas 2-5 µm · biofiltro para naturales.
- Química: pH 7,2-7,6 (corregir alcalinidad 80-120 primero), cloro 1-3 ppm, dureza 200-400.
- Reglas de oro: prueba hidráulica 24 h a 1,5× antes de tapar; prueba de llenado 72 h antes de revestir; nunca vaciar del todo en suelo arcilloso.
- Precios en ARS referenciales sep/2026: aclaralo cuando cites números.

Reglas: español rioplatense con voseo, respuestas concretas y accionables (máx 250 palabras), usá los números del proyecto cuando apliquen, si no sabés algo concreto decilo y sugerí cómo verificarlo. No inventés precios que no estén en el contexto.`;
  }

  async function onlineAnswer(question, history, STATE, onDelta) {
    const s = loadSettings();
    const messages = [
      { role: "system", content: buildSystemPrompt(STATE) },
      ...history.slice(-10),
      { role: "user", content: question }
    ];
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 90000);
    try {
      const res = await fetch(s.base.replace(/\/$/, "") + "/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": "Bearer " + s.key },
        body: JSON.stringify({ model: s.model, messages, temperature: 0.4, max_tokens: 900, stream: !!onDelta }),
        signal: ctrl.signal
      });
      clearTimeout(t);
      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(`HTTP ${res.status} ${txt.slice(0, 140)}`);
      }
      // 🌊 STREAMING: la respuesta aparece palabra por palabra
      if (onDelta && res.body && res.body.getReader) {
        const reader = res.body.getReader();
        const dec = new TextDecoder();
        let full = "", buf = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buf += dec.decode(value, { stream: true });
          const lines = buf.split("\n");
          buf = lines.pop();
          for (const ln of lines) {
            const tk = ln.trim();
            if (!tk.startsWith("data:")) continue;
            const payload = tk.slice(5).trim();
            if (payload === "[DONE]") continue;
            try {
              const j = JSON.parse(payload);
              const d = j.choices?.[0]?.delta?.content;
              if (d) { full += d; onDelta(d, full); }
            } catch (e) { /* línea parcial */ }
          }
        }
        if (!full.trim()) throw new Error("stream vacío");
        return { text: full, source: "online" };
      }
      const data = await res.json();
      const reply = data.choices?.[0]?.message?.content;
      if (!reply) throw new Error("respuesta vacía del endpoint");
      return { text: reply, source: "online" };
    } catch (err) {
      clearTimeout(t);
      return {
        text: `⚠️ El motor IA falló (${err.message}). Te respondo con el experto offline:\n\n` + offlineAnswer(question, STATE),
        source: "fallback"
      };
    }
  }

  async function ask(question, history, STATE, onDelta) {
    const mode = (typeof UI !== "undefined" && UI.getIAMode) ? UI.getIAMode() : "auto";
    if (mode === "offline" || !isOnlineReady()) {
      await new Promise(r => setTimeout(r, 350));   // pequeño delay natural
      return { text: offlineAnswer(question, STATE), source: "offline" };
    }
    return onlineAnswer(question, history, STATE, onDelta);
  }

  async function testConnection() {
    const s = loadSettings();
    if (!s.base || !s.key || !s.model) return { ok: false, msg: "Completá endpoint, modelo y clave." };
    try {
      const res = await fetch(s.base.replace(/\/$/, "") + "/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": "Bearer " + s.key },
        body: JSON.stringify({ model: s.model, messages: [{ role: "user", content: "ping" }], max_tokens: 5 }),
        signal: AbortSignal.timeout(20000)
      });
      if (res.ok) return { ok: true, msg: "✅ Conexión OK — el motor respondió." };
      return { ok: false, msg: `❌ HTTP ${res.status} — revisá clave/modelo (${(await res.text().catch(() => "")).slice(0, 120)})` };
    } catch (e) {
      return { ok: false, msg: "❌ " + e.message };
    }
  }

  return { ask, offlineAnswer, loadSettings, saveSettings, isOnlineReady, testConnection, PRESETS };
})();
