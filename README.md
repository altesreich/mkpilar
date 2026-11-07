# Archivo Orbital · Adriana Bello

Portafolio de **Adriana del Pilar Bello Guzmán**: marketing, comunicación corporativa y contenido digital potenciados con IA generativa.

Concepto visual: **Museo oscuro**. Una galería en penumbra con focos y suelo pulido. En el centro hay una escultura 3D, el *Archivo Orbital*: un núcleo cerámico, anillos de latón y 30 fichas de la trayectoria que se reorganizan en cada sala al hacer scroll.

## Salas

| Sala | Contenido | Escultura 3D |
| --- | --- | --- |
| I · La firma | Presentación | Órbita armilar |
| II · Impacto | Cifras clave del CV | Halo |
| III · Colección | Experiencia profesional | Hélice cronológica |
| IV · Laboratorio IA | Método y consola de prompts interactiva | Esfera |
| V · Capacidades | Competencias, formación, idiomas, herramientas | Muro de archivo |
| VI · Consulta | Contacto | Órbita |

## Tecnología

- HTML + CSS + JavaScript sin dependencias de build.
- [Three.js r160](https://threejs.org/) desde CDN (import map): WebGL, reflejos de suelo, sombras y haces de luz con shader propio.
- Accesible: respeta `prefers-reduced-motion`, navegación por teclado en la consola y versión sin WebGL.

## Ver en local

Los módulos ES no funcionan abriendo el archivo con doble clic; hace falta un servidor local:

```bash
python -m http.server 8000
# abrir http://localhost:8000
```

## Publicar con GitHub Pages

1. En GitHub: **Settings → Pages**.
2. *Source*: **Deploy from a branch** → rama `main`, carpeta `/ (root)` → **Save**.
3. En 1–2 minutos estará en `https://altesreich.github.io/mkpilar/`.

## Estructura

```
index.html          Contenido y estructura de salas
css/styles.css      Dirección de arte (Luxury Tech & Editorial)
js/scene.js         Escena 3D (Three.js)
js/ui.js            Navegación, contadores y consola de prompts
assets/             CV descargable
```
