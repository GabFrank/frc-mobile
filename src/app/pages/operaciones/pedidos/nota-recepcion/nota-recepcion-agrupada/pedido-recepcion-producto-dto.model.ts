import { Producto } from "src/app/domains/productos/producto.model";

export class PedidoRecepcionProductoDto {
  producto: Producto;
  totalCantidadARecibirPorUnidad: number;
  totalCantidadRecibidaPorUnidad: number;
  estado: PedidoRecepcionProductoEstado;
}

export enum PedidoRecepcionProductoEstado {
  PENDIENTE = 'PENDIENTE',
  RECIBIDO = 'RECIBIDO',
  RECIBIDO_PARCIALMENTE = 'RECIBIDO_PARCIALMENTE'
}
