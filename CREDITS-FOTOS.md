# Créditos de fotografías — ObraAcuática

Fotos reales con licencia **Creative Commons que permite uso comercial** (CC BY / CC BY-SA / CC0) + arte propio generado. El crédito va junto a cada foto según exige la licencia.

**Regla de oro (15/11/2026, tras auditoría de contenido):** ningún asset entra a la app por su título o descripción del buscador — **cada foto se certifica VISUALMENTE** (alguien la miró y confirmó que muestra lo que la tarjeta reclama) and queda registrada en `MANIFIESTO-CONTENIDO.md`. El título miente; los ojos no.

| Archivo | Autor original | Licencia | Fuente |
|---|---|---|---|
| `img/hero.jpg` | christophe_cerisier | CC BY 2.0 | live.staticflickr.com/7082/7337410546 |
| `img/arena.jpg` | **creación propia** — render de la viñeta SVG de la app (regla 12: el agente genera el arte) | sin licencia externa | MANIFIESTO-CONTENIDO.md |
| `img/tradicional.jpg` | David McKelvey | CC BY 2.0 | live.staticflickr.com/7238/6909124086 — *muestra pileta de resort con templo; veredicto DÉBIL, buscar mejor candidata (P2)* |
| `img/natural.jpg` | wwarby | CC BY 2.0 | live.staticflickr.com/8207/8189910931 |
| `img/suspendida.jpg` | Studio Sarah Lou | CC BY 2.0 | live.staticflickr.com/5545/9764451343 |
| `img/contenedor.jpg` | **creación propria** — render de la viñeta SVG de la app | sin licencia externa | MANIFIESTO-CONTENIDO.md |
| `img/prefabricada.jpg` | **creación propia** — render de la viñeta SVG de la app | sin licencia externa | MANIFIESTO-CONTENIDO.md |
| `img/plunge.jpg` | Σταύρος | CC BY 2.0 | live.staticflickr.com/3002/2908287977 |
| `img/spa.jpg` | Nikkolo | CC BY-SA 1.0+ | commons: "Whirlpool jacuzzi.jpg" — *hidromasaje real con jets, certificado visualmente 15/11/2026* |
| `img/endless.jpg` | **creación propia** — render de la viñeta SVG de la app ("nadás kilómetros sin moverte de casa") | sin licencia externa | MANIFIESTO-CONTENIDO.md |
| `img/vidrio.jpg` | Bugpower | CC BY 4.0 | commons: "Refraction of light in a swimming pool with glass walls.jpg" — *paño de vidrio veraz; tiene una persona posando, P2 buscar alternativa sin rostro* |

## Auditoría de verdad de contenido (15/11/2026)

Hallazgo del dueño: las fotos no correspondían a los tipos. Auditoría visual de las 11 imágenes:

- **MENTÍAN (reemplazadas 15/11/2026):** arena (era pileta de hotel con tobogán + niño), prefabricada (era tanque de lona llenándose con manguera), contenedor (eran contenedores SECOS sin agua — la peor), endless (era pileta de deck con jacuzzi, no contracorriente), spa (era fuente termal islandesa de agua negra).
- **DÉBILES (P2, no mienten):** tradicional (resort con templo tailandés), vidrio (paño veraz pero con desconocido posando).
- **OK:** natural, suspendida, plunge, hero.
- **Causa raíz:** la "Actualización v2.4" de los créditos confiaba en los TÍTULOS de los archivos de Commons sin mirar el contenido ("Blue and grey shipping containers.jpg" para la tarjeta de pileta contenedor). Corrección estructural: `../PROTOCOLO-VERDAD-DE-CONTENIDO.md` + `tests/smoke-contenido.js` + `MANIFIESTO-CONTENIDO.md` — el título no es evidencia; la certificación es visual y queda escrita.

**Al publicar el sitio comercial:** incluir esta tabla en la página de créditos. Si el dueño reemplaza con fotos de sus obras reales (el mejor marketing), mantener nombres + actualizar la certificación del MANIFIESTO.

Las ilustraciones SVG del resto de la app son creación propia (dibujadas en código para ObraAcuática).
