import { ConstanciaDeRecepcion } from './constancia-de-recepcion.model';
import { Producto } from '../../productos/producto.model';
import { Presentacion } from '../../productos/presentacion.model';

export interface ConstanciaDeRecepcionItem {
    id: number;
    constanciaDeRecepcion: ConstanciaDeRecepcion;
    producto: Producto;
    presentacion?: Presentacion;
    cantidadRecibida: number;
    cantidadRechazadaFisico: number;
} 