// Theme de Mantine derivado de diseno/guia_ux_ui (paleta, tipografía, radios).
// OJO: los mockups todavía no son finales (guía frontend, advertencia inicial):
// no hardcodear los 5 colores de KPI del Dashboard; el naranja debe predominar.
import { createTheme, type MantineColorsTuple } from '@mantine/core';

// Escalas de 10 tonos provisionales construidas alrededor del HEX oficial de cada token.
// Reemplazar por las tonalidades definitivas cuando se cierren en Figma.

/** color/accent/volt = #C3E504 (índice 6) */
const volt: MantineColorsTuple = [
  '#FBFEE0',
  '#F4FBC0',
  '#EEF7B0',
  '#E2F27A',
  '#D4EC45',
  '#C9E81F',
  '#C3E504',
  '#A3C003',
  '#7F9502',
  '#5C6B00',
];

/** color/accent/signal = #4361EE (índice 6), signal-soft = #E1E6FB (índice 1) */
const signal: MantineColorsTuple = [
  '#EEF0FE',
  '#E1E6FB',
  '#C3CDF8',
  '#A2B1F4',
  '#8095F1',
  '#6179EF',
  '#4361EE',
  '#3550D0',
  '#2A3FB3',
  '#1B2A99',
];

/** color/surface/ink = #1B1812 (índice 9), ink-soft = #26221A (8), border/inverse = #3A362C (6) */
const ink: MantineColorsTuple = [
  '#F5F4F2',
  '#E2E0DB',
  '#C4C0B6',
  '#9C978A',
  '#6E695D',
  '#4A453A',
  '#3A362C',
  '#2F2B22',
  '#26221A',
  '#1B1812',
];

/** color/surface/cloud = #F7F5F0 (índice 2), cloud-subtle = #EDEAE2 (índice 4) */
const cloud: MantineColorsTuple = [
  '#FFFFFF',
  '#FCFBF8',
  '#F7F5F0',
  '#F2EFE8',
  '#EDEAE2',
  '#E5E1D6',
  '#DDD8CB',
  '#D6D2C4',
  '#BDB8A8',
  '#A39E8C',
];

export const theme = createTheme({
  // color/action/primary = orange.7 (#F76707)
  primaryColor: 'orange',
  primaryShade: 7,
  autoContrast: true,
  colors: { volt, signal, ink, cloud },

  // Tipografía: Inter para cuerpo, Oswald para títulos (ver src/theme/global.css)
  fontFamily: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  headings: {
    fontFamily: 'Oswald, "Segoe UI", sans-serif',
    fontWeight: '700',
    sizes: {
      h1: { fontSize: '2rem', lineHeight: '2.5rem' },
      h2: { fontSize: '1.75rem', lineHeight: '2.25rem' },
      h3: { fontSize: '1.5rem', lineHeight: '2rem' },
      h4: { fontSize: '1.25rem', lineHeight: '1.75rem' },
    },
  },
  fontSizes: {
    xs: '0.75rem',
    sm: '0.875rem',
    md: '1rem',
    lg: '1.125rem',
    xl: '1.25rem',
  },

  // Radios: xs 4, sm 8 (por defecto), md 12 (tarjetas), lg 16 (modales), xl = pill
  radius: {
    xs: '4px',
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '999px',
  },
  defaultRadius: 'sm',

  // Foco de teclado con color/accent/signal
  focusRing: 'auto',

  components: {
    Card: { defaultProps: { radius: 'md', withBorder: true } },
    Paper: { defaultProps: { radius: 'md' } },
    Modal: { defaultProps: { radius: 'lg', centered: true } },
    Badge: { defaultProps: { radius: 'xl' } },
  },
});
