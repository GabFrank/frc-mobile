import { Sucursal } from '../../empresarial/sucursal/sucursal.model';
import { Usuario } from '../../personas/usuario.model';
import { NotaRecepcionItem } from './nota-recepcion-item.model';

export interface NotaRecepcionItemDistribucion {
    id: number;
    notaRecepcionItem: NotaRecepcionItem;
    sucursalInfluencia?: Sucursal;
    sucursalEntrega: Sucursal;
    cantidad: number;
    creadoEn: Date;
    usuario?: Usuario;
} 