# Anuario Estadístico de Turismo de Catamarca 2026

Dashboard institucional de ocho módulos, basado en la versión 4 del anuario. El proyecto mantiene separados el contenido estadístico (`src/data/modules.js`), las fotografías y sus licencias (`src/data/photos.js`), la presentación (`src/styles.css`), la lógica de gráficos (`src/app.js`) y la autenticación (`netlify/edge-functions/auth.ts`).

## Publicación

El sitio se publica como proyecto Netlify independiente desde la rama `main` del repositorio `rodolforizo/paneldatosturcat`. El enlace de producción del proyecto se mantiene estable entre publicaciones.

Antes de publicar, crear en Netlify estas variables privadas con alcance **Functions**:

| Variable | Uso |
| --- | --- |
| `ADMIN_USER` | Usuario de acceso |
| `ADMIN_PASSWORD` | Contraseña de acceso |
| `AUTH_SECRET` | Clave aleatoria para firmar las sesiones |

No escribir valores reales en `netlify.toml`, GitHub, archivos `.env` versionados, HTML ni JavaScript del navegador. Los cambios de variables requieren una nueva publicación. La sesión dura ocho horas, usa cookie `HttpOnly`, `Secure` y `SameSite=Strict`, y el control de acceso se ejecuta en una Edge Function antes de servir cualquier ruta o archivo.

## Desarrollo local

Se necesita Node.js y Netlify CLI. Definir variables locales de prueba en un `.env` ignorado por Git y ejecutar:

```sh
netlify dev
```

Usar credenciales de prueba distintas a las de producción. La Edge Function no permite el acceso si faltan variables.

## Revisión funcional

- Iniciar sesión y abrir directamente `/`, `src/data/modules.js`, `src/styles.css` y `visit.png` sin cookie: todas las rutas deben redirigir a `/login`.
- Ingresar credenciales válidas, navegar por los ocho módulos y verificar gráficos, tablas, textos de cobertura y fotografías.
- Comprobar que cada barra muestre su valor; en gráficos dona, verificar porcentajes internos y la tabla completa.
- Cerrar sesión y repetir el acceso directo a los recursos.
- Usar la vista de impresión del navegador para comprobar la salida horizontal y que los gráficos y tablas no se corten.
- No publicar hasta que las variables privadas estén configuradas y el flujo de acceso se haya validado en la URL de producción.

## Datos y cobertura

Los indicadores se contrastan con el Excel consolidado enlazado por el usuario y con las hojas fuente incluidas en él. Los valores de 2026 son parciales y se muestran con su período. El [registro de controles](DATA_AUDIT.md) documenta diferencias sin conciliar. No contiene microdatos personales ni el Excel fuente.

## Fotografías

Se usan fotografías de Wikimedia Commons con licencias verificadas y atribución por módulo. El crédito completo y el enlace a la licencia aparecen al pie de cada módulo y en el panel de fuentes.
