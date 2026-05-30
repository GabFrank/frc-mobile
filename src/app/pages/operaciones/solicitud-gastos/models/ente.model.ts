export type TipoEnte = 'VEHICULO' | 'MUEBLE' | 'INMUEBLE';

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

export type ActivoBusqueda = Vehiculo | Mueble | Inmueble;

export type ModuloPadreGasto = 'VEHICULO' | 'MUEBLE' | 'INMUEBLE' | 'PERSONAS' | 'OTRO';
