// Render de pantallas en pruebas (entorno jsdom): mismos proveedores que main.tsx, con un router en memoria.
// Los servicios HTTP se simulan en cada prueba con vi.mock; aquí no se llama a ningún backend.
import type { ReactElement } from 'react';
import { render } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { theme } from '@/theme';

// jsdom no trae estas APIs del navegador que Mantine usa
if (typeof window !== 'undefined') {
  window.matchMedia ??= ((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => undefined,
    removeListener: () => undefined,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    dispatchEvent: () => false,
  })) as typeof window.matchMedia;
  window.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
  window.HTMLElement.prototype.scrollIntoView ??= () => undefined;
}

/** Muestra la ruta actual, para comprobar a dónde navega un botón. */
function RutaActual() {
  const { pathname, search } = useLocation();
  return <output data-testid="ruta-actual">{pathname + search}</output>;
}

export function renderizar(pantalla: ReactElement, { ruta = '/', patron = '*' }: { ruta?: string; patron?: string } = {}) {
  return render(
    <MantineProvider theme={theme}>
      <Notifications />
      <MemoryRouter initialEntries={[ruta]}>
        <Routes>
          <Route path={patron} element={pantalla} />
          <Route path="*" element={null} />
        </Routes>
        <RutaActual />
      </MemoryRouter>
    </MantineProvider>,
  );
}
