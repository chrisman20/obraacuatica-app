# Cómo subir PiletaLab a tu dominio

La app es **100% estática** (HTML + JS + CSS + fotos, sin backend, sin build). Se sube entera tal cual está la carpeta. Con HTTPS el dominio desbloquea además las PWA (instalable en el celular) y las passkeys biométricas.

## Opción A — Cloudflare Pages (recomendada; ya usás Cloudflare para apicuspartner.com)

1. Entrá a https://dash.cloudflare.com → Workers & Pages → Create application → Pages → **Upload assets** (direct upload, sin git).
2. Arrastrá TODO el contenido de esta carpeta (index.html, los .js, styles.css, img/, manifest, sw.js, icon.svg…).
3. Deploy. Te da una URL `piletalab-xxx.pages.dev` que YA funciona.
4. En tu dominio: Custom domains → Add → `pileta.tudominio.com` → listo (HTTPS automático).

Por consola (wrangler), si preferís:
```
npx wrangler pages deploy . --project-name piletalab
```
(con `.assetsignore` activo: no sube docs internos, tests ni zips de backup)

## Opción B — Netlify
1. https://app.netlify.com/drop → arrastrá la carpeta → URL live en 10 segundos.
2. Domain settings → Add custom domain.

## Opción C — GitHub Pages
1. Repo nuevo → subí los archivos → Settings → Pages → Branch: main → save.
2. URL: `usuario.github.io/piletalab` (se puede apuntar subdominio propio).

## Checklist post-deploy
- [ ] Abrí el sitio en el CELULAR → menú del navegador → "Instalar aplicación" (PWA ✓)
- [ ] Cargá tu cuenta de dueño (🔐 Cuenta → Registrarse — el primero es dueño) con "recordarme" activado
- [ ] Probá una passkey (Face ID / huella) — en HTTPS funciona plena
- [ ] Botón derecho en una foto → verificar que cargan (carpeta `img/` subida)
- [ ] Andando, desactivá indexación si es uso interno (`<meta name="robots" content="noindex">` en index.html) o dejala indexada para captar clientes

## Cómo comercializarla (modelo sugerido)
- **Demo pública:** la app entera funciona gratis en el dominio → los interesados ven el producto completo.
- **Lo que no se ve sin cuenta:** las fórmulas de fábrica ya están blindadas al dueño.
- **Versión SaaS multiusuario (fase 2):** cuentas en servidor + login social real (Google/Apple/Telegram OAuth), proyectos guardados en la nube, panel de licencias por cliente. Ese paso requiere backend (p. ej. Cloudflare Workers + D1, barato) — es la evolución natural cuando el dominio esté vendiendo.

## Notas
- Cada navegador guarda SU sesión/precios localmente (localStorage): es una app por dispositivo. El backup total (🔓 Cuenta → panel del dueño) exporta TODO para pasar de máquina.
- `CREDITS-FOTOS.md`: licencias CC BY de las fotos — mantener el crédito al publicar, o reemplazar por fotos propias.
