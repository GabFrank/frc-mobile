import { Sucursal } from 'src/app/domains/empresarial/sucursal/sucursal.model';
import { Usuario } from 'src/app/domains/personas/usuario.model';
import { Proveedor } from 'src/app/pages/personas/proveedor/proveedor.model';
import { Moneda } from 'src/app/pages/operaciones/moneda/moneda.model';
import { NotaRecepcion } from '../nota-recepcion/nota-recepcion.model';

export class RecepcionMercaderia {
  id: number;
  proveedor: Proveedor;
  sucursalRecepcion: Sucursal;
  fecha: Date;
  moneda: Moneda;
  cotizacion: number;
  estado: RecepcionMercaderiaEstado;
  usuario: Usuario;
  cantNotas?: number; // Campo calculado (no viene del backend directamente)
  notas?: NotaRecepcion[]; // Para calcular cantNotas
}

export enum RecepcionMercaderiaEstado {
  PENDIENTE = 'PENDIENTE',
  EN_PROCESO = 'EN_PROCESO',
  FINALIZADA = 'FINALIZADA',
  CANCELADA = 'CANCELADA'
}
