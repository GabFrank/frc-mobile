import { RecepcionMercaderia } from './recepcion-mercaderia.model';
import { NotaRecepcionItemDistribucion } from './nota-recepcion-item-distribucion.model';
import { Producto } from '../../productos/producto.model';
import { Presentacion } from '../../productos/presentacion.model';
import { Sucursal } from '../../empresarial/sucursal/sucursal.model';
import { Usuario } from '../../personas/usuario.model';
import { NotaRecepcionItem } from './nota-recepcion-item.model';
import { RecepcionMercaderiaItemVariacion } from './recepcion-mercaderia-item-variacion.model';
export interface RecepcionMercaderiaItem {
    id: number;
    recepcionMercaderia: RecepcionMercaderia;
    notaRecepcionItem: NotaRecepcionItem;
    notaRecepcionItemDistribucion?: NotaRecepcionItemDistribucion;
    producto: Producto;
    presentacionRecibida?: Presentacion;
    sucursalEntrega: Sucursal;
    usuario: Usuario;
    cantidadRecibida: number;
    cantidadRechazada?: number;
    esBonificacion: boolean;
    vencimientoRecibido?: Date;
    lote?: string;
    motivoRechazo?: MotivoRechazoFisico;
    observaciones?: string;
    metodoVerificacion: MetodoVerificacion;
    motivoVerificacionManual?: MotivoVerificacionManual;
    estadoVerificacion: EstadoVerificacion;
    variaciones?: RecepcionMercaderiaItemVariacion[];
}

export enum MetodoVerificacion {
    ESCANER = 'ESCANER',
    MANUAL = 'MANUAL'
}

export enum MotivoVerificacionManual {
    CODIGO_ILEGIBLE = 'CODIGO_ILEGIBLE',
    PRODUCTO_SIN_CODIGO = 'PRODUCTO_SIN_CODIGO'
}

export enum MotivoRechazoFisico {
    PRODUCTO_DANADO = 'PRODUCTO_DANADO',
    PRODUCTO_VENCIDO = 'PRODUCTO_VENCIDO',
    PRODUCTO_INCORRECTO = 'PRODUCTO_INCORRECTO',
    CANTIDAD_INCORRECTA = 'CANTIDAD_INCORRECTA',
    OTRO = 'OTRO'
}

export enum EstadoVerificacion {
    PENDIENTE = 'PENDIENTE',
    VERIFICADO = 'VERIFICADO',
    VERIFICADO_CON_DIFERENCIA = 'VERIFICADO_CON_DIFERENCIA',
    RECHAZADO = 'RECHAZADO'
} 