# CORAZON — obracuatica-web (ObraAcuática)

> Validado en el pase de madurez 15/11/2026 (ya no es borrador: la promesa la
> probó el constructor con dato vivo; ver E0 abajo).

## La promesa
App web **PWA instalable, 100% en tu navegador** (estática + funciones de cobro
opcionales, funciona offline) que funciona como **especialista de proyecto para
fabricar y construir piletas**: configurás la pileta y la app calcula volumen,
hidráulica, filtración, química, materiales, presupuesto con proveedores por
zona, planos SVG, protocolos de obra e informe de cliente — sin registro para
empezar. Es LA herramienta que convierte una conversación de venta en un
presupuesto firmable. Estado: v4.1.

## La herramienta primera (E0 punta a punta — probado 15/11/2026)
- [x] Objetivo E0: un profesional abre la app y de una idea (pileta 6×3,2 con
      solarium) saca resultados + presupuesto + plan; al agotarse sus 3 exports
      del mes, el gate de cuota aparece con sus 3 salidas y el circuito de cobro
      completa el upgrade (SIMULADO) que levanta el gate punta a punta.
- [x] Recorrido en navegador real (Chrome IAB, http://localhost:8137):
      landing → CTA "Probá GRATIS" → configurador (pjName="Pileta Los Huayras",
      L=6, W=3,2) → Resultados: **VOLUMEN 15,84 m³ · espejo 19,2 m² · caudal
      3,49 m³/h · bomba 0,5 HP · filtro Ø450** → Presupuesto: **18 rubros,
      $9.468.500 neto + IVA + llave en mano $17.013.474** → export con cuota
      agotada → upsell con 3 salidas (✕ / fondo / Escape, los tres probados en
      vivo) → checkout SIMULADO → "Simular pago" → **plan pro (fuente simulado,
      vence +30 días) persistente tras reload** → export pasa sin upsell
      (cuota congelada para Pro).
- [x] Validado contra la falla: la cuota agotada BLOQUEA la exportación y el
      diálogo aparece (rojo observado); recién con el plan activado la
      exportación pasa (verde observado). El gate gatea de verdad.
- [x] Evidencia: recorrido completo en la sesión del pase; smokes
      tests/smoke-seguridad.js + tests/smoke-ui.js verdes; registro del plan en
      localStorage (obracuatica_suscripcion).

## Estado del corazón
- 15/11/2026 | TOTE r1: la crítica halló que 'Proyectos guardados' (feature
  vendida del plan Pro) NO restauraba el sistema constructivo (selector roto
  ui.js:796) — presupuesto del sistema equivocado EN SILENCIO. Arreglado y
  probado punta a punta en navegador (vidrio guardado→recargado→restaurado,
  motor recalcula 30,6 m³). El corazón ahora tiene check permanente:
  `node tests/e2e-corazon.mjs` + gates tote-r1 en smoke-seguridad.
- 15/11/2026 | PROBADO punta a punta con dato real: SÍ | por el constructor del
  pase de madurez (agente fábrica) | Navegador real, dato vivo 6×3,2 → 15,84 m³
  y cobro SIMULADO completo. Pendiente del dueño: repetir el recorrido en el
  deploy productivo cuando exista dominio (no se puede probar acá — declarado).
- 15/11/2026 | Segundo recorrido independiente (agente del mismo pase): 6,5×3,5
  prefabricada → $24.034.935 llave en mano → export MD real (Blob capturado) +
  falla validada (input roto → aviso visible, cero NaN) + check repetible:
  `node tests/e2e-corazon.mjs` → 16/16 verde.

## EMBUDO — ObraAcuática (regla 24, declarado 18/11/2026)

El flujo núcleo real (el mismo del E0): abrir → configurar → resultados →
presupuesto → export (el momento EUREKA) → plan Pro. Cableado en
ui.js/cobro.js/auth.js vía medir.js; medidor inactivo sin credencial (regla 13
— modo cobertura hasta la key de la bandeja; lo muerde `tests/smoke-funnel.js`).

1. paso_1: configura su pileta (primer input del tab "1 · Configurá") → esperado ≥90% de los que abren
2. paso_2: ve Resultados (volumen + hidráulica) → esperado ≥60%
3. paso_3: ve el Presupuesto (rubros + llave en mano) → esperado ≥50%
4. aha: primer export del mes (Excel/Word/MD/CSV/Odoo/PDF) → esperado ≥40% de los que ven resultados (la métrica reina)
5. pago_start → pago_ok (checkout Pro/White; el ok nace en el webhook firmado) → esperado ≥8% de los aha

Trancas que vigila el turno diario (§3): `vuelta_paso_1` (re-configura tras ver
resultados), `vuelta_paso_2` (re-entra a Resultados sin exportar), `salida_paso_N`
(se va con el paso vigente), `error_js` (capturador global, stack saneado sin
PII), `pago_fail` (canje inválido / "Ya pagué" / sin backend). Botón de auxilio
(§7) listo y oculto hasta `CONFIG.WHATSAPP_NUMBER` (bandeja del dueño).

---
*Este archivo lo lee el hook gate-obras en CADA mensaje mientras se trabaja en la app.
Si la promesa acá no es la real, corregirla YA — un corazón mentiroso es peor que uno ausente.*
