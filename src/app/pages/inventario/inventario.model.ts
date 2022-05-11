import { Usuario } from './../../domains/personas/usuario.model';
export class Inventario {
  id: number;
  fechaInicio: Date;
  fechaFin: Date;
  abierto: boolean;
  estado: InventarioEstado;
  usuario: Usuario
  observacion: string;
  inventarioProductoList: InventarioProducto[] = []
}

export class InventarioProducto {
  id: number;
  inventario: Inventario;
  producto: any; //producto
  inventarioProductoItemList: InventarioProductoItem[] = []
}

export class InventarioProductoItem {
  id: number;
  inventarioProducto: InventarioProducto;
  sector: Sector;
  presentacion: any; //presentacion
  cantidad: number;
  vencimiento: Date; //vencimiento que el sistema le va a indicar, si no existe crear vencimiento
  usuario: Usuario;
  creadoEn: Date;

  constructor(id, inventarioProducto, sector, presentacion, cantidad, vencimiento, usuario, creadoEn){
    this.id = id;
    this.inventarioProducto = inventarioProducto;
    this.sector = sector;
    this.presentacion = presentacion;
    this.cantidad = cantidad;
    this.vencimiento = vencimiento;
    this.usuario = usuario;
    this.creadoEn = creadoEn;
  }
}

export class Sector {
  id: number;
  descripcion: string;
  activo: boolean;

  constructor(id, descripcion, activo){
    this.id = id;
    this.descripcion = descripcion;
    this.activo = activo
  }
}

export enum InventarioEstado {
  ABIERTO,
  CANCELADO,
  CONCLUIDO
}
