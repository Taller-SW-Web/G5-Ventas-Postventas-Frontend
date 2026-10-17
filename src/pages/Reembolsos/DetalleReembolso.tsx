import { Button, Text, Title } from '@mantine/core';
import { EstadoBadge } from '@/components/EstadoBadge';
import type { ReembolsoVisual } from './ReembolsosPage';

type ModalAccion = 'autorizar' | 'ejecutar' | 'reintento' | 'resultado';

const origenTexto = (origen: ReembolsoVisual['origen']) => origen === 'ANULACION' ? 'Anulación' : 'Devolución';
const montoTexto = (monto: number) => `S/ ${monto.toFixed(2)}`;

function datos(reembolso: ReembolsoVisual) {
  const numero = Number(reembolso.codigo.slice(-4));
  const autorizacionPendiente = reembolso.estado === 'PENDIENTE' && numero % 2 === 0;
  const autorizado = reembolso.estado !== 'PENDIENTE' || !autorizacionPendiente;
  const enviado = reembolso.estado === 'FALLIDO' || reembolso.estado === 'EXITOSO';
  const confirmado = reembolso.estado === 'EXITOSO';
  return {
    autorizado, enviado, confirmado,
    canal: numero % 3 === 0 ? 'Retail' : numero % 2 === 0 ? 'Marketplace' : 'Chatbot',
    referencia: `PAY-${reembolso.pedido.slice(-4)}`,
    operacion: enviado ? `OP-99${reembolso.codigo.slice(-4)}` : '—',
    clave: `IDEMP-REB-${reembolso.codigo.slice(-4)}`,
    resultado: reembolso.estado === 'EXITOSO'
      ? 'Extorno confirmado por el simulador'
      : reembolso.estado === 'FALLIDO'
        ? 'Error definitivo del simulador'
        : autorizado ? 'Autorización aprobada · listo para ejecutar' : 'Pendiente de autorización',
  };
}

function ListaDatos({ valores }: { valores: Array<[string, string]> }) {
  return <dl className="reembolsos-definition-list">{valores.flatMap(([etiqueta, valor]) => [
    <dt key={`${etiqueta}-dt`}>{etiqueta}</dt>,
    <dd key={`${etiqueta}-dd`}>{valor}</dd>,
  ])}</dl>;
}

function PasoHistorial({ titulo, descripcion, fecha, activo, ultimo = false }: { titulo: string; descripcion: string; fecha: string; activo: boolean; ultimo?: boolean }) {
  return <div className={`reembolsos-history-step${activo ? ' reembolsos-history-step--active' : ''}${ultimo ? ' reembolsos-history-step--last' : ''}`}>
    <span className="reembolsos-history-dot" />
    <div><strong>{titulo}</strong><Text>{descripcion}</Text></div>
    <time>{fecha}</time>
  </div>;
}

export function DetalleReembolso({ reembolso, onClose, onOpenModal }: { reembolso: ReembolsoVisual; onClose: () => void; onOpenModal: (modal: ModalAccion) => void }) {
  const detalle = datos(reembolso);
  const fecha = reembolso.fecha;
  return <>
    <section className="reembolsos-history" aria-label="Historial del reembolso">
      <Title order={2}>Historial del reembolso</Title><div className="reembolsos-detail-divider" />
      <PasoHistorial titulo="Solicitud registrada" descripcion="Origen, pago, monto y clave validados" fecha={`${fecha} 09:10`} activo />
      <PasoHistorial titulo="Autorización aprobada" descripcion="Gestor autoriza cuando corresponde" fecha={detalle.autorizado ? `${fecha} 10:05` : '—'} activo={detalle.autorizado} />
      <PasoHistorial titulo="Extorno enviado" descripcion="Operación enviada al simulador" fecha={detalle.enviado ? `${fecha} 10:10` : '—'} activo={detalle.enviado} />
      <PasoHistorial titulo="Resultado confirmado" descripcion="EXITOSO o FALLIDO queda persistido" fecha={detalle.confirmado || reembolso.estado === 'FALLIDO' ? `${fecha} 10:15` : '—'} activo={detalle.confirmado || reembolso.estado === 'FALLIDO'} ultimo />
    </section>
    <aside className="reembolsos-detail" aria-label="Detalle del reembolso">
      <section className="reembolsos-detail-card">
        <div className="reembolsos-detail-heading"><Title order={2}>Detalle del reembolso</Title><EstadoBadge entidad="reembolso" estado={reembolso.estado} size="sm" /><button type="button" className="reembolsos-detail-close" aria-label="Cerrar detalle" onClick={onClose}>×</button></div>
        <div className="reembolsos-detail-divider" />
        <ListaDatos valores={[
          ['Código', reembolso.codigo], ['Pedido', reembolso.pedido], ['Origen', reembolso.origen],
          ['Monto', montoTexto(reembolso.monto)], ['Parcial / total', reembolso.origen === 'ANULACION' ? 'Total' : 'Parcial'],
          ['Referencia de pago', detalle.referencia], ['Id de operación', detalle.operacion],
          ['Autorizador', detalle.autorizado ? 'Gestor / Administrador' : 'Pendiente'],
          ['Resultado simulado', detalle.resultado], ['Fecha de creación', `${fecha} 10:00`], ['Estado', reembolso.estado],
        ]} />
      </section>
      <section className="reembolsos-detail-card reembolsos-trace"><Title order={2}>Trazabilidad</Title><div className="reembolsos-detail-divider" /><ListaDatos valores={[['Cliente', reembolso.cliente], ['Canal', detalle.canal], ['Clave idempotente', detalle.clave]]} /></section>
      <section className="reembolsos-detail-card reembolsos-actions">
        <Title order={2}>Acciones disponibles</Title><div className="reembolsos-detail-divider" />
        {reembolso.estado === 'PENDIENTE' && !detalle.autorizado && <Button onClick={() => onOpenModal('autorizar')}>Autorizar reembolso</Button>}
        {reembolso.estado === 'PENDIENTE' && detalle.autorizado && <Button onClick={() => onOpenModal('ejecutar')}>Ejecutar reembolso</Button>}
        {reembolso.estado === 'FALLIDO' && <><Button variant="default" onClick={() => onOpenModal('resultado')}>Consultar resultado</Button><Button onClick={() => onOpenModal('reintento')}>Reintento seguro</Button></>}
        {reembolso.estado === 'EXITOSO' && <Button className="reembolsos-success-action" variant="light" onClick={() => onOpenModal('resultado')}>Consultar resultado</Button>}
        <Button variant="default">Volver al pedido</Button><Button variant="subtle">Ver expediente origen</Button>
      </section>
    </aside>
  </>;
}

export function ResultadoReembolso({ reembolso, onClose }: { reembolso: ReembolsoVisual | null; onClose: () => void }) {
  if (!reembolso) return null;
  const detalle = datos(reembolso);
  return <><Title order={2}>Resultado del reembolso</Title><div className="reembolsos-result-list"><ListaDatos valores={[
    ['Código', reembolso.codigo], ['Pedido', reembolso.pedido], ['Origen', origenTexto(reembolso.origen)],
    ['Monto', montoTexto(reembolso.monto)], ['Id operación', detalle.operacion], ['Estado', reembolso.estado], ['Resultado', detalle.resultado],
  ]} /></div><div className="reembolsos-result-close"><Button color="dark" onClick={onClose}>Cerrar</Button></div></>;
}
