import { Button, Text, Title } from '@mantine/core';
import { EstadoBadge } from '@/components/EstadoBadge';
import type { DetalleReembolsoResponse } from '@/types/reembolso';

type ModalAccion = 'autorizar' | 'ejecutar' | 'reintento' | 'resultado' | null;
const origen = (valor: DetalleReembolsoResponse['origen']) => valor === 'ANULACION' ? 'Anulación' : 'Devolución';
const monto = (valor: number, moneda: string) => `${moneda === 'PEN' ? 'S/' : moneda} ${valor.toFixed(2)}`;
const fecha = (valor: string | null) => valor ? new Intl.DateTimeFormat('es-PE', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(valor)) : '—';
const canal = (valor: DetalleReembolsoResponse['canal']) => valor ? valor.charAt(0) + valor.slice(1).toLowerCase() : '—';

function ListaDatos({ valores }: { valores: Array<[string, string]> }) {
  return <dl className="reembolsos-definition-list">{valores.flatMap(([etiqueta, valor]) => [<dt key={`${etiqueta}-dt`}>{etiqueta}</dt>, <dd key={`${etiqueta}-dd`}>{valor}</dd>])}</dl>;
}
function Paso({ titulo, descripcion, cuando, activo, ultimo = false }: { titulo: string; descripcion: string; cuando: string; activo: boolean; ultimo?: boolean }) {
  return <div className={`reembolsos-history-step${activo ? ' reembolsos-history-step--active' : ''}${ultimo ? ' reembolsos-history-step--last' : ''}`}><span className="reembolsos-history-dot" /><div><strong>{titulo}</strong><Text>{descripcion}</Text></div><time>{cuando}</time></div>;
}

export function DetalleReembolso({ reembolso, autorizadoVisualmente, onClose, onOpenModal }: { reembolso: DetalleReembolsoResponse; autorizadoVisualmente: boolean; onClose: () => void; onOpenModal: (modal: ModalAccion) => void }) {
  const intento = reembolso.intentos.at(-1);
  const enviado = reembolso.intentos.length > 0;
  const confirmado = reembolso.estado === 'EXITOSO' || reembolso.estado === 'FALLIDO';
  const autorizado = confirmado || autorizadoVisualmente;
  return <>
    <section className="reembolsos-history" aria-label="Historial del reembolso"><Title order={2}>Historial del reembolso</Title><div className="reembolsos-detail-divider" />
      <Paso titulo="Solicitud registrada" descripcion="Origen, pago, monto y clave validados" cuando={fecha(`${reembolso.fecha}T00:00:00`)} activo />
      <Paso titulo="Autorización aprobada" descripcion="Confirmación visual del gestor" cuando={autorizado ? fecha(intento?.fecha ?? null) : '—'} activo={autorizado} />
      <Paso titulo="Extorno enviado" descripcion="Operación enviada al simulador" cuando={enviado ? fecha(intento?.fecha ?? null) : '—'} activo={enviado} />
      <Paso titulo="Resultado confirmado" descripcion="EXITOSO o FALLIDO queda persistido" cuando={confirmado ? fecha(intento?.fecha ?? null) : '—'} activo={confirmado} ultimo />
    </section>
    <aside className="reembolsos-detail" aria-label="Detalle del reembolso"><section className="reembolsos-detail-card"><div className="reembolsos-detail-heading"><Title order={2}>Detalle del reembolso</Title><EstadoBadge entidad="reembolso" estado={reembolso.estado} size="sm" /><button type="button" className="reembolsos-detail-close" aria-label="Cerrar detalle" onClick={onClose}>×</button></div><div className="reembolsos-detail-divider" /><ListaDatos valores={[
      ['Código', reembolso.reembolsoId], ['Pedido', reembolso.pedidoId], ['Origen', origen(reembolso.origen)], ['Monto', monto(reembolso.monto, reembolso.moneda)], ['Parcial / total', reembolso.total ? 'Total' : 'Parcial'], ['Referencia de pago', '—'], ['Id de operación', reembolso.transaccionPasarelaId ?? '—'], ['Autorizador', reembolso.autorizadorId ?? '—'], ['Resultado simulado', intento?.resultado ?? 'Pendiente de autorización'], ['Fecha de creación', fecha(`${reembolso.fecha}T00:00:00`)], ['Estado', reembolso.estado],
    ]} /></section>
      <section className="reembolsos-detail-card reembolsos-trace"><Title order={2}>Trazabilidad</Title><div className="reembolsos-detail-divider" /><ListaDatos valores={[['Cliente', reembolso.clienteNombre ?? '—'], ['Canal', canal(reembolso.canal)], ['Método de pago', reembolso.metodoPago ?? '—'], ['Clave idempotente', reembolso.claveIdempotencia]]} /></section>
      <section className="reembolsos-detail-card reembolsos-actions"><Title order={2}>Acciones disponibles</Title><div className="reembolsos-detail-divider" />
        {reembolso.estado === 'PENDIENTE' && !autorizado && <Button onClick={() => onOpenModal('autorizar')}>Autorizar reembolso</Button>}
        {reembolso.estado === 'PENDIENTE' && autorizado && <Button onClick={() => onOpenModal('ejecutar')}>Ejecutar reembolso</Button>}
        {reembolso.estado === 'FALLIDO' && <><Button variant="default" onClick={() => onOpenModal('resultado')}>Consultar resultado</Button><Button onClick={() => onOpenModal('reintento')}>Reintento seguro</Button></>}
        {reembolso.estado === 'EXITOSO' && <Button className="reembolsos-success-action" variant="light" onClick={() => onOpenModal('resultado')}>Consultar resultado</Button>}
        <Button variant="default">Volver al pedido</Button><Button variant="subtle">Ver expediente origen</Button>
      </section></aside>
  </>;
}

export function ResultadoReembolso({ reembolso, onClose }: { reembolso: DetalleReembolsoResponse | null; onClose: () => void }) {
  if (!reembolso) return null;
  const intento = reembolso.intentos.at(-1);
  return <><Title order={2}>Resultado del reembolso</Title><div className="reembolsos-result-list"><ListaDatos valores={[['Código', reembolso.reembolsoId], ['Pedido', reembolso.pedidoId], ['Origen', origen(reembolso.origen)], ['Monto', monto(reembolso.monto, reembolso.moneda)], ['Id operación', reembolso.transaccionPasarelaId ?? '—'], ['Estado', reembolso.estado], ['Resultado', intento?.resultado ?? 'Pendiente de autorización']]} /></div><div className="reembolsos-result-close"><Button color="dark" onClick={onClose}>Cerrar</Button></div></>;
}
