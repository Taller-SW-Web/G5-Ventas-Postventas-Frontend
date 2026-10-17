// Mockup 08 — Reembolsos (F4). Responsable: Luis Alejandro
// Esta primera versión es visual: usa datos locales hasta que se acuerde la consulta de expedientes.
import { useMemo, useState } from 'react';
import { Button, Modal, Pagination, Select, Table, Text, TextInput, Title } from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { EstadoBadge } from '@/components/EstadoBadge';
import type { EstadoReembolso, OrigenReembolso } from '@/types/reembolso';
import backIcon from '@/assets/reembolsos/back.svg';
import calendarIcon from '@/assets/reembolsos/calendar.svg';
import chevronIcon from '@/assets/reembolsos/chevron.svg';
import searchIcon from '@/assets/reembolsos/search.svg';
import { DetalleReembolso, ResultadoReembolso } from './DetalleReembolso';
import './ReembolsosPage.css';

export interface ReembolsoVisual {
  codigo: string;
  fecha: string;
  pedido: string;
  cliente: string;
  origen: OrigenReembolso;
  monto: number;
  estado: EstadoReembolso;
}

const REEMBOLSOS: ReembolsoVisual[] = [
  { codigo: 'REB-2026-0094', fecha: '10/10/2026', pedido: 'PED-2026-1053', cliente: 'Ana López', origen: 'ANULACION', monto: 214, estado: 'PENDIENTE' },
  { codigo: 'REB-2026-0093', fecha: '10/10/2026', pedido: 'PED-2026-1052', cliente: 'Luis Arroyo', origen: 'DEVOLUCION', monto: 189.9, estado: 'PENDIENTE' },
  { codigo: 'REB-2026-0092', fecha: '09/10/2026', pedido: 'PED-2026-1051', cliente: 'María Torres', origen: 'ANULACION', monto: 104.5, estado: 'PENDIENTE' },
  { codigo: 'REB-2026-0091', fecha: '08/10/2026', pedido: 'PED-2026-1050', cliente: 'Lucía Fernández', origen: 'DEVOLUCION', monto: 72.8, estado: 'FALLIDO' },
  { codigo: 'REB-2026-0090', fecha: '07/10/2026', pedido: 'PED-2026-1049', cliente: 'Carlos Ruiz', origen: 'ANULACION', monto: 356.4, estado: 'EXITOSO' },
  { codigo: 'REB-2026-0089', fecha: '06/10/2026', pedido: 'PED-2026-1048', cliente: 'Sofía Mendoza', origen: 'DEVOLUCION', monto: 48.5, estado: 'PENDIENTE' },
  { codigo: 'REB-2026-0088', fecha: '05/10/2026', pedido: 'PED-2026-1047', cliente: 'Diego Salazar', origen: 'ANULACION', monto: 152.75, estado: 'EXITOSO' },
  { codigo: 'REB-2026-0087', fecha: '04/10/2026', pedido: 'PED-2026-1046', cliente: 'Valeria Campos', origen: 'DEVOLUCION', monto: 89.9, estado: 'FALLIDO' },
  { codigo: 'REB-2026-0086', fecha: '03/10/2026', pedido: 'PED-2026-1045', cliente: 'Jorge Paredes', origen: 'ANULACION', monto: 421, estado: 'PENDIENTE' },
  { codigo: 'REB-2026-0085', fecha: '02/10/2026', pedido: 'PED-2026-1044', cliente: 'Camila Rojas', origen: 'DEVOLUCION', monto: 66.2, estado: 'EXITOSO' },
  { codigo: 'REB-2026-0084', fecha: '01/10/2026', pedido: 'PED-2026-1043', cliente: 'Mateo Herrera', origen: 'ANULACION', monto: 238.6, estado: 'PENDIENTE' },
  { codigo: 'REB-2026-0083', fecha: '30/09/2026', pedido: 'PED-2026-1042', cliente: 'Elena Castro', origen: 'DEVOLUCION', monto: 95, estado: 'FALLIDO' },
  { codigo: 'REB-2026-0082', fecha: '29/09/2026', pedido: 'PED-2026-1041', cliente: 'Andrés Vega', origen: 'ANULACION', monto: 310.25, estado: 'EXITOSO' },
  { codigo: 'REB-2026-0081', fecha: '28/09/2026', pedido: 'PED-2026-1040', cliente: 'Paola Navarro', origen: 'DEVOLUCION', monto: 117.4, estado: 'PENDIENTE' },
  { codigo: 'REB-2026-0080', fecha: '27/09/2026', pedido: 'PED-2026-1039', cliente: 'Renzo Flores', origen: 'ANULACION', monto: 54.3, estado: 'EXITOSO' },
  { codigo: 'REB-2026-0079', fecha: '26/09/2026', pedido: 'PED-2026-1038', cliente: 'Mariana Silva', origen: 'DEVOLUCION', monto: 176.8, estado: 'FALLIDO' },
];

const RESULTADOS_POR_PAGINA = 8;
const etiquetaOrigen: Record<OrigenReembolso, string> = { ANULACION: 'Anulación', DEVOLUCION: 'Devolución' };
const etiquetaMonto = (monto: number) => `S/ ${monto.toFixed(2)}`;
const fechaComoNumero = (fecha: string) => {
  const [dia, mes, anio] = fecha.split('/').map(Number);
  return new Date(anio, mes - 1, dia).getTime();
};
const fechaComoIso = (fecha: string) => {
  const [dia, mes, anio] = fecha.split('/');
  return `${anio}-${mes}-${dia}`;
};
const cantidadCompacta = (cantidad: number) => {
  if (cantidad < 1_000) return String(cantidad);
  const [divisor, sufijo] = cantidad >= 1_000_000 ? [1_000_000, 'M'] : [1_000, 'K'];
  const valor = cantidad / divisor;
  return `${new Intl.NumberFormat('en-US', { maximumFractionDigits: valor < 10 ? 1 : 0 }).format(valor)}${sufijo}`;
};

export function ReembolsosPage() {
  const [busqueda, setBusqueda] = useState('');
  const [estadoFiltro, setEstadoFiltro] = useState<string | null>('TODOS');
  const [origenFiltro, setOrigenFiltro] = useState<string | null>('TODOS');
  const [fechaFiltro, setFechaFiltro] = useState<string | null>(null);
  const [busquedaAplicada, setBusquedaAplicada] = useState('');
  const [estadoAplicado, setEstadoAplicado] = useState<string | null>('TODOS');
  const [origenAplicado, setOrigenAplicado] = useState<string | null>('TODOS');
  const [fechaAplicada, setFechaAplicada] = useState<string | null>(null);
  const [pagina, setPagina] = useState(1);
  const [ordenamiento, setOrdenamiento] = useState<'recientes' | 'antiguos'>('recientes');
  const [seleccionado, setSeleccionado] = useState<ReembolsoVisual | null>(null);
  const [modal, setModal] = useState<'autorizar' | 'ejecutar' | 'reintento' | 'resultado' | null>(null);

  const filas = useMemo(() => REEMBOLSOS
    .filter((reembolso) => {
      const coincideBusqueda = `${reembolso.codigo} ${reembolso.pedido} ${reembolso.cliente}`.toLocaleLowerCase().includes(busquedaAplicada.toLocaleLowerCase());
      return coincideBusqueda
        && (estadoAplicado === 'TODOS' || reembolso.estado === estadoAplicado)
        && (origenAplicado === 'TODOS' || reembolso.origen === origenAplicado)
        && (!fechaAplicada || fechaComoIso(reembolso.fecha) === fechaAplicada);
    })
    .sort((primero, segundo) => {
      const diferencia = fechaComoNumero(primero.fecha) - fechaComoNumero(segundo.fecha);
      return ordenamiento === 'recientes' ? -diferencia : diferencia;
    }), [busquedaAplicada, estadoAplicado, origenAplicado, fechaAplicada, ordenamiento]);
  const totalPaginas = Math.max(1, Math.ceil(filas.length / RESULTADOS_POR_PAGINA));
  const filasPagina = filas.slice((pagina - 1) * RESULTADOS_POR_PAGINA, pagina * RESULTADOS_POR_PAGINA);
  const etiquetaResultados = `${filasPagina.length} de ${cantidadCompacta(filas.length)} ${filas.length === 1 ? 'resultado' : 'resultados'}`;

  const aplicarFiltros = () => { setBusquedaAplicada(busqueda); setEstadoAplicado(estadoFiltro); setOrigenAplicado(origenFiltro); setFechaAplicada(fechaFiltro); setPagina(1); };
  const limpiarFiltros = () => { setBusqueda(''); setEstadoFiltro('TODOS'); setOrigenFiltro('TODOS'); setFechaFiltro(null); setBusquedaAplicada(''); setEstadoAplicado('TODOS'); setOrigenAplicado('TODOS'); setFechaAplicada(null); setPagina(1); };
  const abrirDetalle = (reembolso: ReembolsoVisual) => { setSeleccionado(reembolso); setModal(null); };

  return (
    <section className="reembolsos-page">
      <div className="reembolsos-heading"><button className="reembolsos-back" type="button" aria-label="Volver"><img src={backIcon} alt="" /></button><Title order={1}>Reembolsos</Title></div>
      <section className="reembolsos-filters" aria-label="Filtros de reembolsos">
        <label className="reembolsos-field reembolsos-search"><span>Buscar</span><TextInput value={busqueda} onChange={(event) => setBusqueda(event.currentTarget.value)} leftSection={<img src={searchIcon} alt="" className="reembolsos-input-icon" />} aria-label="Buscar por código, pedido o cliente" /></label>
        <label className="reembolsos-field"><span>Estado</span><Select value={estadoFiltro} onChange={setEstadoFiltro} data={[{ value: 'TODOS', label: 'Todos' }, { value: 'PENDIENTE', label: 'Pendiente' }, { value: 'EXITOSO', label: 'Exitoso' }, { value: 'FALLIDO', label: 'Fallido' }]} rightSection={<img src={chevronIcon} alt="" className="reembolsos-input-icon" />} rightSectionPointerEvents="none" allowDeselect={false} /></label>
        <label className="reembolsos-field"><span>Origen</span><Select value={origenFiltro} onChange={setOrigenFiltro} data={[{ value: 'TODOS', label: 'Todos' }, { value: 'ANULACION', label: 'Anulación' }, { value: 'DEVOLUCION', label: 'Devolución' }]} rightSection={<img src={chevronIcon} alt="" className="reembolsos-input-icon" />} rightSectionPointerEvents="none" allowDeselect={false} /></label>
        <label className="reembolsos-field reembolsos-date"><span>Fecha de creación</span><DateInput value={fechaFiltro} onChange={setFechaFiltro} valueFormat="DD/MM/YYYY" placeholder="Todos" leftSection={<img src={calendarIcon} alt="" className="reembolsos-input-icon" />} aria-label="Filtrar por fecha de creación" /></label>
        <div className="reembolsos-filter-actions"><Button onClick={aplicarFiltros}>Aplicar filtros</Button><Button variant="default" onClick={limpiarFiltros}>Limpiar</Button></div>
      </section>
      <section className={seleccionado ? 'reembolsos-card reembolsos-card--selected' : 'reembolsos-card'} aria-label="Listado de reembolsos">
        <div className="reembolsos-card-heading"><div><Title order={2}>Reembolsos</Title><Text>Operaciones registradas</Text></div><Select value={ordenamiento} onChange={(valor) => setOrdenamiento(valor === 'antiguos' ? 'antiguos' : 'recientes')} data={[{ value: 'recientes', label: 'Más recientes' }, { value: 'antiguos', label: 'Más antiguos' }]} rightSection={<img src={chevronIcon} alt="" className="reembolsos-input-icon" />} rightSectionPointerEvents="none" allowDeselect={false} /></div>
        {filas.length === 0 ? <Text className="reembolsos-empty">No hay reembolsos que coincidan con los filtros.</Text> : <Table className="reembolsos-table" horizontalSpacing={8} verticalSpacing={0}><Table.Thead><Table.Tr><Table.Th>Código / fecha</Table.Th><Table.Th>Pedido</Table.Th><Table.Th>Cliente</Table.Th><Table.Th>Origen</Table.Th><Table.Th>Monto</Table.Th><Table.Th>Estado</Table.Th><Table.Th>Acción</Table.Th></Table.Tr></Table.Thead><Table.Tbody>{filasPagina.map((reembolso) => <Table.Tr key={reembolso.codigo}><Table.Td><strong>{reembolso.codigo}</strong><small>{reembolso.fecha}</small></Table.Td><Table.Td>{reembolso.pedido}</Table.Td><Table.Td>{reembolso.cliente}</Table.Td><Table.Td><span className={`reembolsos-origin reembolsos-origin--${reembolso.origen.toLowerCase()}`}>{etiquetaOrigen[reembolso.origen]}</span></Table.Td><Table.Td>{etiquetaMonto(reembolso.monto)}</Table.Td><Table.Td><EstadoBadge entidad="reembolso" estado={reembolso.estado} size="sm" /></Table.Td><Table.Td><Button variant="default" size="xs" onClick={() => abrirDetalle(reembolso)}>Ver</Button></Table.Td></Table.Tr>)}</Table.Tbody></Table>}
        <div className="reembolsos-pagination"><Text>Mostrando {etiquetaResultados}</Text><Pagination value={pagina} onChange={setPagina} total={totalPaginas} size="sm" siblings={0} boundaries={1} /></div>
      </section>
      {seleccionado && <DetalleReembolso reembolso={seleccionado} onClose={() => setSeleccionado(null)} onOpenModal={setModal} />}
      <Modal opened={modal === 'autorizar'} onClose={() => setModal(null)} withCloseButton={false} size={450} padding={23} classNames={{ content: 'reembolsos-modal' }} centered><Title order={2}>Autorizar reembolso</Title><Text>Confirma que el origen fue aprobado y que el monto corresponde al pago original.</Text><div className="reembolsos-modal-actions"><Button variant="default" onClick={() => setModal(null)}>Cancelar</Button><Button onClick={() => setModal('ejecutar')}>Confirmar autorización</Button></div></Modal>
      <Modal opened={modal === 'ejecutar'} onClose={() => setModal(null)} withCloseButton={false} size={470} padding={23} classNames={{ content: 'reembolsos-modal' }} centered><Title order={2}>Ejecutar reembolso</Title><Text>La operación se enviará al simulador conservando la misma clave idempotente del expediente.</Text><div className="reembolsos-modal-actions"><Button variant="default" onClick={() => setModal(null)}>Cancelar</Button><Button onClick={() => setModal('resultado')}>Ejecutar</Button></div></Modal>
      <Modal opened={modal === 'reintento'} onClose={() => setModal(null)} withCloseButton={false} size={470} padding={23} classNames={{ content: 'reembolsos-modal' }} centered><Title order={2}>Reintento seguro</Title><Text>Se continuará el mismo expediente y se conservará la clave idempotente; no se creará un segundo reembolso.</Text><div className="reembolsos-modal-actions"><Button variant="default" onClick={() => setModal(null)}>Cancelar</Button><Button onClick={() => setModal('ejecutar')}>Preparar reintento</Button></div></Modal>
      <Modal opened={modal === 'resultado'} onClose={() => setModal(null)} withCloseButton={false} size={500} padding={23} classNames={{ content: 'reembolsos-modal' }} centered><ResultadoReembolso reembolso={seleccionado} onClose={() => setModal(null)} /></Modal>
    </section>
  );
}
