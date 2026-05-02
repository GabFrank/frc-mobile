import { PreGastoDetalleFinanzasInput } from './pre-gasto-detalle-finanzas-input.interface';

export interface PreGastoInput {
  id?: number;
  sucursalId: number;
  funcionarioId?: number;
  tipoGastoId?: number;
  descripcion?: string;
  sucursalCajaId?: number;
  cajaId?: number;
  usuarioId?: number;
  nivelUrgencia?: string;
  beneficiarioProveedorId?: number;
  beneficiarioPersonaId?: number;
  fechaVencimiento?: string;
  finanzas: PreGastoDetalleFinanzasInput[];
}
