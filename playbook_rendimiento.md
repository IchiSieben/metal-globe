# ⚡ Playbook de rendimiento — Metal Globe & La Forja
*(Principios para construir liviano desde el inicio. Foldear al CLAUDE.md para que Claude
Code los aplique en cada build futuro.)*

## Regla base
Solo imágenes **WebP** (o AVIF). Nada sin comprimir. Cargar al arranque solo lo crítico; lo
demás, diferido o bajo demanda. Enviar **agregados**, no data cruda.

---

## 1. Imágenes / texturas
- **WebP** por defecto (universal). AVIF opcional si quieres aún más chico (también bien
  soportado hoy).
- Comprimir siempre (q80-85 suele ser invisible). Dimensionar a lo que de verdad se usa (no
  subir 4K si se ve a 1K).
- El arte de cada capa nueva (ej. el pergamino de La Forja Capa 3) → **WebP desde el día uno**.

## 2. Fuentes (typo)
- **WOFF2** (el formato más chico). **Self-hostear** (mismo origen, no Google Fonts CDN).
- **Subsetear**: solo los pesos y glifos que usas (Cinzel + Oswald + mono de UI). *(Ya va en
  el pase de optimización actual.)*
- `font-display: swap` → el texto aparece al toque con fuente de respaldo mientras carga la
  web font (sin "texto invisible").

## 3. Data / JSON
- Ya bien: el jsonl de 22 MB NO va al cliente; se envía el agregado (`dashboard.json` ~23KB);
  `bands_index` es lazy. Mantén el patrón: **agregados al arranque, lo pesado bajo demanda.**
- Minificar JSON (sin espacios) — ganancia menor, gratis.
- Hostinger ya da Brotli en JSON → comprime bien sobre la red.

## 4. Efectos visuales / render
- Animaciones con **transform/opacity** (van por GPU); evitar animar layout
  (width/top/height → reflow caro).
- **Pausar el render del globo cuando la pestaña está oculta** (o cuando está quieto) → ahorra
  CPU/batería.
- No dibujar lo que está fuera de pantalla (Leaflet ya hace culling; el zoom semántico ya
  reduce labels en La Forja).
- Pixel ratio razonable en WebGL (no renderizar a 3x en pantallas retina si no hace falta).
- `prefers-reduced-motion` siempre respetado *(ya lo haces)*.

## 5. Servidor / red — la pregunta del VPS
- **Honesto: para un sitio ESTÁTICO (como el tuyo), un VPS no te da casi nada.** El cuello no
  es el CPU del servidor — es el **tamaño del payload** + la **latencia** (distancia al
  servidor). Un VPS no arregla eso mejor que un CDN.
- **Lo que SÍ mueve la aguja para internet lento / audiencia global: un CDN.** Cloudflare
  (plan gratis) delante de Hostinger → cachea tus assets en nodos al borde, cerca del usuario
  (Sudamérica incluida). Es la jugada de servidor de mayor impacto, y es gratis. **No
  necesitas VPS.**
- **Cache headers largos** en assets estáticos → visitas repetidas casi instantáneas.
- HTTP/2 o HTTP/3 + Brotli (Hostinger ya).
- *(Avanzado/opcional)* Service worker para cachear y repetir visitas offline.

## 6. La Forja — recordatorio
- Es **2D por decisión** (no 3D). NO va a ser un monstruo de peso. Su única carga futura real
  es el arte (Capa 3) → WebP. El globo es la única pieza WebGL pesada, y se está optimizando.

---

## 🚫 Qué NO hacer (rendimientos decrecientes)
- No comprar VPS para un sitio estático.
- No micro-optimizar un sitio que ya va a pesar **<1 MB**. Los grandes triunfos son: el pase
  de assets (en curso) + CDN + esta disciplina. Más allá, es pulir migajas — ese tiempo rinde
  más construyendo La Forja.
- **Liviano-por-diseño > perfecto-por-obsesión.**
