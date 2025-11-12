import { RecepcionMercaderia } from './recepcion-mercaderia.model';
import { Proveedor } from '../../../pages/personas/proveedor/proveedor.model';
import { Sucursal } from '../../empresarial/sucursal/sucursal.model';
import { Usuario } from '../../personas/usuario.model';

export interface ConstanciaDeRecepcion {
    id: number;
    recepcionMercaderia: RecepcionMercaderia;
    proveedor: Proveedor;
    sucursal: Sucursal;
    fechaEmision: Date;
    usuario: Usuario;
    codigoVerificacion: string;
    estado: EstadoConstancia;
}

export enum EstadoConstancia {
    EMITIDA = 'EMITIDA',
    ANULADA = 'ANULADA'
} 