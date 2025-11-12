
import { Documento } from '../../../pages/financiero/documento/documento.model';
import { Moneda } from '../../../pages/operaciones/moneda/moneda.model';
import { Usuario } from '../../personas/usuario.model';
import { Compra } from './compra.model';
import { Pedido } from './pedido.model';

export interface NotaRecepcion {
    id: number;
    pedido?: Pedido;
    compra?: Compra;
    documento?: Documento;
    numero?: number;
    tipoBoleta?: string;
    timbrado?: number;
    fecha: Date;
    moneda: Moneda;
    cotizacion?: number;
    estado: NotaRecepcionEstado;
    pagado?: boolean;
    esNotaRechazo?: boolean;
    creadoEn?: Date;
    usuario?: Usuario;
}

export enum NotaRecepcionEstado {
    PENDIENTE_CONCILIACION = 'PENDIENTE_CONCILIACION',
    CONCILIADA = 'CONCILIADA',
    EN_RECEPCION = 'EN_RECEPCION',
    RECEPCION_PARCIAL = 'RECEPCION_PARCIAL',
    RECEPCION_COMPLETA = 'RECEPCION_COMPLETA',
    CERRADA = 'CERRADA'
} 