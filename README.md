# Campaign Studio · Adriana Bello

Portafolio 3D de **Adriana del Pilar Bello Guzmán**: marketing, comunicación corporativa e imagen pública, potenciados con IA generativa.

Al entrar aparece un **portátil de aluminio champán** con un panel de marketing en vivo. Al hacer scroll, la pantalla **se despliega en sus capas** (vista de diseño), después cada campaña **se publica y sale proyectada de la pantalla**, y al publicarse la siguiente se cuelga en un **muro de campañas** detrás del portátil. Al final todas vuelven a la pantalla, que muestra el contacto.

## Secciones

| # | Sección | Escena 3D |
| --- | --- | --- |
| 00 | Inicio | Portátil abriéndose, panel animado |
| 01 | Perfil + datos de impacto | Estallido del portátil |
| 02–07 | Piezas: JD Sports, Senado, Flash Noticias, Salud Total, El Transportador, Formación IA | Túnel de fragmentos + pieza publicitaria |
| 08 | Atelier IA (consola de prompts interactiva) | Fondo del túnel |
| 09 | Contacto | El portátil se recompone |

## Cómo editar

- **Textos de experiencia:** `index.html`. Las líneas marcadas con `<!-- REVISAR -->` son textos ampliados que conviene validar.
- **Piezas publicitarias:** array `POSTERS` al principio de `js/scene.js` (cliente, titular, colores).
  Para usar **una imagen real**, cópiala en `assets/ads/` y pon su ruta en `image`, por ejemplo `image: "assets/ads/jd.jpg"`.
- **Casos de IA de la consola:** array `CASES` en `js/ui.js`.

## Ver en local

```bash
python -m http.server 8000
# abrir http://localhost:8000
```

## Publicar con GitHub Pages

**Settings → Pages → Deploy from a branch → `main` / `(root)` → Save.**
Dirección: `https://altesreich.github.io/mkpilar/`

## Tecnología

HTML, CSS y JavaScript sin build. [Three.js r160](https://threejs.org/) por CDN: portátil modelado en código (teclas 3D, pantalla de cristal con notch, trackpad, bisagra), pantalla que se despliega en capas, campañas proyectadas con haz de luz, muro de campañas publicadas, texturas generadas en canvas y cámara guiada por el scroll. Respeta `prefers-reduced-motion` y tiene versión sin WebGL.

