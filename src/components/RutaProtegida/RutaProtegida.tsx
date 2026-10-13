// Protege /admin/* (stack-frontend.md 7, guía frontend 4). Solo UX: el backend vuelve a validar.
import { Navigate, Outlet } from 'react-router-dom';
import type { Rol } from '@/types/comun';
import { ROL_GESTOR, sesionActual } from '@/services/auth';

interface RutaProtegidaProps {
  rol?: Rol;
}

export function RutaProtegida({ rol = ROL_GESTOR }: RutaProtegidaProps) {
  const sesion = sesionActual();

  if (!sesion.autenticado || !sesion.roles.includes(rol)) {
    return <Navigate to="/acceso-denegado" replace />;
  }

  return <Outlet />;
}
