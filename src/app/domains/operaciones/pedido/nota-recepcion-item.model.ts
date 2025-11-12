import { NotaRecepcion } from './nota-recepcion.model';
import { PedidoItem } from './pedido-item.model';
import { Producto } from '../../productos/producto.model';
import { Presentacion } from '../../productos/presentacion.model';
import { Usuario } from '../../personas/usuario.model';
import { NotaRecepcionItemDistribucion } from './nota-recepcion-item-distribucion.model';
import { RecepcionMercaderiaItem } from './recepcion-mercaderia-item.model';

export interface NotaRecepcionItem {
    id: number;
    notaRecepcion: NotaRecepcion;
    pedidoItem?: PedidoItem;
    producto: Producto;
    presentacionEnNota?: Presentacion;
    cantidadEnNota: number;
    precioUnitarioEnNota: number;
    esBonificacion?: boolean;
    vencimientoEnNota?: Date;
    observacion?: string;
    estado: NotaRecepcionItemEstado;
    motivoRechazo?: string;
    creadoEn?: Date;
    usuario?: Usuario;
    distribucionConcluida?: boolean;
    cantidadPendiente?: number;
    notaRecepcionItemDistribuciones?: NotaRecepcionItemDistribucion[];
    
    // Campos de recepción física (calculados por el resolver)
    cantidadRecibida?: number;
    cantidadRechazada?: number;
    estadoRecepcion?: string;
    recepcionMercaderiaItems?: RecepcionMercaderiaItem[];
}

export enum NotaRecepcionItemEstado {
    PENDIENTE_CONCILIACION = 'PENDIENTE_CONCILIACION',
    CONCILIADO = 'CONCILIADO',
    RECHAZADO = 'RECHAZADO',
    DISCREPANCIA = 'DISCREPANCIA'
}

export enum FiltroVerificacion {
    TODOS = 'TODOS',
    PENDIENTES = 'PENDIENTES',
    VERIFICADOS = 'VERIFICADOS'
}

export interface NotaRecepcionItemInput {
    id?: number;
    notaRecepcionId: number;
    pedidoItemId?: number;
    productoId: number;
    presentacionEnNotaId?: number;
    cantidadEnNota: number;
    precioUnitarioEnNota: number;
    esBonificacion?: boolean;
    vencimientoEnNota?: string;
    observacion?: string;
    estado: NotaRecepcionItemEstado;
    motivoRechazo?: string;
    creadoEn?: string;
    usuarioId?: number;
} 