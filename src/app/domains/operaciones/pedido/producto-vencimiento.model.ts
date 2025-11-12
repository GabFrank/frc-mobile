import { Producto } from '../../productos/producto.model';
import { Presentacion } from '../../productos/presentacion.model';
import { Sucursal } from '../../empresarial/sucursal/sucursal.model';
import { Usuario } from '../../personas/usuario.model';

export interface ProductoVencimiento {
    id: number;
    producto: Producto;
    presentacion?: Presentacion;
    sucursal: Sucursal;
    fechaVencimiento: Date;
    cantidad: number;
    tipoOrigen: TipoOrigenVencimiento;
    origenId: number;
    usuario: Usuario;
    fechaCreacion: Date;
}

export enum TipoOrigenVencimiento {
    RECEPCION_MERCADERIA = 'RECEPCION_MERCADERIA',
    AJUSTE_STOCK = 'AJUSTE_STOCK',
    VENTA = 'VENTA',
    TRANSFERENCIA = 'TRANSFERENCIA'
} 