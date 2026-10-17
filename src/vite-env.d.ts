/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_VENTAS_URL: string;
  readonly VITE_API_POSTVENTA_URL: string;
  readonly VITE_GATEWAY_URL: string;
  readonly VITE_SEGURIDAD_LOGIN_URL: string;
  readonly VITE_AUTH_DESACTIVADA?: string;
  /** true: entra sin token (demo con el backend sin seguridad). Ver services/auth.ts */
  readonly VITE_MODO_DEMO?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
