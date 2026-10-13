// Mockup 03 — Detalle del pedido (F1). Responsable: Michael
// Detalle de la pantalla: diseno/mockups/Mockup 03 - *.md
import { PaginaEnConstruccion } from '@/components/PaginaEnConstruccion';

export function DetallePedidoPage() {
  return (
    <PaginaEnConstruccion
      titulo="Detalle del pedido"
      mockup="Mockup 03"
      funcionalidad="F1"
      responsable="Michael"
      endpoints="GET /api/v1/pedidos/{pedidoId} (1.3)"
    />
  );
}
