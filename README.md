# Adriana Bello · Portafolio profesional

Portafolio de **Adriana del Pilar Bello Guzmán** para procesos de selección en **comunicación corporativa, comunicación interna, redacción/copywriting y marketing**. Muestra experiencia, proyectos y competencias; no es una página de venta de servicios.

Paleta tomada del CV (verde petróleo, terracota y blanco roto) para que web y currículum formen una misma marca personal.

## Secciones

| # | Sección | Escena 3D |
| --- | --- | --- |
| 00 | Inicio: disponibilidad, perfil y botones a experiencia y CV | Portátil que se abre y se enciende |
| 01 | Perfil profesional, competencias y cifras | La pantalla se despliega en capas y las teclas se elevan |
| 02–06 | Experiencia: JD Sports Fashion, Senado de Colombia, Salud Total EPS, Flash Noticias, El Transportador | Una ficha 3D por puesto en una columna que gira con el scroll |
| 07 | Proyectos destacados y competencias clave (comunicación corporativa, redacción y copywriting, marketing digital, herramientas) | Pantalla verde que escribe los proyectos |
| 08 | Contacto: correo, CV, disponibilidad, formación, idiomas y herramientas | Pantalla verde "Hablemos." |

## El portátil y las fichas

- **Fichas de experiencia:** misma plantilla editorial, mismo texto que el panel y que la pantalla del portátil. La activa queda al frente; la siguiente asoma por abajo y la anterior sale por arriba, así nunca se montan.
- **Hover sobre una ficha:** se inclina hacia el ratón, se adelanta y la recorre un reflejo de luz. Al hacer clic lleva a esa experiencia.
- **Hover sobre el portátil:** levita, onda de luz en el teclado, capas de la pantalla con paralaje y piloto de la cámara. Al hacer clic (o tocar en móvil) teclea una frase (`PHRASES` en `js/scene.js`).
- **Cada cambio de experiencia** pulsa Intro y el trackpad, y la pantalla hace un barrido de refresco.

## Cómo editar

- **Textos:** `index.html`. El proyecto "Lanzamiento de una empresa" está marcado con `<!-- REVISAR -->`: falta añadir empresa, año y resultados.
- **Fichas 3D:** array `POSTERS` al principio de `js/scene.js` (empresa, fechas, área, titular, dato clave, etiquetas). Para usar una imagen real de fondo, cópiala en `assets/ads/` y pon su ruta en `image`.
- **Colores:** variables `--accent` (verde petróleo) y `--accent-2` (terracota) en `css/styles.css`, y `ACCENT`/`TERRA` en `js/scene.js`.

## Ver en local

```bash
python -m http.server 8000
# abrir http://localhost:8000
```

## Publicar con GitHub Pages

**Settings → Pages → Deploy from a branch → `main` / `(root)` → Save.**
Dirección: `https://altesreich.github.io/mkpilar/`

## Tecnología

HTML, CSS y JavaScript sin build. [Three.js r160](https://threejs.org/) por CDN: portátil modelado en código (teclado español con serigrafía y retroiluminación, pantalla con luz de área, trackpad, bisagra), fichas en canvas, cámara guiada por el scroll. Adaptado a móvil, respeta `prefers-reduced-motion` y tiene versión sin WebGL.
