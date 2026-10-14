// Mockup 08 — Reembolsos (F4). Responsable: Luis Alejandro
// Esta primera versión es visual: usa datos locales hasta que se acuerde la consulta de expedientes.
import { useMemo, useState } from 'react';
import { Button, Modal, Pagination, Select, Table, Text, TextInput, Title } from '@mantine/core';
import { EstadoBadge } from '@/components/EstadoBadge';
import type { EstadoReembolso, OrigenReembolso } from '@/types/reembolso';
import calendarIcon from '@/assets/reembolsos/calendar.svg';
import chevronIcon from '@/assets/reembolsos/chevron.svg';
import searchIcon from '@/assets/reembolsos/search.svg';
import './ReembolsosPage.css';

interface ReembolsoVisual {
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
];

const etiquetaOrigen: Record<OrigenReembolso, string> = { ANULACION: 'Anulación', DEVOLUCION: 'Devolución' };
const etiquetaMonto = (monto: number) => `S/ ${monto.toFixed(2)}`;

export function ReembolsosPage() {
  const [busqueda, setBusqueda] = useState('');
  const [estadoFiltro, setEstadoFiltro] = useState<string | null>('TODOS');
  const [origenFiltro, setOrigenFiltro] = useState<string | null>('TODOS');
  const [busquedaAplicada, setBusquedaAplicada] = useState('');
  const [estadoAplicado, setEstadoAplicado] = useState<string | null>('TODOS');
  const [origenAplicado, setOrigenAplicado] = useState<string | null>('TODOS');
  const [pagina, setPagina] = useState(1);
  const [seleccionado, setSeleccionado] = useState<ReembolsoVisual | null>(null);
  const [modal, setModal] = useState<'autorizar' | 'ejecutar' | 'reintento' | 'resultado' | null>(null);

  const filas = useMemo(() => REEMBOLSOS.filter((reembolso) => {
    const coincideBusqueda = `${reembolso.codigo} ${reembolso.pedido} ${reembolso.cliente}`.toLocaleLowerCase().includes(busquedaAplicada.toLocaleLowerCase());
    return coincideBusqueda && (estadoAplicado === 'TODOS' || reembolso.estado === estadoAplicado) && (origenAplicado === 'TODOS' || reembolso.origen === origenAplicado);
  }), [busquedaAplicada, estadoAplicado, origenAplicado]);

  const aplicarFiltros = () => { setBusquedaAplicada(busqueda); setEstadoAplicado(estadoFiltro); setOrigenAplicado(origenFiltro); setPagina(1); };
  const limpiarFiltros = () => { setBusqueda(''); setEstadoFiltro('TODOS'); setOrigenFiltro('TODOS'); setBusquedaAplicada(''); setEstadoAplicado('TODOS'); setOrigenAplicado('TODOS'); setPagina(1); };
  const abrirAccion = (reembolso: ReembolsoVisual) => { setSeleccionado(reembolso); setModal(reembolso.estado === 'FALLIDO' ? 'reintento' : 'autorizar'); };

  return (
    <section className="reembolsos-page">
      <div className="reembolsos-heading"><button className="reembolsos-back" type="button" aria-label="Volver">←</button><Title order={1}>Reembolsos</Title></div>
      <section className="reembolsos-filters" aria-label="Filtros de reembolsos">
        <label className="reembolsos-field reembolsos-search"><span>Buscar</span><TextInput value={busqueda} onChange={(event) => setBusqueda(event.currentTarget.value)} leftSection={<img src={searchIcon} alt="" className="reembolsos-input-icon" />} aria-label="Buscar por código, pedido o cliente" /></label>
        <label className="reembolsos-field"><span>Estado</span><Select value={estadoFiltro} onChange={setEstadoFiltro} data={[{ value: 'TODOS', label: 'Todos' }, { value: 'PENDIENTE', label: 'Pendiente' }, { value: 'EXITOSO', label: 'Exitoso' }, { value: 'FALLIDO', label: 'Fallido' }]} rightSection={<img src={chevronIcon} alt="" className="reembolsos-input-icon" />} rightSectionPointerEvents="none" allowDeselect={false} /></label>
        <label className="reembolsos-field"><span>Origen</span><Select value={origenFiltro} onChange={setOrigenFiltro} data={[{ value: 'TODOS', label: 'Todos' }, { value: 'ANULACION', label: 'Anulación' }, { value: 'DEVOLUCION', label: 'Devolución' }]} rightSection={<img src={chevronIcon} alt="" className="reembolsos-input-icon" />} rightSectionPointerEvents="none" allowDeselect={false} /></label>
        <label className="reembolsos-field reembolsos-date"><span>Fecha de creación</span><button type="button" className="reembolsos-date-control"><img src={calendarIcon} alt="" className="reembolsos-input-icon" /><span>Todos</span><img src={chevronIcon} alt="" className="reembolsos-input-icon" /></button></label>
        <div className="reembolsos-filter-actions"><Button onClick={aplicarFiltros}>Aplicar filtros</Button><Button variant="default" onClick={limpiarFiltros}>Limpiar</Button></div>
      </section>
      <section className="reembolsos-card" aria-label="Listado de reembolsos">
        <div className="reembolsos-card-heading"><div><Title order={2}>Reembolsos</Title><Text>Operaciones registradas</Text></div><Select defaultValue="recientes" data={[{ value: 'recientes', label: 'Más recientes' }]} rightSection={<img src={chevronIcon} alt="" className="reembolsos-input-icon" />} rightSectionPointerEvents="none" allowDeselect={false} /></div>
        {filas.length === 0 ? <Text className="reembolsos-empty">No hay reembolsos que coincidan con los filtros.</Text> : <Table className="reembolsos-table" horizontalSpacing={8} verticalSpacing={0}><Table.Thead><Table.Tr><Table.Th>Código / fecha</Table.Th><Table.Th>Pedido</Table.Th><Table.Th>Cliente</Table.Th><Table.Th>Origen</Table.Th><Table.Th>Monto</Table.Th><Table.Th>Estado</Table.Th><Table.Th>Acción</Table.Th></Table.Tr></Table.Thead><Table.Tbody>{filas.map((reembolso) => <Table.Tr key={reembolso.codigo}><Table.Td><strong>{reembolso.codigo}</strong><small>{reembolso.fecha}</small></Table.Td><Table.Td>{reembolso.pedido}</Table.Td><Table.Td>{reembolso.cliente}</Table.Td><Table.Td><span className={`reembolsos-origin reembolsos-origin--${reembolso.origen.toLowerCase()}`}>{etiquetaOrigen[reembolso.origen]}</span></Table.Td><Table.Td>{etiquetaMonto(reembolso.monto)}</Table.Td><Table.Td><EstadoBadge entidad="reembolso" estado={reembolso.estado} size="sm" /></Table.Td><Table.Td><Button variant="default" size="xs" onClick={() => abrirAccion(reembolso)}>Ver</Button></Table.Td></Table.Tr>)}</Table.Tbody></Table>}
        <div className="reembolsos-pagination"><Text>Mostrando {filas.length} resultados</Text><Pagination value={pagina} onChange={setPagina} total={3} size="sm" siblings={0} boundaries={1} /></div>
      </section>
      <Modal opened={modal === 'autorizar'} onClose={() => setModal(null)} withCloseButton={false} size={450} padding={23} classNames={{ content: 'reembolsos-modal' }} centered><Title order={2}>Autorizar reembolso</Title><Text>Confirma que el origen fue aprobado y que el monto corresponde al pago original.</Text><div className="reembolsos-modal-actions"><Button variant="default" onClick={() => setModal(null)}>Cancelar</Button><Button onClick={() => setModal('ejecutar')}>Confirmar autorización</Button></div></Modal>
      <Modal opened={modal === 'ejecutar'} onClose={() => setModal(null)} withCloseButton={false} size={470} padding={23} classNames={{ content: 'reembolsos-modal' }} centered><Title order={2}>Ejecutar reembolso</Title><Text>La operación se enviará al simulador conservando la misma clave idempotente del expediente.</Text><div className="reembolsos-modal-actions"><Button variant="default" onClick={() => setModal(null)}>Cancelar</Button><Button onClick={() => setModal('resultado')}>Ejecutar</Button></div></Modal>
      <Modal opened={modal === 'reintento'} onClose={() => setModal(null)} withCloseButton={false} size={470} padding={23} classNames={{ content: 'reembolsos-modal' }} centered><Title order={2}>Reintento seguro</Title><Text>Se continuará el mismo expediente y se conservará la clave idempotente; no se creará un segundo reembolso.</Text><div className="reembolsos-modal-actions"><Button variant="default" onClick={() => setModal(null)}>Cancelar</Button><Button onClick={() => setModal('ejecutar')}>Preparar reintento</Button></div></Modal>
      <Modal opened={modal === 'resultado'} onClose={() => setModal(null)} withCloseButton={false} size={500} padding={23} classNames={{ content: 'reembolsos-modal' }} centered><Title order={2}>Resultado del reembolso</Title>{seleccionado && <dl className="reembolsos-result"><dt>Código</dt><dd>{seleccionado.codigo}</dd><dt>Pedido</dt><dd>{seleccionado.pedido}</dd><dt>Origen</dt><dd>{etiquetaOrigen[seleccionado.origen]}</dd><dt>Monto</dt><dd>{etiquetaMonto(seleccionado.monto)}</dd><dt>Id operación</dt><dd>—</dd><dt>Estado</dt><dd>{seleccionado.estado}</dd><dt>Resultado</dt><dd>Pendiente de autorización</dd></dl>}<div className="reembolsos-result-close"><Button color="dark" onClick={() => setModal(null)}>Cerrar</Button></div></Modal>
    </section>
  );
}
