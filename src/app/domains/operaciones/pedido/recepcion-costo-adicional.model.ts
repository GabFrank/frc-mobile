import { RecepcionMercaderia } from './recepcion-mercaderia.model';
import { Moneda } from '../../../pages/operaciones/moneda/moneda.model';

export interface RecepcionCostoAdicional {
    id: number;
    recepcionMercaderia: RecepcionMercaderia;
    descripcion: string;
    monto: number;
    moneda: Moneda;
} 