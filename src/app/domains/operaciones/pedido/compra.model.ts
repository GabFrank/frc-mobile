import { Pedido } from './pedido.model';
import { Usuario } from '../../personas/usuario.model';
import { Proveedor } from 'src/app/pages/personas/proveedor/proveedor.model';
import { FormaPago } from '../../forma-pago/forma-pago.model';

export interface Compra {
    id: number;
    proveedor?: Proveedor;
    pedido?: Pedido;
    fecha?: Date;
    estado?: string;
    formaPago?: FormaPago;
    descuento?: number;
    creadoEn?: Date;
    usuario?: Usuario;
} 