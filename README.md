# G5-Ventas-Postventas-Frontend

Portal del Gestor del **Módulo D — Ventas y Postventa**. Una sola aplicación que consume M1 (`api-ventas`) y M2 (`api-postventa`).

Stack: React + TypeScript + Vite + Mantine UI (+ React Router y Axios).

Guías de referencia (repo de documentación `G5-Ventas-Postventas`):
- `guias/frontend/estructura-frontend.md`: estructura de carpetas y reparto por pantalla
- `guias/frontend/guia-frontend.md`: reglas y detalle de cada pantalla
- `specs/api/api-ventas.md`, `specs/api/api-postventas.md`: contratos (fuente de verdad de los `types/`)

## Primeros pasos

```bash
npm install
cp .env.example .env
npm run dev
```

La app abre en `http://localhost:5173`.

Mientras Seguridad (G7) no entregue el login, puedes poner `VITE_AUTH_DESACTIVADA=true` en tu `.env` para entrar a `/admin/*` en desarrollo. Esa variable solo se aplica con `npm run dev` y nunca en un build.

Antes de abrir un PR: `npm run build` tiene que pasar sin errores.

## Estructura

```text
src/
├── main.tsx                 MantineProvider, Notifications, estilos globales
├── App.tsx                  rutas (/admin/* protegidas con ADMIN_VENTAS)
├── theme/                   theme de Mantine (paleta, tipografía, radios) + global.css
├── components/              UI Kit reutilizable
│   ├── EstadoBadge/         badge de estado de pedido, anulación, devolución, reclamo y reembolso
│   ├── TablaPaginada/       tabla + paginación (pagina base 0, como el contrato)
│   ├── ModalConfirmacion/   confirmación de acciones irreversibles
│   ├── EstadoCarga/         loading / error / vacío (y 501 como "todavía no disponible")
│   ├── LayoutGestor/        barra lateral Dashboard / Pedidos / Postventa / Reportes
│   ├── RutaProtegida/       exige token con rol ADMIN_VENTAS
│   └── PaginaEnConstruccion/ marcador temporal; se borra cuando todas las pantallas existan
├── pages/                   una carpeta por pantalla (Mockup 01 a 09)
├── services/                api.ts (cliente HTTP central) + un archivo por funcionalidad
├── types/                   interfaces TypeScript según los contratos
└── hooks/                   useConsulta, usePaginacion
```

## Rutas y responsables

| Ruta | Pantalla | Mockup | Responsable |
|---|---|---|---|
| `/admin/dashboard` | Dashboard | 01 | Fabrizio |
| `/admin/pedidos` | Pedidos | 02 | Michael |
| `/admin/pedidos/:pedidoId` | Detalle del pedido | 03 | Michael |
| `/admin/anulaciones` | Anulaciones | 04 | Luis Arroyo |
| `/admin/postventa` | Hub Postventa | 05 | Joseph |
| `/admin/postventa/devoluciones` | Devoluciones y cambios | 06 | Joseph |
| `/admin/postventa/reclamos` | Reclamos | 07 | Fabrizio |
| `/admin/postventa/reembolsos` | Reembolsos | 08 | Luis Alejandro |
| `/admin/reportes` | Calificaciones y reportes | 09 | Johan + Fabrizio |

## Reglas rápidas

- Nunca `any`. Estados, roles y enums con el valor exacto del contrato (`EN_PREPARACION`, `ADMIN_VENTAS`...).
- Toda pantalla con datos async maneja los 4 estados: loading, success, error, vacío (usa `EstadoCarga`).
- Acciones irreversibles siempre con `ModalConfirmacion` y un mensaje explícito.
- Los estados se pintan con `EstadoBadge`, nunca con colores puestos a mano.
- Las llamadas HTTP pasan por `services/`; ninguna pantalla crea su propio cliente.
- Rama por persona, PR hacia `main`, Conventional Commits (`feat(f3): bandeja de devoluciones`).
