# MANIFIESTO-CONTENIDO — ObraAcuática

> **Fuente única de verdad del contenido visual.** Cada asset visible lleva su certificación: qué muestra, qué representa, quién lo certificó y cuándo. Este archivo lo lee `tests/smoke-contenido.js` — un asset sin certificación escrita con veredicto VERDE **no se publica** (PROTOCOLO-VERDAD-DE-CONTENIDO.md).

**Formato:** `archivo | tipo que representa | qué MUESTRA realmente | veredicto | certificación visual (quién + fecha)`

| Archivo | Representa | Qué muestra realmente | Veredicto | Certificación visual |
|---|---|---|---|---|
| `img/hero.jpg` | Landing hero | Pileta infinity tropical con toallas y flores — aspiracional genérica de pileta | ✅ VERDE | agente (auditoría 15/11/2026) |
| `img/arena.jpg` | Tipo Arena/Bali | **Render propio de la viñeta SVG**: pileta de arena beige con palmeras y franja de arena visible en el agua | ✅ VERDE (generado) | agente — render certificado, sd=88 |
| `img/tradicional.jpg` | Tipo Tradicional hormigón | **Render propio de la viñeta SVG**: pileta de hormigón tradicional con casa, escalera y bañista | ✅ VERDE (generado) | agente — render certificado, sd=90 |
| `img/natural.jpg` | Tipo Natural/bio | **Render propio de la viñeta SVG**: laguna bio con plantas, pato y zona de regeneración | ✅ VERDE (generado) | agente — render certificado, sd=88 |
| `img/suspendida.jpg` | Tipo Suspendida/rooftop | **Render propio de la viñeta SVG**: pileta en losa entre torres, "1 m³ de agua = 1.000 kg sobre la estructura" | ✅ VERDE (generado) | agente — render certificado, sd=87 |
| `img/contenedor.jpg` | Tipo Contenedor marítimo | **Render propio de la viñeta SVG**: contenedor con agua, "20-40 pies · del puerto a tu patio" | ✅ VERDE (generado) | agente — render certificado, sd=86 |
| `img/prefabricada.jpg` | Tipo Prefabricada GRC | **Render propio de la viñeta SVG**: grúa bajando panel GRC sobre cascarón, "montaje de paneles GRC en 2-4 días" | ✅ VERDE (generado) | agente — render certificado, sd=86 |
| `img/plunge.jpg` | Tipo Plunge/cocktail | **Render propio de la viñeta SVG**: plunge pool con posavasos y sombrilla | ✅ VERDE (generado) | agente — render certificado, sd=87 |
| `img/spa.jpg` | Spa/hidromasaje | **Hidromasaje real con jets visibles** (Whirlpool jacuzzi, CC BY-SA Nikkolo) | ✅ VERDE | agente — certificado 15/11/2026 |
| `img/endless.jpg` | Nado contra corriente | **Render propio de la viñeta SVG**: tanque de contracorriente con flecha, "nadás kilómetros sin moverte de casa" | ✅ VERDE (generado) | agente — render certificado, sd=87 |
| `img/vidrio.jpg` | Vidrio/acrílico | **Render propio de la viñeta SVG**: paño de vidrio con reflejos y bañista, palmeras | ✅ VERDE (generado) | agente — render certificado, sd=91 |

## Reglas del manifiesto

1. **Todo asset visible de la app** (fotos, renders, OG-image, escena hero, vacíos ilustrados) tiene fila en este archivo.
2. **Vara de certificación (elevada 15/11/2026 tras segundo hallazgo del dueño):** la pregunta no es "¿la foto muestra ese tipo de pileta en algún lugar del mundo?" sino **"¿esta imagen es indistinguible de una foto que esta app podría mostrar como SU producto de ese tipo?"**. Fotos de hoteles/resorts/landmarks famosos (Marina Bay Sands, Acrópolis, templos), con desconocidos posando, o de contexto que la app no vende = **ROJO**, aunque "sean del tipo". Sin certificación = ROJO.
3. **Veredicto DÉBIL** = warning con obligación P2 registrada (solo para assets veraces pero menores). **ROJO o sin fila** = no se publica (smoke en rojo).
3. La certificación visual la hace alguien que MIRA la imagen (agente con visión o el dueño) — **jamás por el título del archivo ni la descripción del buscador**.
4. Cada vez que se reemplaza un asset: nueva fila o actualización de la fila + commit.
5. Las clases de mentira completas (números, features, testimonios, links) viven en `../PROTOCOLO-VERDAD-DE-CONTENIDO.md`.
