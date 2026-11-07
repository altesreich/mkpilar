# Campaign Studio · Adriana Bello

Portafolio 3D de **Adriana del Pilar Bello Guzmán**: marketing, comunicación corporativa e imagen pública, potenciados con IA generativa.

Al entrar aparece un **portátil de aluminio champán** con un panel de marketing en vivo. Al hacer scroll se **rompe en fragmentos de cristal**, la cámara viaja por un túnel y de él salen **seis piezas publicitarias**, una por cada etapa profesional, con paneles de datos. Al final el portátil se recompone y muestra el contacto.

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

HTML, CSS y JavaScript sin build. [Three.js r160](https://threejs.org/) por CDN: fragmentación procedural por triángulos, texturas generadas en canvas (pantalla en vivo, teclado y pósters) y cámara guiada por el scroll. Respeta `prefers-reduced-motion` y tiene versión sin WebGL.

---

# La Vitrina (`/vitrina/`)

Segunda experiencia, independiente de la anterior. Traslada al marketing el lenguaje de los sitios inmersivos de una sola escena:

| Evento | Equivalente en marketing |
| --- | --- |
| Intro | Cuenta atrás de spot publicitario (3·2·1) y elección de entrar con sonido o en silencio |
| Escena principal | Pabellón de cristal (tienda insignia) con el monograma AB, en un paisaje de vallas publicitarias en blanco |
| Primer scroll | El pabellón se desmonta en sus paneles: manifiesto "una marca se construye pieza a pieza" |
| Proyectos | Seis vitrinas de cristal, cada una con un objeto simbólico (arco, micrófono, megáfono, sobre, globo, cristal) |
| Transiciones | Flash de cámara de prensa con separación RGB y sonido de obturador |
| HUD | Texto que se descifra (*scramble*), reloj de Tarancón, índice de secciones y progreso |
| Final | Partículas que forman AB, @, CV o ↑ según el enlace que se señala |
| Sonido | Ambiente y efectos sintetizados con Web Audio (sin archivos) |

Dirección: `https://altesreich.github.io/mkpilar/vitrina/`
