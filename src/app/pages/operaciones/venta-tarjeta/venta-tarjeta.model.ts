export enum VentaTarjetaEstado {
  PENDIENTE = 'PENDIENTE',
  COMPLETADO = 'COMPLETADO'
}

export interface VentaTarjeta {
  id?: number;
  sucursalId?: number;
  venta?: {
    id: number;
    totalGs: number;
    creadoEn: string;
    usuario?: { id: number; persona: { nombre: string } };
  };
  terminalPos?: { id: number; codigo: string; descripcion: string; moneda?: { id: number; simbolo: string; denominacion: string } };
  caja?: { id: number; usuario?: { persona: { nombre: string } } };
  codigoAutorizacion?: string;
  numeroBoleta?: string;
  monto?: number;
  montoEscaneado?: number;
  imagenUrl?: string;
  estado?: VentaTarjetaEstado;
  usuario?: { id: number; persona: { nombre: string } };
  creadoEn?: string;
}

export interface VentaTarjetaInput {
  id?: number;
  sucursalId?: number;
  ventaId?: number;
  terminalPosId?: number;
  cajaId?: number;
  codigoAutorizacion?: string;
  numeroBoleta?: string;
  monto?: number;
  montoEscaneado?: number;
  imagenUrl?: string;
  estado?: string;
  usuarioId?: number;
}
