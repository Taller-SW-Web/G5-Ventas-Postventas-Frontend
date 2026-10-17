import { useCallback, useState } from 'react';
import { Button, Loader, Modal, Pagination, Select, Table, Text, TextInput, Title } from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { EstadoBadge } from '@/components/EstadoBadge';
import { EstadoCarga } from '@/components/EstadoCarga/EstadoCarga';
import { useConsulta } from '@/hooks/useConsulta';
import { obtenerDetalleReembolso, listarReembolsos, procesarReembolso } from '@/services/reembolsos';
import type { DetalleReembolsoResponse, EstadoReembolso, OrigenReembolso, ReembolsoResumen } from '@/types/reembolso';
import backIcon from '@/assets/reembolsos/back.svg';
import calendarIcon from '@/assets/reembolsos/calendar.svg';
import chevronIcon from '@/assets/reembolsos/chevron.svg';
import searchIcon from '@/assets/reembolsos/search.svg';
import { DetalleReembolso, ResultadoReembolso } from './DetalleReembolso';
import './ReembolsosPage.css';

const RESULTADOS_POR_PAGINA = 8;
const etiquetaOrigen: Record<OrigenReembolso, string> = { ANULACION: 'Anulación', DEVOLUCION: 'Devolución' };
const monto = (valor: number, moneda = 'PEN') => `${moneda === 'PEN' ? 'S/' : moneda} ${valor.toFixed(2)}`;
const fecha = (valor: string) => new Intl.DateTimeFormat('es-PE').format(new Date(`${valor}T00:00:00`));
const compacto = (valor: number) => valor < 1_000 ? String(valor) : `${new Intl.NumberFormat('en-US', { maximumFractionDigits: valor < 10_000 ? 1 : 0 }).format(valor / (valor >= 1_000_000 ? 1_000_000 : 1_000))}${valor >= 1_000_000 ? 'M' : 'K'}`;
type ModalAccion = 'autorizar' | 'ejecutar' | 'reintento' | 'resultado' | null;

export function ReembolsosPage() {
  const [busqueda, setBusqueda] = useState('');
  const [estadoFiltro, setEstadoFiltro] = useState<string | null>('TODOS');
  const [origenFiltro, setOrigenFiltro] = useState<string | null>('TODOS');
  const [fechaFiltro, setFechaFiltro] = useState<string | null>(null);
  const [aplicados, setAplicados] = useState({ busqueda: '', estado: 'TODOS', origen: 'TODOS', fecha: null as string | null });
  const [pagina, setPagina] = useState(1);
  const [orden, setOrden] = useState<'RECIENTES' | 'ANTIGUOS'>('RECIENTES');
  const [seleccionado, setSeleccionado] = useState<string | null>(null);
  const [modal, setModal] = useState<ModalAccion>(null);
  const [autorizados, setAutorizados] = useState<string[]>([]);
  const [procesando, setProcesando] = useState(false);
  const [resultadoActual, setResultadoActual] = useState<DetalleReembolsoResponse | null>(null);

  const cargarListado = useCallback(() => listarReembolsos({
    buscar: aplicados.busqueda || undefined,
    estado: aplicados.estado === 'TODOS' ? undefined : aplicados.estado as EstadoReembolso,
    origen: aplicados.origen === 'TODOS' ? undefined : aplicados.origen as OrigenReembolso,
    desde: aplicados.fecha ?? undefined, hasta: aplicados.fecha ?? undefined, orden,
    pagina: pagina - 1, tamano: RESULTADOS_POR_PAGINA,
  }), [aplicados, orden, pagina]);
  const listado = useConsulta(cargarListado, [cargarListado]);
  const cargarDetalle = useCallback(() => seleccionado ? obtenerDetalleReembolso(seleccionado) : Promise.resolve(null), [seleccionado]);
  const detalle = useConsulta(cargarDetalle, [cargarDetalle]);

  const aplicar = () => { setAplicados({ busqueda, estado: estadoFiltro ?? 'TODOS', origen: origenFiltro ?? 'TODOS', fecha: fechaFiltro }); setPagina(1); };
  const limpiar = () => { setBusqueda(''); setEstadoFiltro('TODOS'); setOrigenFiltro('TODOS'); setFechaFiltro(null); setAplicados({ busqueda: '', estado: 'TODOS', origen: 'TODOS', fecha: null }); setPagina(1); };
  const ejecutar = async () => {
    const reembolso = detalle.datos;
    if (!reembolso) return;
    setProcesando(true);
    try {
      await procesarReembolso({ origen: reembolso.origen, origenId: reembolso.origenId, referenciaId: reembolso.pedidoId, monto: reembolso.monto, moneda: reembolso.moneda }, reembolso.claveIdempotencia);
      setResultadoActual(await obtenerDetalleReembolso(reembolso.reembolsoId));
      listado.recargar(); detalle.recargar(); setModal('resultado');
    } finally { setProcesando(false); }
  };

  return <section className="reembolsos-page">
    <div className="reembolsos-heading"><button className="reembolsos-back" type="button" aria-label="Volver"><img src={backIcon} alt="" /></button><Title order={1}>Reembolsos</Title></div>
    <section className="reembolsos-filters" aria-label="Filtros de reembolsos">
      <label className="reembolsos-field reembolsos-search"><span>Buscar</span><TextInput value={busqueda} onChange={(e) => setBusqueda(e.currentTarget.value)} leftSection={<img src={searchIcon} alt="" className="reembolsos-input-icon" />} aria-label="Buscar por código o pedido" /></label>
      <label className="reembolsos-field"><span>Estado</span><Select value={estadoFiltro} onChange={setEstadoFiltro} data={[{ value: 'TODOS', label: 'Todos' }, { value: 'PENDIENTE', label: 'Pendiente' }, { value: 'EXITOSO', label: 'Exitoso' }, { value: 'FALLIDO', label: 'Fallido' }]} rightSection={<img src={chevronIcon} alt="" className="reembolsos-input-icon" />} rightSectionPointerEvents="none" allowDeselect={false} /></label>
      <label className="reembolsos-field"><span>Origen</span><Select value={origenFiltro} onChange={setOrigenFiltro} data={[{ value: 'TODOS', label: 'Todos' }, { value: 'ANULACION', label: 'Anulación' }, { value: 'DEVOLUCION', label: 'Devolución' }]} rightSection={<img src={chevronIcon} alt="" className="reembolsos-input-icon" />} rightSectionPointerEvents="none" allowDeselect={false} /></label>
      <label className="reembolsos-field reembolsos-date"><span>Fecha de creación</span><DateInput value={fechaFiltro} onChange={setFechaFiltro} valueFormat="DD/MM/YYYY" placeholder="Todos" leftSection={<img src={calendarIcon} alt="" className="reembolsos-input-icon" />} aria-label="Filtrar por fecha de creación" /></label>
      <div className="reembolsos-filter-actions"><Button onClick={aplicar}>Aplicar filtros</Button><Button variant="default" onClick={limpiar}>Limpiar</Button></div>
    </section>
    <section className={seleccionado ? 'reembolsos-card reembolsos-card--selected' : 'reembolsos-card'} aria-label="Listado de reembolsos">
      <div className="reembolsos-card-heading"><div><Title order={2}>Reembolsos</Title><Text>Operaciones registradas</Text></div><Select value={orden} onChange={(valor) => { setOrden(valor === 'ANTIGUOS' ? 'ANTIGUOS' : 'RECIENTES'); setPagina(1); }} data={[{ value: 'RECIENTES', label: 'Más recientes' }, { value: 'ANTIGUOS', label: 'Más antiguos' }]} rightSection={<img src={chevronIcon} alt="" className="reembolsos-input-icon" />} rightSectionPointerEvents="none" allowDeselect={false} /></div>
      <EstadoCarga {...listado} mensajeVacio="No hay reembolsos que coincidan con los filtros." onReintentar={listado.recargar}>{(respuesta) => <Table className="reembolsos-table" horizontalSpacing={8} verticalSpacing={0}><Table.Thead><Table.Tr><Table.Th>Código / fecha</Table.Th><Table.Th>Pedido</Table.Th><Table.Th>Cliente</Table.Th><Table.Th>Origen</Table.Th><Table.Th>Monto</Table.Th><Table.Th>Estado</Table.Th><Table.Th>Acción</Table.Th></Table.Tr></Table.Thead><Table.Tbody>{respuesta.contenido.map((r: ReembolsoResumen) => <Table.Tr key={r.reembolsoId}><Table.Td><strong>{r.reembolsoId}</strong><small>{fecha(r.fecha)}</small></Table.Td><Table.Td>{r.pedidoId}</Table.Td><Table.Td>—</Table.Td><Table.Td><span className={`reembolsos-origin reembolsos-origin--${r.origen.toLowerCase()}`}>{etiquetaOrigen[r.origen]}</span></Table.Td><Table.Td>{monto(r.monto, r.moneda)}</Table.Td><Table.Td><EstadoBadge entidad="reembolso" estado={r.estado} size="sm" /></Table.Td><Table.Td><Button variant="default" size="xs" onClick={() => { setSeleccionado(r.reembolsoId); setResultadoActual(null); setModal(null); }}>Ver</Button></Table.Td></Table.Tr>)}</Table.Tbody></Table>}</EstadoCarga>
      {listado.datos && <div className="reembolsos-pagination"><Text>Mostrando {listado.datos.contenido.length} de {compacto(listado.datos.totalElementos)} {listado.datos.totalElementos === 1 ? 'resultado' : 'resultados'}</Text><Pagination value={pagina} onChange={setPagina} total={Math.max(1, listado.datos.totalPaginas)} size="sm" siblings={0} boundaries={1} /></div>}
    </section>
    {seleccionado && <EstadoCarga {...detalle} onReintentar={detalle.recargar}>{(r) => <DetalleReembolso reembolso={r} autorizadoVisualmente={autorizados.includes(r.reembolsoId)} onClose={() => { setSeleccionado(null); setResultadoActual(null); setModal(null); }} onOpenModal={setModal} />}</EstadoCarga>}
    {seleccionado && detalle.cargando && <Loader className="reembolsos-detail-loader" />}
    <Modal opened={modal === 'autorizar'} onClose={() => setModal(null)} withCloseButton={false} size={450} padding={23} classNames={{ content: 'reembolsos-modal' }} centered><Title order={2}>Autorizar reembolso</Title><Text>Confirma que el origen fue aprobado y que el monto corresponde al pago original.</Text><div className="reembolsos-modal-actions"><Button variant="default" onClick={() => setModal(null)}>Cancelar</Button><Button onClick={() => { if (seleccionado) setAutorizados((actuales) => [...new Set([...actuales, seleccionado])]); setModal('ejecutar'); }}>Confirmar autorización</Button></div></Modal>
    <Modal opened={modal === 'ejecutar'} onClose={() => setModal(null)} withCloseButton={false} size={470} padding={23} classNames={{ content: 'reembolsos-modal' }} centered><Title order={2}>Ejecutar reembolso</Title><Text>La operación se enviará al simulador conservando la misma clave idempotente del expediente.</Text><div className="reembolsos-modal-actions"><Button variant="default" onClick={() => setModal(null)} disabled={procesando}>Cancelar</Button><Button onClick={() => void ejecutar()} loading={procesando}>Ejecutar</Button></div></Modal>
    <Modal opened={modal === 'reintento'} onClose={() => setModal(null)} withCloseButton={false} size={470} padding={23} classNames={{ content: 'reembolsos-modal' }} centered><Title order={2}>Reintento seguro</Title><Text>Se continuará el mismo expediente y se conservará la clave idempotente; no se creará un segundo reembolso.</Text><div className="reembolsos-modal-actions"><Button variant="default" onClick={() => setModal(null)} disabled={procesando}>Cancelar</Button><Button onClick={() => void ejecutar()} loading={procesando}>Preparar reintento</Button></div></Modal>
    <Modal opened={modal === 'resultado'} onClose={() => setModal(null)} withCloseButton={false} size={500} padding={23} classNames={{ content: 'reembolsos-modal' }} centered><ResultadoReembolso reembolso={resultadoActual ?? detalle.datos} onClose={() => setModal(null)} /></Modal>
  </section>;
}
