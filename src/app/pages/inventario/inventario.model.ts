import { dateToString } from 'src/app/generic/utils/dateUtils';
import { Sucursal } from "src/app/domains/empresarial/sucursal.model";
import { Usuario } from "src/app/domains/personas/usuario.model";
import { Presentacion } from "src/app/domains/productos/presentacion.model";
import { Producto } from "src/app/domains/productos/producto.model";
import { Zona } from "src/app/domains/zona/zona.model";

export class Inventario {
  id: number;
  sucursal: Sucursal;
  fechaInicio: Date;
  fechaFin: Date;
  abierto: boolean;
  tipo: TipoInventario;
  estado: InventarioEstado;
  usuario: Usuario
  observacion: string;
  inventarioProductoList: InventarioProducto[] = []

  toInput(): InventarioInput {
    let input = new InventarioInput;
    input.id = this.id;
    input.sucursalId = this.sucursal?.id;
    input.fechaInicio = this.fechaInicio;
    input.fechaFin = this.fechaFin;
    input.abierto = this.abierto;
    input.tipo = this.tipo;
    input.estado = this.estado;
    input.usuarioId = this.usuario?.id;
    input.observacion = this.observacion;
    return input;
  }
}

export class InventarioInput {
  id: number;
  sucursalId: number;
  fechaInicio: Date;
  fechaFin: Date;
  abierto: boolean;
  tipo: TipoInventario;
  estado: InventarioEstado;
  usuarioId: number
  observacion: string;
}

export class InventarioProducto {
  id: number;
  idOrigen: number;
  idCentral: number;
  inventario: Inventario;
  producto: Producto;
  zona: Zona;
  concluido: boolean;
  usuario: Usuario;
  creadoEn: Date;
  inventarioProductoItemList: InventarioProductoItem[] = []

  toInput(): InventarioProductoInput {
    let input = new InventarioProductoInput;
    input.id = this.id;
    input.inventarioId = this.inventario?.id;
    input.productoId = this.producto?.id;
    input.zonaId = this.zona?.id;
    input.concluido = this.concluido;
    input.usuarioId = this.usuario?.id;
    input.creadoEn = this.creadoEn;
    return input;
  }
}

export class InventarioProductoInput {
  id: number;
  idOrigen: number;
  idCentral: number;
  inventarioId: number;
  productoId: number;
  concluido: boolean;
  zonaId: number;
  usuarioId: number;
  creadoEn: Date;
}

export class InventarioProductoItem {
  id: number;
  inventarioProducto: InventarioProducto;
  zona: Zona;
  presentacion: Presentacion;
  cantidad: number;
  vencimiento: Date;
  usuario: Usuario;
  estado: InventarioProductoEstado
  creadoEn: Date;

  toInput(): InventarioProductoItemInput {
    let input = new InventarioProductoItemInput;
    input.id = this.id
    input.inventarioProductoId = this.inventarioProducto?.id
    input.zonaId = this.zona?.id
    input.presentacionId = this.presentacion?.id
    input.cantidad = this.cantidad
    input.vencimiento = dateToString(this.vencimiento)
    input.estado = this.estado
    input.usuarioId = this.usuario?.id
    input.creadoEn = this.creadoEn;
    return input;
  }
}

export class InventarioProductoItemInput {
  id: number;
  inventarioProductoId: number;
  zonaId: number;
  presentacionId: any; //presentacion
  cantidad: number;
  vencimiento: string; //vencimiento que el sistema le va a indicar, si no existe crear vencimiento
  estado: InventarioProductoEstado
  usuarioId: number;
  creadoEn: Date;
}

export enum InventarioEstado {
  ABIERTO = 'ABIERTO',
  CANCELADO = 'CANCELADO',
  CONCLUIDO = 'CONCLUIDO'
}

export enum InventarioProductoEstado {
  BUENO = 'BUENO',
  AVERIADO = 'AVERIADO',
  VENCIDO = 'VENCIDO'
}

export enum TipoInventario {
  ABC = 'ABC',
  ZONA = 'ZONA',
  PRODUCTO = 'PRODUCTO',
  CATEGORIA = 'CATEGORIA'
}
