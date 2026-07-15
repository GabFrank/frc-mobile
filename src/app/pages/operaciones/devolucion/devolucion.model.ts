import { Producto } from 'src/app/domains/productos/producto.model';
import { Presentacion } from 'src/app/domains/productos/presentacion.model';
import { Proveedor } from 'src/app/pages/personas/proveedor/proveedor.model';
import { Sucursal } from 'src/app/domains/empresarial/sucursal/sucursal.model';
import { EstadoDevolucion, TipoDevolucion } from './devolucion.enums';

export class MotivoAveria {
  id: number;
  descripcion: string;
  activo: boolean;
  generaGasto: boolean;
  aplicaProveedor: boolean;
}

export class DevolucionItem {
  id: number;
  producto: Producto;
  presentacion: Presentacion;
  motivoAveria: MotivoAveria;
  cantidad: number;
  motivo: string;
  lote: string;
  vencimiento: string;
  costoUnitario: number;
  cantidadReingresada: number;
  vencimientoReingreso: string;
}

export class Devolucion {
  id: number;
  tipo: TipoDevolucion;
  proveedor: Proveedor;
  sucursalOrigen: Sucursal;
  sucursalUbicacion?: Sucursal;
  colectadoEn?: string;
  identificador?: string;
  fecha: string;
  motivo: string;
  estado: EstadoDevolucion;
  observacion: string;
  items: DevolucionItem[];
}

export interface DevolucionItemInput {
  id?: number;
  devolucionId?: number;
  productoId: number;
  presentacionId: number;
  motivoAveriaId: number;
  cantidad: number;
  motivo?: string;
  lote?: string;
  vencimiento?: string;
  costoUnitario?: number;
  cantidadReingresada?: number;
  vencimientoReingreso?: string;
}

export interface DevolucionInput {
  id?: number;
  tipo: TipoDevolucion;
  proveedorId?: number;
  sucursalOrigenId: number;
  fecha: string;
  motivo?: string;
  estado: EstadoDevolucion;
  observacion?: string;
  usuarioId: number;
  items: DevolucionItemInput[];
}

/**
 * Fila de trabajo en la UI mobile: mantiene el producto/presentacion escaneados
 * junto con los datos capturados antes de armar el DevolucionItemInput.
 */
export interface DevolucionItemDraft {
  producto: Producto;
  presentacion: Presentacion;
  motivoAveria: MotivoAveria;
  cantidad: number;
  lote?: string;
  vencimiento?: string;
  motivo?: string;
}
