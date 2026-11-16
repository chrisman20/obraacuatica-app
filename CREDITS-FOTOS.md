# Créditos de fotografías — ObraAcuática

Fotos reales con licencia **Creative Commons que permite uso comercial** (CC BY / CC BY-SA / CC0) + arte propio generado. El crédito va junto a cada foto según exige la licencia.

**Regla de oro (15/11/2026, tras auditoría de contenido):** ningún asset entra a la app por su título o descripción del buscador — **cada foto se certifica VISUALMENTE** (alguien la miró y confirmó que muestra lo que la tarjeta reclama) and queda registrada en `MANIFIESTO-CONTENIDO.md`. El título miente; los ojos no.

| Archivo | Autor original | Licencia | Fuente |
|---|---|---|---|
| `img/hero.jpg` | christophe_cerisier | CC BY 2.0 | live.staticflickr.com/7082/7337410546 |
| `img/arena.jpg` | **creación propia** — render de la viñeta SVG de la app (regla 12: el agente genera el arte) | sin licencia externa | MANIFIESTO-CONTENIDO.md |
| `img/tradicional.jpg` | **creación propia** — render de la viñeta SVG de la app | sin licencia externa | MANIFIESTO-CONTENIDO.md |
| `img/natural.jpg` | **creación propia** — render de la viñeta SVG de la app | sin licencia externa | MANIFIESTO-CONTENIDO.md |
| `img/suspendida.jpg` | **creación propia** — render de la viñeta SVG de la app | sin licencia externa | MANIFIESTO-CONTENIDO.md |
| `img/contenedor.jpg` | **creación propria** — render de la viñeta SVG de la app | sin licencia externa | MANIFIESTO-CONTENIDO.md |
| `img/prefabricada.jpg` | **creación propia** — render de la viñeta SVG de la app | sin licencia externa | MANIFIESTO-CONTENIDO.md |
| `img/plunge.jpg` | **creación propia** — render de la viñeta SVG de la app | sin licencia externa | MANIFIESTO-CONTENIDO.md |
| `img/spa.jpg` | Nikkolo | CC BY-SA 1.0+ | commons: "Whirlpool jacuzzi.jpg" — *hidromasaje real con jets, certificado visualmente 15/11/2026* |
| `img/endless.jpg` | **creación propia** — render de la viñeta SVG de la app ("nadás kilómetros sin moverte de casa") | sin licencia externa | MANIFIESTO-CONTENIDO.md |
| `img/vidrio.jpg` | **creación propia** — render de la viñeta SVG de la app | sin licencia externa | MANIFIESTO-CONTENIDO.md |

## Auditoría de verdad de contenido (15/11/2026)

Hallazgo del dueño: las fotos no correspondían a los tipos. Auditoría visual de las 11 imágenes:

- **MENTÍAN (reemplazadas 15/11/2026):** arena (era pileta de hotel con tobogán + niño), prefabricada (era tanque de lona llenándose con manguera), contenedor (eran contenedores SECOS sin agua — la peor), endless (era pileta de deck con jacuzzi, no contracorriente), spa (era fuente termal islandesa de agua negra).
- **SEGUNDO HALLAZGO DEL DUEÑO (15/11, mismo día):** "sigue mostrando fotos que no son el tipo de pileta que dice". La vara era débil: fotos de hotel/landmark (templo tailandés en tradicional, Marina Bay Sands en suspendida, Acrópolis en plunge, laguna de hotel en natural, desconocido posando en vidrio) "mostraban el tipo" pero **no correspondían al producto que la app vende**. Reemplazadas por renders de la viñeta propia. **Vara final:** una imagen es VERDE solo si es indistinguible de lo que la app podría mostrar como SU producto de ese tipo.
- **Restan como foto real:** hero (aspiracional sin claim de tipo, licenciada), spa (hidromasaje real certificado).
- **Causa raíz:** la "Actualización v2.4" de los créditos confiaba en los TÍTULOS de los archivos de Commons sin mirar el contenido ("Blue and grey shipping containers.jpg" para la tarjeta de pileta contenedor). Corrección estructural: `../PROTOCOLO-VERDAD-DE-CONTENIDO.md` + `tests/smoke-contenido.js` + `MANIFIESTO-CONTENIDO.md` — el título no es evidencia; la certificación es visual y queda escrita.

**Al publicar el sitio comercial:** incluir esta tabla en la página de créditos. Si el dueño reemplaza con fotos de sus obras reales (el mejor marketing), mantener nombres + actualizar la certificación del MANIFIESTO.

Las ilustraciones SVG del resto de la app son creación propia (dibujadas en código para ObraAcuática).
