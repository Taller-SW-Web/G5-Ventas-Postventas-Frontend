// Mockup 02 — Pedidos (F1). Responsable: Michael
// Bandeja del Gestor: filtros, tarjetas por estado, listado paginado y detalle rápido.
// Endpoint: GET /api/v1/pedidos (1.4). Las tarjetas usan totalElementos del mismo endpoint.
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Button,
  Card,
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
import { EstadoBadge } from '@/components/EstadoBadge';
import { EstadoCarga } from '@/components/EstadoCarga';
import { TablaPaginada, type ColumnaTabla } from '@/components/TablaPaginada';
import { useConsulta } from '@/hooks/useConsulta';
import { usePaginacion } from '@/hooks/usePaginacion';
import { contarPedidos, listarPedidos } from '@/services/pedidos';
import type { Canal } from '@/types/comun';
import type { EstadoPedido, FiltrosPedidos, OrdenPedidos, PedidoResumen } from '@/types/pedido';
import { DetalleRapido } from './DetalleRapido';
import { ETIQUETA_CANAL, ETIQUETA_ESTADO, formatoFecha, formatoMonto } from './formato';

/** Filtros que el usuario edita; solo se aplican con "Aplicar filtros". */
interface Borrador {
  buscar: string;
  estado: EstadoPedido | null;
  canal: Canal | null;
  rango: [string | null, string | null];
}

const BORRADOR_VACIO: Borrador = { buscar: '', estado: null, canal: null, rango: [null, null] };

const OPCIONES_ESTADO = (Object.keys(ETIQUETA_ESTADO) as EstadoPedido[]).map((e) => ({
  value: e,
  label: ETIQUETA_ESTADO[e],
}));

const OPCIONES_CANAL = (Object.keys(ETIQUETA_CANAL) as Canal[]).map((c) => ({
  value: c,
  label: ETIQUETA_CANAL[c],
}));

const OPCIONES_ORDEN: { value: OrdenPedidos; label: string }[] = [
  { value: 'RECIENTES', label: 'Más recientes' },
  { value: 'ANTIGUOS', label: 'Más antiguos' },
];

/** Tarjetas del mockup: "Pendientes" son los pedidos CREADO (esperando el pago). */
const TARJETAS: { etiqueta: string; estado: EstadoPedido | null }[] = [
  { etiqueta: 'Total pedidos', estado: null },
  { etiqueta: 'Pendientes', estado: 'CREADO' },
  { etiqueta: 'Pagados', estado: 'PAGADO' },
  { etiqueta: 'Despachados', estado: 'DESPACHADO' },
  { etiqueta: 'Entregados', estado: 'ENTREGADO' },
];

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
  const navegar = useNavigate();
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

  function aplicar(nuevo: Borrador) {
    setBorrador(nuevo);
    setAplicado(nuevo);
    reiniciar();
  }

  const columnas: ColumnaTabla<PedidoResumen>[] = [
    { clave: 'codigo', titulo: 'Código', render: (p) => <Text size="sm" fw={500}>{p.pedidoId}</Text> },
    { clave: 'fecha', titulo: 'Fecha', render: (p) => formatoFecha(p.fechaCreacion) },
    { clave: 'cliente', titulo: 'Cliente', render: (p) => p.nombreCliente ?? '—' },
    { clave: 'canal', titulo: 'Canal', render: (p) => ETIQUETA_CANAL[p.canal] },
    { clave: 'total', titulo: 'Total', render: (p) => formatoMonto(p.total) },
    { clave: 'estado', titulo: 'Estado', render: (p) => <EstadoBadge entidad="pedido" estado={p.estado} /> },
    {
      clave: 'accion',
      titulo: 'Acción',
      render: (p) => (
        <Button
          size="xs"
          variant="default"
          onClick={(e) => {
            e.stopPropagation();
            navegar(`/admin/pedidos/${p.pedidoId}`);
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

      <Paper withBorder radius="md" p="md">
        <Group align="flex-end" wrap="wrap">
          <TextInput
            label="Buscar"
            placeholder="Código, cliente o documento"
            value={borrador.buscar}
            onChange={(e) => setBorrador({ ...borrador, buscar: e.currentTarget.value })}
            onKeyDown={(e) => e.key === 'Enter' && aplicar(borrador)}
            style={{ flex: 2, minWidth: 220 }}
          />
          <Select
            label="Estado"
            placeholder="Todos"
            data={OPCIONES_ESTADO}
            value={borrador.estado}
            onChange={(v) => setBorrador({ ...borrador, estado: v as EstadoPedido | null })}
            clearable
            style={{ flex: 1, minWidth: 150 }}
          />
          <Select
            label="Canal"
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

      <SimpleGrid cols={{ base: 2, sm: 3, lg: 5 }}>
        {TARJETAS.map((t, i) => {
          const activa = (aplicado.estado ?? null) === t.estado;
          return (
            <UnstyledButton
              key={t.etiqueta}
              onClick={() => aplicar({ ...aplicado, estado: t.estado })}
              aria-pressed={activa}
            >
              <Card withBorder radius="md" p="md" style={activa ? { borderColor: 'var(--mantine-primary-color-filled)' } : undefined}>
                <Text size="sm" c="dimmed">
                  {t.etiqueta}
                </Text>
                <Text fw={700} fz={28}>
                  {conteos.cargando ? '…' : conteos.error ? '—' : (conteos.datos?.[i] ?? 0).toLocaleString('es-PE')}
                </Text>
              </Card>
            </UnstyledButton>
          );
        })}
      </SimpleGrid>

      <Paper withBorder radius="md" p="md">
        <Group justify="space-between" mb="md">
          <div>
            <Title order={3}>Listado de pedidos</Title>
            <Text size="sm" c="dimmed">
              Selecciona una fila para consultar el detalle rápido
            </Text>
          </div>
          <Select
            data={OPCIONES_ORDEN}
            value={orden}
            onChange={(v) => {
              setOrden((v as OrdenPedidos | null) ?? 'RECIENTES');
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
              onCambiarPagina={setPagina}
              onClickFila={setSeleccionado}
            />
          )}
        </EstadoCarga>
      </Paper>

      <DetalleRapido pedido={seleccionado} onCerrar={() => setSeleccionado(null)} />
    </Stack>
  );
}
