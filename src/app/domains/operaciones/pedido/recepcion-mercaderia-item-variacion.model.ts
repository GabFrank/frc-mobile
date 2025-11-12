import { Presentacion } from "../../productos/presentacion.model";
import { MotivoRechazoFisico } from "./recepcion-mercaderia-item.model";

export interface RecepcionMercaderiaItemVariacion {
    id?: number;
    presentacion?: Presentacion;
    cantidad?: number;
    vencimiento?: Date;
    lote?: string;
    rechazado?: boolean;
    motivoRechazo?: MotivoRechazoFisico;
}
