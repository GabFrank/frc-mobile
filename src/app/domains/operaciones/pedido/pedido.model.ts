
import { Proveedor } from 'src/app/pages/personas/proveedor/proveedor.model';
import { Vendedor } from 'src/app/pages/personas/vendedor/vendedor.model';
import { Moneda } from '../../../pages/operaciones/moneda/moneda.model';
import { FormaPago } from '../../forma-pago/forma-pago.model';
import { Usuario } from '../../personas/usuario.model';

export interface Pedido {
    id: number;
    proveedor?: Proveedor;
    vendedor?: Vendedor;
    formaPago?: FormaPago;
    tipoBoleta?: string;
    moneda?: Moneda;
    plazoCredito?: number;
    creadoEn?: Date;
    usuario?: Usuario;
} 