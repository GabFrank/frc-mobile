import { Producto } from 'src/app/domains/productos/producto.model';
import { Sucursal } from 'src/app/domains/empresarial/sucursal/sucursal.model';
import { Usuario } from 'src/app/domains/personas/usuario.model';
import { TipoMovimiento } from './movimiento-stock.enums';

export class MovimientoStock {
  id: number;
  sucursalId: number;
  producto: Producto;
  tipoMovimiento: TipoMovimiento;
  referencia: number;
  cantidad: number;
  sucursal: Sucursal;
  estado: boolean;
  creadoEn: Date;
  usuario: Usuario;
  data?: any;
}

export interface MovimientoStockInput {
  id?: number;
  sucursalId: number;
  productoId: number;
  tipoMovimiento: TipoMovimiento;
  referencia: number;
  cantidad: number;
  estado: boolean;
  usuarioId: number;
}

