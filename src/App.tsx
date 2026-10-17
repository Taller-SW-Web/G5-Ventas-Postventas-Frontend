// Rutas del portal del Gestor. Todo lo administrativo vive bajo /admin/* y exige ADMIN_VENTAS.
// Vistas públicas de integración (encuesta CSAT, consulta de reclamo) irán fuera de /admin/*.
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { LayoutGestor } from '@/components/LayoutGestor';
import { RutaProtegida } from '@/components/RutaProtegida';
import { AccesoDenegadoPage } from '@/pages/AccesoDenegado';
import { AnulacionesPage } from '@/pages/Anulaciones';
import { AtencionPrioritariaPage } from '@/pages/AtencionPrioritaria';
import { CalificacionesReportesPage } from '@/pages/CalificacionesReportes';
import { DashboardPage } from '@/pages/Dashboard';
import { DetallePedidoPage } from '@/pages/DetallePedido';
import { DevolucionesPage } from '@/pages/Devoluciones';
import { HubPostventaPage } from '@/pages/HubPostventa';
import { IngresarPage } from '@/pages/Ingresar';
import { NoEncontradoPage } from '@/pages/NoEncontrado';
import { PedidosPage } from '@/pages/Pedidos';
import { ReclamosPage } from '@/pages/Reclamos';
import { ReembolsosPage } from '@/pages/Reembolsos';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="/acceso-denegado" element={<AccesoDenegadoPage />} />
        <Route path="/ingresar" element={<IngresarPage />} />

        <Route path="/admin" element={<RutaProtegida />}>
          <Route element={<LayoutGestor />}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />

            <Route path="pedidos" element={<PedidosPage />} />
            <Route path="pedidos/:pedidoId" element={<DetallePedidoPage />} />
            <Route path="anulaciones" element={<AnulacionesPage />} />

            <Route path="postventa" element={<HubPostventaPage />} />
            <Route path="postventa/prioritarios" element={<AtencionPrioritariaPage />} />
            <Route path="postventa/devoluciones" element={<DevolucionesPage />} />
            <Route path="postventa/reclamos" element={<ReclamosPage />} />
            <Route path="postventa/reembolsos" element={<ReembolsosPage />} />

            <Route path="reportes" element={<CalificacionesReportesPage />} />

            <Route path="*" element={<NoEncontradoPage />} />
          </Route>
        </Route>

        <Route path="*" element={<NoEncontradoPage />} />
      </Routes>
    </BrowserRouter>
  );
}
