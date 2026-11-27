# Guía de trabajo para Codex

## Alcance

- Este repositorio contiene el Anuario Estadístico de Turismo de Catamarca 2026 como sitio independiente.
- Mantener nueve módulos en `src/data/modules.js`, incluidos los ocho existentes sin cambios y la síntesis estratégica final.
- No reemplazar la base V4 por una maqueta nueva. Reutilizar su contenido y estructura de indicadores. Las conclusiones estratégicas deben citar datos fuente, período, unidad y carácter preliminar; no inventar metas ni sumar unidades incompatibles.
- No modificar ni integrar otros paneles, incluido el panel OIT.

## Organización

- Datos e indicadores: `src/data/modules.js`.
- Fotografías, créditos y licencias: `src/data/photos.js`.
- Interfaz y estilos: `src/styles.css`.
- Navegación, tablas y gráficos: `src/app.js`.
- Autenticación de servidor: `netlify/edge-functions/auth.ts`.
- Parámetros de publicación: `netlify.toml`.

## Reglas de datos

- Verificar cada cifra con el Excel consolidado y con las fuentes originales registradas allí.
- Recalcular sumas, porcentajes y promedios; mantener los mismos valores en KPI, gráficos, tablas y notas.
- Preservar nulos como faltantes, nunca transformarlos en cero.
- No confundir encuestas, visitantes, turistas, pasajeros, vuelos, movimientos y capacidad de alojamiento.
- Indicar siempre período, unidad, denominador disponible y límites de comparación.
- No ocultar diferencias entre totales declarados y sumas de filas; anotar la discrepancia en `DATA_AUDIT.md`.
- No incorporar datos personales o microdatos al sitio público ni al repositorio.

## Seguridad

- La Edge Function `auth` debe interceptar todas las rutas, incluyendo HTML, JS, CSS e imágenes.
- Las credenciales y la clave de firma solo se leen de variables Netlify con alcance Functions.
- Nunca escribir contraseñas, tokens o claves reales en archivos, commits, registros o mensajes.
- Mantener cookies `HttpOnly`, `Secure`, `SameSite=Strict`, expiración y cierre de sesión.
- Si falta una variable de autenticación, fallar cerrado.

## Presentación

- Mantener una estética ejecutiva, legible, compacta e institucional, con contraste alto y radios discretos.
- Mantener gráficos Chart.js, valores numéricos en barras y tablas completas.
- Mantener diseño responsive y salida de impresión desde el navegador.
- Para fotografías, usar solo fuentes con licencia verificada, autoría visible y enlace a la página de origen.

## Publicación y validación

- Publicar desde `main` en el proyecto Netlify independiente asociado a este repositorio.
- Antes de actualizar producción, revisar la carga de los nueve módulos, el acceso directo bloqueado, inicio/cierre de sesión, gráficos, tablas y enlaces de crédito.
- Usar el mismo enlace de producción para las revisiones sucesivas.
