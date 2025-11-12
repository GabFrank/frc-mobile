import { Pedido } from './pedido.model';
import { Producto } from '../../productos/producto.model';
import { Presentacion } from '../../productos/presentacion.model';
import { Usuario } from '../../personas/usuario.model';

export interface PedidoItem {
    id: number;
    pedido?: Pedido;
    producto?: Producto;
    presentacionCreacion?: Presentacion;
    cantidadSolicitada: number;
    precioUnitarioSolicitado?: number;
    vencimientoEsperado?: Date;
    observacion?: string;
    esBonificacion: boolean;
    estado: PedidoItemEstado;
    creadoEn?: Date;
    usuarioCreacion?: Usuario;
}

export enum PedidoItemEstado {
    PENDIENTE = 'PENDIENTE',
    APROBADO = 'APROBADO',
    RECHAZADO = 'RECHAZADO',
    CANCELADO = 'CANCELADO'
} 