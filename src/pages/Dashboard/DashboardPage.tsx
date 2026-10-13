// Mockup 01 — Dashboard (F6). Responsable: Fabrizio
// Detalle de la pantalla: diseno/mockups/Mockup 01 - *.md
import { PaginaEnConstruccion } from '@/components/PaginaEnConstruccion';

export function DashboardPage() {
  return (
    <PaginaEnConstruccion
      titulo="Dashboard"
      mockup="Mockup 01"
      funcionalidad="F6"
      responsable="Fabrizio"
      endpoints="GET /api/v2/dashboard/metricas (2.12)"
    />
  );
}
