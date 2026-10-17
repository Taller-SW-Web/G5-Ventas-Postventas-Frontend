# Calificaciones (Johan) — Mockup 09

La ruta /admin/reportes consulta GET /api/v2/csat usando apiPostventa, el cliente
HTTP compartido del proyecto. Conserva la configuración del Gateway y el token de sesión.
No importa los datos de demostración en la pantalla del Gestor.

## Organización

- src/types/consultaCalificaciones.ts: respuesta y filtros de GET CSAT.
- src/services/calificaciones.ts: registro existente y consulta del Gestor.
- consultaCalificaciones.ts: convierte puntaje a puntuacion y cantidades a porcentajes.
- ProveedorCalificaciones.tsx: consulta compartida, filtros, apertura de ventanas y paginación.
- SeccionSatisfaccion.tsx y SeccionComentarios.tsx: bloques F5 del panel.
- DetalleSatisfaccion/ y ComentariosClientes/: ventanas visuales reutilizables.
- compartido/VentanaCalificaciones.*: marco, selectores y cierre de ambos modales.

## Flujo integrado

1. El panel conserva los filtros aplicados de Fabrizio (periodo y canal).
2. Se envían desde y hasta como fechas AAAA-MM-DD. Todos omite el parámetro canal.
3. La consulta del panel trae cinco respuestas recientes y el resumen completo del filtro.
4. Ver detalle abre satisfacción con ese resumen. El promedio viene del servidor;
   los porcentajes usan resumen.distribucion / resumen.total, nunca la página de comentarios.
5. Ver todos y cada botón Ver abren la misma lista general del prototipo.
   La ventana consulta páginas de ocho respuestas; pagina comienza en cero en la API.
6. Cambiar periodo o canal desde un modal actualiza también los filtros del panel
   y reinicia la lista en la primera página. Cerrar conserva los filtros.

La respuesta se toma de ListadoCalificacionesResponse del backend. Su comentario
indica que aún debe reflejarse en el contrato escrito de la documentación.
Los comentarios nulos o vacíos se presentan como Sin comentario; siguen siendo
calificaciones válidas y forman parte de la distribución.

## Estados

Se reutiliza EstadoCarga para carga, error y Reintentar. Los filtros sin respuestas
muestran el estado vacío. Un fallo no se reemplaza por datos de ejemplo.
El modal de satisfacción recibe el estado de la consulta del panel; la lista paginada
tiene su propio estado, por lo que pasar de página no cambia las cinco respuestas recientes.

Mantine mantiene el foco dentro de la ventana, permite Escape y cierre por botón.
No se cierra al pulsar fuera. Las tablas permiten desplazamiento horizontal en móvil.

## Comprobar con el backend real

1. Arrancar el Gateway y Postventa con acceso a la base y una sesión ADMIN_VENTAS.
   Para conexión directa local, dejar VITE_GATEWAY_URL vacío y configurar
   VITE_API_POSTVENTA_URL con el puerto real de Postventa (8082 o el configurado).
2. Ejecutar npm.cmd run dev y abrir /admin/reportes.
3. Aplicar un periodo con calificaciones y comprobar promedio, estrellas y comentarios.
4. Abrir ambos modales, cambiar canal y periodo, avanzar páginas, cerrar y volver a abrir.
5. Revisar en Red del navegador GET /api/v2/csat y sus filtros. Sin resultados,
   no debe aparecer un promedio inventado. Ante un fallo debe aparecer Reintentar.

El panel mantiene la consulta de métricas 2.12 de Fabrizio para los indicadores
operativos. Ambas rutas deben estar disponibles en el entorno que se pruebe.

## Vista previa de diseño

/preview/calificaciones.html sigue siendo una entrada exclusiva de desarrollo, con
ejemplos del Figma. No consulta la API ni se incorpora al build normal de producción.
No debe usarse para validar la integración real.

## Validación de esta conexión

- npm.cmd run build: aprobado.
- Navegador con una API temporal según el DTO del backend: filtros compartidos,
  resumen sobre todo el filtro, página siguiente, reinicio al cambiar canal,
  respuestas sin comentario, estado vacío y recuperación mediante Reintentar.
- Pendiente: comprobar el flujo contra Postventa y la base reales encendidos.
  La API temporal de comprobación no se añade al repositorio ni a la configuración.
