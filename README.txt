# IBRCV · Votación Pastoral — Naifer Lovera

Aplicación web de demostración para la votación pastoral de la Iglesia Bautista Reformada Cristo Viene (IBRCV).

## Funciones

- Pantalla inicial con carga de 5 segundos y barra de progreso.
- Ventana de bienvenida: “Aplicación de votación lista para continuar”.
- Rol Votante:
  - Foto y nombre de Naifer Lovera.
  - “Estoy de acuerdo” / “No estoy de acuerdo”.
  - Ventana de confirmación.
  - “Estoy seguro” registra el voto.
  - “Corregir voto” NO registra el voto y permite votar nuevamente.
  - Después de confirmar aparece “Voto confirmado” + “Continuar” para el siguiente votante.
- Rol Administrador:
  - Solicita la clave `ADMINICRCV17`.
  - Estadísticas y diagrama de barras.
  - Generación de PDF.
  - Reinicio de votos.
  - Reinicio completo de la aplicación con clave.
- DEMO:
  - Indicaciones de uso.
  - Candidato “Sr. Kiwi”.
  - Votación completa con confirmación/corrección.
  - Generación de un documento identificado como “PDF DE PRUEBA”.

## Imágenes

Coloque:
- `images/FotoCandidato.png`
- `images/FotoKiwi.png`

El logo suministrado está incluido como `images/logo_IBRCV.png`.

## Nota importante sobre el reinicio

El botón “Reiniciar aplicación” limpia `localStorage`, `sessionStorage`, Cache Storage y registros de Service Worker del mismo origen cuando el navegador lo permite, y luego recarga la página.

No es posible que una página web borre la caché general del navegador ni archivos fuera de su propio origen por razones de seguridad.

## Nota de seguridad

La clave de administrador está incluida en el JavaScript porque esta es una aplicación estática de demostración. Esto NO constituye una autenticación segura para una votación real. Para producción debe existir un backend con autenticación, autorización, base de datos, HTTPS, auditoría y control de votos duplicados.

## Ejecución

Abra `index.html` con un navegador moderno. La biblioteca jsPDF se carga desde CDN, por lo que se requiere conexión a Internet para generar el PDF.
