import { Producto } from "src/app/domains/productos/producto.model";
import { Presentacion } from "src/app/domains/productos/presentacion.model";

export class PedidoRecepcionProductoDto {
  producto: Producto;
  totalCantidadARecibirPorUnidad: number;
  totalCantidadRecibidaPorUnidad: number;
  totalCantidadRechazadaPorUnidad: number;
  cantidadPendientePorUnidad: number;
  mostrarEnUnidadBase: boolean;
  presentacionInicialSugerida: Presentacion;
  cantidadInicialPorPresentacion: number;
  estado: PedidoRecepcionProductoEstado;
}

export enum PedidoRecepcionProductoEstado {
  PENDIENTE = 'PENDIENTE',
  RECIBIDO = 'RECIBIDO',
  RECIBIDO_PARCIALMENTE = 'RECIBIDO_PARCIALMENTE'
}
