# Ventanas de calificaciones (Johan)

Dos componentes visuales del Mockup 09, para montar sobre el panel general de Fabrizio.
No consultan servicios ni modifican datos. Las propiedades son modelos de presentación,
no contratos de un endpoint.

## Archivos

- `DetalleSatisfaccion/`: componente, propiedades, CSS y exportación. Medida de escritorio: 780 × 560 px.
- `ComentariosClientes/`: componente, propiedades, CSS y exportación. Medida de escritorio: 900 × 590 px.
- `compartido/VentanaCalificaciones.*`: modal Mantine con título accesible, contexto de filtros y cierre.
- `calificaciones.types.ts`: contexto aplicado, resumen y comentarios.
- `datos/calificaciones.ejemplo.ts`: ejemplos del Figma, separados de los servicios.
- `preview/VistaPreviaCalificaciones.tsx`: comprobación manual solo en desarrollo.
- `src/assets/calificaciones/separador-comentarios.svg`: separador original del Figma (852 × 1 px).

## Probar sin modificar el panel

Desde la raíz del frontend:

```powershell
npm.cmd run dev
```

Abrir `http://localhost:5173/preview/calificaciones.html` (o el puerto que indique Vite).
La vista incluye los botones Ver detalle, Ver todos, Ver y Alternar sin datos.
Es una entrada de desarrollo independiente; no se registra en `App.tsx` y el build
normal de producción conserva únicamente la entrada del portal.

## Integrar con Fabrizio

El panel controla una sola ventana activa y comparte con ambos modales los filtros activos.
Los desplegables de los modales aplican su selección mediante `onCambiarContexto`. El panel debe actualizar el contexto y los datos juntos; no basta con cambiar la etiqueta del filtro.

Ejemplo dentro del componente del panel (no sustituye su implementación):

```tsx
import { useState } from 'react';
import { DetalleSatisfaccion } from './DetalleSatisfaccion';
import { ComentariosClientes } from './ComentariosClientes';

const [ventana, setVentana] = useState<'satisfaccion' | 'comentarios' | null>(null);

// Botón Ver detalle del bloque de satisfacción:
// onClick={() => setVentana('satisfaccion')}
// Botones Ver todos y Ver de comentarios, y la fila cuando corresponda:
// onClick={() => setVentana('comentarios')}

<DetalleSatisfaccion
  abierto={ventana === 'satisfaccion'}
  contexto={contextoAplicado}
  opcionesPeriodos={periodosDisponibles}
  onCambiarContexto={aplicarContextoCalificaciones}
  resumen={resumenSatisfaccion}
  onCerrar={() => setVentana(null)}
/>
<ComentariosClientes
  abierto={ventana === 'comentarios'}
  contexto={contextoAplicado}
  opcionesPeriodos={periodosDisponibles}
  onCambiarContexto={aplicarContextoCalificaciones}
  comentarios={comentariosDelPeriodoYCanal}
  onCerrar={() => setVentana(null)}
/>
```

`contextoAplicado`, `resumenSatisfaccion` y `comentariosDelPeriodoYCanal` representan
los datos que administra el panel. `periodosDisponibles` es la lista de etiquetas del selector y `aplicarContextoCalificaciones` actualiza el filtro activo y su consulta. Para la fase visual se pueden usar los ejemplos
exportados desde `datos/calificaciones.ejemplo.ts`.

La ventana de comentarios no recibe una fila seleccionada: Ver todos, Ver y la fila
abren la misma lista general en el prototipo. El panel entrega la lista ya filtrada;
el modal no interpreta por su cuenta la etiqueta del periodo ni consulta al backend.

## Comportamiento

- Centrado sobre la ventana del navegador, sin ruta nueva y sin oscurecer el fondo.
- Transición de desvanecimiento de 150 ms; esquinas de 16 px.
- Cerrar llama a `onCerrar`; no se cierra al pulsar fuera.
- Mantine conserva el foco dentro del diálogo, permite Escape y devuelve el foco al disparador.
- Las medidas se limitan al espacio disponible. En móvil, satisfacción apila sus tarjetas
  y comentarios permite desplazamiento horizontal dentro de la tabla.
- `promedio: null` y `distribucion: []` muestran ausencia de calificaciones.
- `comentarios: []` muestra ausencia de comentarios.
- La fecha de cada comentario usa `AAAA-MM-DD` y se presenta sin conversión de zona horaria.

## Fase visual y pendientes

Los datos de demostración conservan los valores del Figma: su promedio 4.62 no coincide
con la distribución de estrellas (4.04 ponderado). No deben tratarse como resultados reales.
Al integrar servicios, promedio y distribución deben provenir de la misma consulta.

Falta montar estos componentes en el panel de Fabrizio y conectar datos reales cuando
estén definidos los endpoints. Su archivo principal y las rutas del portal no se modifican aquí.

## Referencias

- `G5-Ventas-Postventas/guias/frontend/estructura-frontend.md`
- `G5-Ventas-Postventas/guias/frontend/guia-frontend.md`, secciones 1.2 y 3.
- `G5-Ventas-Postventas/diseno/mockups/Mockup 09 - Calificaciones y Reportes.md`
- Figma: archivo `J2KeLP6nl8qlDunNNUAC52`, página `150:255`, ventanas `162:373` y `162:418`.

## Selectores dentro de las ventanas

Ambas ventanas muestran los desplegables Periodo y Canal. Canal ofrece Todos,
Marketplace, Chatbot y Retail. Los periodos los entrega Fabrizio mediante
`opcionesPeriodos`; no están fijados en los componentes del producto.

`onCambiarContexto(nuevoContexto)` comunica la selección al panel. El padre conserva
el estado y proporciona los resultados del nuevo filtro a ambas ventanas.
La selección se conserva al cerrar y pasar de satisfacción a comentarios.
Los menús se montan dentro del modal para respetar el foco de teclado.

En la vista previa se filtran comentarios de demostración por fecha y canal.
Últimos 15 días usa como referencia el 30 de septiembre de 2026; Agosto no tiene
comentarios en la muestra y permite comprobar el estado vacío.
Los cambios se aplican al seleccionar, sin añadir un botón Aplicar dentro del modal.
