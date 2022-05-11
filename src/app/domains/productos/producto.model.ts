import { Usuario } from "../personas/usuario.model";

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
  // codigos?: [Codigo]
  // sucursales?: [ExistenciaCostoPorSucursal]
  // productoUltimasCompras?: [ExistenciaCostoPorSucursal]
  // presentaciones: Presentacion[]
  // stockPorProducto?: number;
  // codigoPrincipal?: string
  // costo: CostoPorProducto
  isEnvase: boolean;
  envase: Producto
}
