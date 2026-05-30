import { DetalleGastoFormulario } from './detalle-gasto-formulario.interface';

export interface DatosSolicitudGasto {
  sucursalId: number | null;
  responsableId: number | null;
  tipoGastoId: number | null;
  beneficiarioTipo: 'PERSONA' | 'PROVEEDOR';
  beneficiarioPersonaId: number | null;
  beneficiarioProveedorId: number | null;
  fechaVencimiento: string;
  nivelUrgencia: string;
  descripcion: string;
  enteId?: number | null;
  gastoItems: DetalleGastoFormulario[];
}
