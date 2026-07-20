export type TipoEnte = 'VEHICULO' | 'MUEBLE' | 'INMUEBLE' | 'EQUIPO';

export class Ente {
  id?: number;
  tipoEnte?: TipoEnte;
  referenciaId?: number;
  descripcion?: string;
  activo?: boolean;
}

export class Vehiculo {
  id: number;
  chapa?: string;
  modelo?: {
    descripcion?: string;
    marca?: { descripcion?: string };
  };
}

export class Mueble {
  id: number;
  descripcion?: string;
}

export class Inmueble {
  id: number;
  nombreAsignado?: string;
}

export class Equipo {
  id: number;
  identificador?: string;
  descripcion?: string;
  modelo?: {
    descripcion?: string;
    marca?: { descripcion?: string };
  };
}

export type ActivoBusqueda = Vehiculo | Mueble | Inmueble | Equipo;

// Definición única de ModuloPadreGasto: vive en la util de reglas y se re-exporta
// acá para mantener un solo punto de verdad y evitar divergencias.
export { ModuloPadreGasto } from '../utils/tipo-gasto-modulo-reglas.util';
