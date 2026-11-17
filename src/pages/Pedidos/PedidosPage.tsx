// Mockup 02 — Pedidos (F1). Responsable: Michael
// Bandeja del Gestor: filtros, tarjetas por estado, listado paginado y detalle rápido a la derecha del listado.
// Endpoint: GET /api/v1/pedidos (1.4). Las tarjetas usan totalElementos del mismo endpoint.
import { useState } from 'react';
import {
  Button,
  Card,
  Grid,
  Group,
  Paper,
  Select,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
  Title,
  UnstyledButton,
} from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import {
  IconCalendar,
  IconCircleX,
  IconClock,
  IconCreditCard,
  IconFileText,
  IconPackage,
  IconPackageExport,
  IconSearch,
  IconTruckDelivery,
  type Icon,
} from '@tabler/icons-react';
import { EstadoBadge } from '@/components/EstadoBadge';
import { IconoTarjeta } from '@/components/IconoTarjeta';
import { EstadoCarga } from '@/components/EstadoCarga';
import { TablaPaginada, type ColumnaTabla } from '@/components/TablaPaginada';
import { useConsulta } from '@/hooks/useConsulta';
import { usePaginacion } from '@/hooks/usePaginacion';
import { contarPedidos, listarPedidos } from '@/services/pedidos';
import type { Canal } from '@/types/comun';
import type { EstadoPedido, FiltrosPedidos, OrdenPedidos, PedidoResumen } from '@/types/pedido';
import { DetalleRapido } from './DetalleRapido';
import { ETIQUETA_CANAL, formatoFecha, formatoMonto } from './formato';

/** Filtros que el usuario edita; solo se aplican con "Aplicar filtros". */
interface Borrador {
  buscar: string;
  estado: EstadoPedido | null;
  canal: Canal | null;
  rango: [string | null, string | null];
}

const BORRADOR_VACIO: Borrador = { buscar: '', estado: null, canal: null, rango: [null, null] };

/** El filtro muestra los códigos de estado del contrato, como el Mockup 02 (5.2). */
const OPCIONES_ESTADO: EstadoPedido[] = ['CREADO', 'PAGADO', 'EN_PREPARACION', 'DESPACHADO', 'ENTREGADO', 'ANULADO'];

const OPCIONES_CANAL = (Object.keys(ETIQUETA_CANAL) as Canal[]).map((c) => ({
  value: c,
  label: ETIQUETA_CANAL[c],
}));

const OPCIONES_ORDEN: { value: OrdenPedidos; label: string }[] = [
  { value: 'RECIENTES', label: 'Más recientes' },
  { value: 'ANTIGUOS', label: 'Más antiguos' },
];

/**
 * Tarjetas de resumen por estado oficial del pedido (F1, Mockup 02 sección 6). Las capturas antiguas muestran cinco
 * tarjetas con una agrupación "Pendientes"; la ficha y el contrato usan los seis estados reales más el total.
 */
const TARJETAS: { etiqueta: string; estado: EstadoPedido | null; icono: Icon; color: string }[] = [
  { etiqueta: 'Total pedidos', estado: null, icono: IconFileText, color: 'orange' },
  { etiqueta: 'Creados', estado: 'CREADO', icono: IconClock, color: 'yellow' },
  { etiqueta: 'Pagados', estado: 'PAGADO', icono: IconCreditCard, color: 'signal' },
  { etiqueta: 'En preparación', estado: 'EN_PREPARACION', icono: IconPackage, color: 'yellow' },
  { etiqueta: 'Despachados', estado: 'DESPACHADO', icono: IconTruckDelivery, color: 'ink' },
  { etiqueta: 'Entregados', estado: 'ENTREGADO', icono: IconPackageExport, color: 'volt' },
  { etiqueta: 'Anulados', estado: 'ANULADO', icono: IconCircleX, color: 'red' },
];

/** "Mostrando 1–10 de 23 pedidos" (intervalo de la página, Mockup 02 7.3). */
export function resumenPagina(pagina: number, tamano: number, enPagina: number, total: number): string {
  if (enPagina === 0) return `0 de ${total.toLocaleString('es-PE')} pedidos`;
  const desde = pagina * tamano + 1;
  return `Mostrando ${desde}–${desde + enPagina - 1} de ${total.toLocaleString('es-PE')} pedidos`;
}

function aFiltros(b: Borrador): Omit<FiltrosPedidos, 'pagina' | 'tamano' | 'orden'> {
  return {
    buscar: b.buscar.trim() || undefined,
    estado: b.estado ?? undefined,
    canal: b.canal ?? undefined,
    desde: b.rango[0] ?? undefined,
    hasta: b.rango[1] ?? b.rango[0] ?? undefined,
  };
}

export function PedidosPage() {
  const { pagina, tamano, setPagina, reiniciar } = usePaginacion(10);
  const [borrador, setBorrador] = useState<Borrador>(BORRADOR_VACIO);
  const [aplicado, setAplicado] = useState<Borrador>(BORRADOR_VACIO);
  const [orden, setOrden] = useState<OrdenPedidos>('RECIENTES');
  const [seleccionado, setSeleccionado] = useState<PedidoResumen | null>(null);

  const filtros = aFiltros(aplicado);
  const claveFiltros = JSON.stringify(filtros);

  const listado = useConsulta(
    () => listarPedidos({ ...filtros, orden, pagina, tamano }),
    [claveFiltros, orden, pagina, tamano],
  );

  // Las tarjetas cuentan con los mismos filtros, salvo el estado (cada tarjeta es un estado).
  const conteos = useConsulta(
    () => Promise.all(TARJETAS.map((t) => contarPedidos({ ...filtros, estado: t.estado ?? undefined }))),
    [claveFiltros],
  );

  // Aplicar filtros, cambiar el orden o la página ocultan el detalle rápido (Mockup 02, 5.5 y 7.3)
  function aplicar(nuevo: Borrador) {
    setBorrador(nuevo);
    setAplicado(nuevo);
    setSeleccionado(null);
    reiniciar();
  }

  function cambiarPagina(nueva: number) {
    setSeleccionado(null);
    setPagina(nueva);
  }

  const columnas: ColumnaTabla<PedidoResumen>[] = [
    {
      clave: 'codigo',
      titulo: 'Código',
      render: (p) => (
        <Text size="sm" fw={500} style={{ whiteSpace: 'nowrap' }}>
          {p.pedidoId}
        </Text>
      ),
    },
    {
      clave: 'fecha',
      titulo: 'Fecha',
      render: (p) => <span style={{ whiteSpace: 'nowrap' }}>{formatoFecha(p.fechaCreacion)}</span>,
    },
    {
      clave: 'cliente',
      titulo: 'Cliente',
      // 1.4 no trae la referencia de la columna "Cliente / Ref." del mockup: solo el nombre
      render: (p) => (
        <Text size="sm" miw={120}>
          {p.nombreCliente ?? '—'}
        </Text>
      ),
    },
    { clave: 'canal', titulo: 'Canal', render: (p) => ETIQUETA_CANAL[p.canal] },
    { clave: 'total', titulo: 'Total', render: (p) => formatoMonto(p.total) },
    { clave: 'estado', titulo: 'Estado', render: (p) => <EstadoBadge entidad="pedido" estado={p.estado} /> },
    {
      clave: 'accion',
      titulo: 'Acción',
      // Igual que la fila: abre el detalle rápido (7.4); el detalle completo se abre desde el panel
      render: (p) => (
        <Button
          size="xs"
          variant={seleccionado?.pedidoId === p.pedidoId ? 'filled' : 'light'}
          color={seleccionado?.pedidoId === p.pedidoId ? undefined : 'gray'}
          c={seleccionado?.pedidoId === p.pedidoId ? undefined : 'ink.9'}
          onClick={(e) => {
            e.stopPropagation();
            setSeleccionado(p);
          }}
        >
          Ver detalle
        </Button>
      ),
    },
  ];

  return (
    <Stack gap="lg">
      <Title order={1}>Pedidos</Title>

      <Paper withBorder radius="md" p="md" shadow="xs">
        <Group align="flex-end" wrap="wrap">
          <TextInput
            label="Buscar"
            variant="filled"
            leftSection={<IconSearch size={20} aria-hidden />}
            placeholder="Código, cliente o documento"
            value={borrador.buscar}
            onChange={(e) => setBorrador({ ...borrador, buscar: e.currentTarget.value })}
            onKeyDown={(e) => e.key === 'Enter' && aplicar(borrador)}
            style={{ flex: 2, minWidth: 220 }}
          />
          <Select
            label="Estado"
            variant="filled"
            placeholder="Todos"
            data={OPCIONES_ESTADO}
            value={borrador.estado}
            onChange={(v) => setBorrador({ ...borrador, estado: v as EstadoPedido | null })}
            clearable
            style={{ flex: 1, minWidth: 150 }}
          />
          <Select
            label="Canal"
            variant="filled"
            placeholder="Todos"
            data={OPCIONES_CANAL}
            value={borrador.canal}
            onChange={(v) => setBorrador({ ...borrador, canal: v as Canal | null })}
            clearable
            style={{ flex: 1, minWidth: 150 }}
          />
          <DatePickerInput
            type="range"
            label="Fecha"
            variant="filled"
            leftSection={<IconCalendar size={20} aria-hidden />}
            placeholder="Todas"
            valueFormat="DD/MM/YYYY"
            value={borrador.rango}
            onChange={(v) => setBorrador({ ...borrador, rango: [v[0] ?? null, v[1] ?? null] })}
            clearable
            style={{ flex: 1.5, minWidth: 220 }}
          />
          <Button onClick={() => aplicar(borrador)}>Aplicar filtros</Button>
          <Button variant="default" onClick={() => aplicar(BORRADOR_VACIO)}>
            Limpiar
          </Button>
        </Group>
      </Paper>

      <SimpleGrid cols={{ base: 2, sm: 3, md: 4, lg: 7 }}>
        {TARJETAS.map((t, i) => {
          const activa = (aplicado.estado ?? null) === t.estado;
          return (
            <UnstyledButton
              key={t.etiqueta}
              onClick={() => aplicar({ ...aplicado, estado: t.estado })}
              aria-pressed={activa}
            >
              <Card
                withBorder
                radius="md"
                p="sm"
                shadow="xs"
                h="100%"
                style={activa ? { borderColor: 'var(--mantine-primary-color-filled)' } : undefined}
              >
                <Group gap="xs" wrap="nowrap" align="flex-start">
                  <IconoTarjeta icono={t.icono} color={t.color} tamano={32} />
                  <div style={{ minWidth: 0 }}>
                    <Text size="xs" c="dimmed" fw={500} lh={1.3}>
                      {t.etiqueta}
                    </Text>
                    <Text fw={700} fz={24} lh={1.2}>
                      {conteos.cargando ? '…' : conteos.error ? '—' : (conteos.datos?.[i] ?? 0).toLocaleString('es-PE')}
                    </Text>
                  </div>
                </Group>
              </Card>
            </UnstyledButton>
          );
        })}
      </SimpleGrid>

      <Grid gap="lg">
        {/* El listado ocupa 9 columnas aunque no haya selección: la derecha queda para el detalle rápido (Mockup 02) */}
        <Grid.Col span={{ base: 12, lg: 9 }}>
          <Paper withBorder radius="md" p="md" shadow="xs">
            <Group justify="space-between" mb="md" wrap="wrap">
              <div>
                <Title order={3} size="h4">
                  Listado de pedidos
                </Title>
                <Text size="sm" c="dimmed">
                  Selecciona una fila para consultar el detalle rápido
                </Text>
              </div>
              <Select
                aria-label="Orden"
                variant="filled"
                data={OPCIONES_ORDEN}
                value={orden}
                onChange={(v) => {
                  setOrden((v as OrdenPedidos | null) ?? 'RECIENTES');
                  setSeleccionado(null);
                  reiniciar();
                }}
                allowDeselect={false}
                w={180}
              />
            </Group>

            <EstadoCarga
              cargando={listado.cargando}
              error={listado.error}
              datos={listado.datos}
              mensajeVacio="No hay pedidos con estos filtros."
              onReintentar={listado.recargar}
            >
              {(datos) => (
                <TablaPaginada
                  columnas={columnas}
                  filas={datos.contenido}
                  obtenerClave={(p) => p.pedidoId}
                  pagina={datos.pagina}
                  totalPaginas={datos.totalPaginas}
                  totalElementos={datos.totalElementos}
                  resumen={resumenPagina(datos.pagina, tamano, datos.contenido.length, datos.totalElementos)}
                  onCambiarPagina={cambiarPagina}
                  onClickFila={setSeleccionado}
                  claveSeleccionada={seleccionado?.pedidoId ?? null}
                />
              )}
            </EstadoCarga>
          </Paper>
        </Grid.Col>

        {seleccionado && (
          <Grid.Col span={{ base: 12, lg: 3 }}>
            <DetalleRapido pedido={seleccionado} onCerrar={() => setSeleccionado(null)} />
          </Grid.Col>
        )}
      </Grid>
    </Stack>
  );
}
