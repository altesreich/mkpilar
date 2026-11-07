# Campaign Studio · Adriana Bello

Portafolio 3D de **Adriana del Pilar Bello Guzmán**: marketing, comunicación corporativa e imagen pública, potenciados con IA generativa.

Estilo clásico y moderno: tinta, papel y un único acento en azul marino, con tipografía Bodoni Moda + Inter Tight.

Al entrar aparece un **portátil de aluminio plateado** con un panel de marketing en vivo. Al hacer scroll, la pantalla **se despliega en sus capas** (vista de diseño); después cada campaña **se publica y se levanta desde su miniatura en la pantalla**, y al publicarse la siguiente la anterior **retrocede un paso** formando una pila ordenada. Al final todas vuelven a la pantalla, que muestra el contacto.

## El portátil como protagonista

Todos los eventos los provoca el portátil:

- **Arranque:** la tapa se abre, la pantalla se enciende y una onda de luz recorre el teclado.
- **Teclado sincronizado:** cada letra que se escribe en la pantalla (prompts de IA) pulsa su tecla real; al terminar, se pulsa Intro.
- **Publicar una campaña:** Intro + clic en el trackpad, barrido de refresco en la pantalla y la pieza se levanta de su miniatura.
- **Vista despiezada (Perfil):** la pantalla se abre en capas y las filas de teclas se elevan en cascada.
- **Hover:** el portátil levita y se inclina hacia el ratón, se enciende la retroiluminación, una onda de luz sale del cursor, las teclas cercanas se iluminan, las capas de la pantalla se separan con paralaje, una luz sigue al cursor por el aluminio y se enciende el piloto de la cámara.
- **Clic:** el portátil teclea una frase (teclas y pantalla a la vez) y la envía con Intro. Las frases están en `PHRASES` en `js/scene.js`.

Teclado con distribución española (Ñ, Ç, flechas en T invertida, Touch ID) y serigrafía en cada tecla.

## Secciones

| # | Sección | Escena 3D |
| --- | --- | --- |
| 00 | Inicio | Portátil abriéndose, panel animado |
| 01 | Perfil + datos de impacto | La pantalla se despliega en capas |
| 02–07 | Piezas: JD Sports, Senado, Flash Noticias, Salud Total, El Transportador, Formación IA | Cada pieza sale de la pantalla y apila las anteriores |
| 08 | Atelier IA (consola de prompts interactiva) | La pila espera al fondo |
| 09 | Contacto | Todas las piezas vuelven a la pantalla |

## Cómo editar

- **Textos de experiencia:** `index.html`. Las líneas marcadas con `<!-- REVISAR -->` son textos ampliados que conviene validar.
- **Piezas publicitarias:** array `POSTERS` al principio de `js/scene.js` (cliente, titular, colores). Los colores siguen la paleta de la serie: tinta, marino, grafito, piedra y papel.
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

HTML, CSS y JavaScript sin build. [Three.js r160](https://threejs.org/) por CDN: portátil modelado en código (teclas 3D, pantalla de cristal con notch, trackpad, bisagra), pantalla que se despliega en capas, campañas que se levantan de la pantalla y se apilan, texturas generadas en canvas y cámara guiada por el scroll. Respeta `prefers-reduced-motion` y tiene versión sin WebGL.

