# SECURITY.md — PiletaLab

Protocolo de seguridad implementado (v2.2) según `99-HERRAMIENTAS/seguridad-apps/SECURITY-PROTOCOL.md`.

| Capa | Implementación |
|---|---|
| Contraseñas | PBKDF2-SHA256 **600.000 iteraciones** + salt único + rehash progresivo desde hashes viejos (120k) |
| 2FA | TOTP RFC 6238 (Google Authenticator/Authy/Microsoft) · códigos de recuperación **hasheados SHA-256**, un solo uso, con migración de legacy |
| Fuerza bruta | 5 intentos fallidos → **bloqueo 15 min** por cuenta (persistente) |
| Sesión | Token CSPRNG 24 bytes · **expiración 8 h / 30 días** ("recordarme") · **logout por inactividad 30 min** con aviso |
| Backup | **AES-256-GCM** autenticado con passphrase (PBKDF2 310k) — sin passphrase el archivo es irrecuperable; restauración verifica autenticidad |
| Auditoría | Registro **encadenado SHA-256** (tamper-evident): registro, logins ok/fallidos/bloqueos, 2FA, backups. Visible en panel del dueño con verificación de cadena |
| XSS | `Sec.escapeHtml()` en todos los inputs renderizados (proyectos, ofertas, proveedores, informes) · chat de usuario por `textContent` |
| Cabeceras | CSP (script-src self, object-src none, base-uri self), referrer strict-origin-when-cross-origin |
| Secretos industriales | Fórmulas de fábrica solo con sesión de dueño; nunca en exports/informes |
| API keys IA | Solo en localStorage del navegador; viajan únicamente al endpoint configurado |

## Modelo de amenaza (honesto)
Protege: pantalla, uso compartido del navegador, exports, backups fuera del dispositivo (cifrados). 
No protege (imposible en app local): acceso físico con lectura de localStorage — mitigación: backup cifrado + fase backend.

## Hallazgos corregidos en esta pasada
- XSS real: mensajes del chat del usuario se renderizaban con innerHTML → ahora textContent
- XSS real: nombres de proyectos, ofertas de proveedores, directorio local y cliente en informes sin escapar → escapados
- Códigos de recuperación 2FA guardados en claro → ahora hasheados
- PBKDF2 120k → 600k con migración transparente
- Backup en claro → cifrado autenticado AES-256-GCM
