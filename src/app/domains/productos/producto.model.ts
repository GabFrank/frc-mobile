import { Usuario } from "../personas/usuario.model";
import { Codigo } from "./codigo.model";
import { Presentacion } from "./presentacion.model";

// Placeholder classes to avoid breaking changes
export class Subfamilia {
  id: number;
  descripcion: string;
}

export class CostoPorProducto {
  id: number;
  costo: number;
}
export class Pedido {}

export class Producto {
  id: number;
  idCentral: number;
  descripcion: string;
  descripcionFactura?: string;
  iva?: number;
  unidadPorCaja?: number;
  unidadPorCajaSecundaria?: number;
  balanza?: boolean;
  stock?: boolean;
  garantia?: boolean;
  tiempoGarantia?: number;
  ingrediente?: boolean;
  combo?: boolean;
  promocion?: boolean;
  vencimiento?: boolean;
  diasVencimiento?: number;
  cambiable?: boolean;
  usuario?: Usuario;
  imagenPrincipal?: string;
  tipoConservacion?: string;
  // subfamilia?: Subfamilia;
  codigos?: [Codigo]
  // sucursales?: [ExistenciaCostoPorSucursal]
  // productoUltimasCompras?: [ExistenciaCostoPorSucursal]
  presentaciones: Presentacion[]
  stockPorProducto?: number;
  codigoPrincipal?: string
  costo: CostoPorProducto
  isEnvase: boolean;
  envase: Producto
  lote?: boolean;
  subfamilia?: Subfamilia;
  sucursales?: ExistenciaCostoPorSucursal[]
  productoUltimasCompras?: ExistenciaCostoPorSucursal[]
  stockPorProductoDestino?: any;
  precioPrincipal: number;
  activo: boolean
  creadoEn: Date
}

export class ExistenciaCostoPorSucursal {
  fechaUltimaCompra: Date
  precio: number;
  cantidadUltimaCompra: number;
  costoMedio: number;
  existencia: number;
  pedido: Pedido;
  sucursal: any; // Using any to avoid dependency on Sucursal model for now
  cantMinima: number;
  cantMaxima: number;
  cantMedia: number;
}

export class ProductoUltimasCompra {
  pedido: Pedido;
  precio: number;
  cantidad: number;
  creadoEn: Date;
}

export class ProductoInput {
  id?: number;
  descripcion: string;
  descripcionFactura: string;
  iva: number;
  unidadPorCaja: number;
  unidadPorCajaSecundaria: number;
  balanza: boolean;
  stock: boolean;
  garantia: boolean;
  tiempoGarantia: boolean;
  cambiable: boolean;
  ingredientes: boolean;
  combo: boolean;
  promocion: boolean;
  vencimiento: boolean;
  diasVencimiento: number;
  usuarioId?: number;
  imagenes?: string;
  tipoConservacion: string;
  subfamiliaId: number;
  isEnvase: boolean;
  envaseId: number;
  lote?: boolean;
}
