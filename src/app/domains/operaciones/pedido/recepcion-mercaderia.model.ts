import { Sucursal } from "../../empresarial/sucursal/sucursal.model";
import { Moneda } from "../../../pages/operaciones/moneda/moneda.model";
import { Proveedor } from "../../../pages/personas/proveedor/proveedor.model";
import { Usuario } from "../../personas/usuario.model";
import { RecepcionMercaderiaItem } from "./recepcion-mercaderia-item.model";
import { RecepcionCostoAdicional } from "./recepcion-costo-adicional.model";

export interface RecepcionMercaderia {
    id: number;
    proveedor: Proveedor;
    sucursalRecepcion: Sucursal;
    fecha: Date;
    moneda: Moneda;
    cotizacion: number;
    estado: RecepcionMercaderiaEstado;
    usuario: Usuario;
    items: RecepcionMercaderiaItem[];
    costosAdicionales: RecepcionCostoAdicional[];
}

export enum RecepcionMercaderiaEstado {
    PENDIENTE = 'PENDIENTE',
    EN_PROCESO = 'EN_PROCESO',
    FINALIZADA = 'FINALIZADA',
    CANCELADA = 'CANCELADA'
}

export interface RecepcionMercaderiaInput {
    id?: number;
    proveedorId: number;
    sucursalRecepcionId: number;
    fecha?: string;
    monedaId: number;
    cotizacion?: number;
    estado?: RecepcionMercaderiaEstado;
    usuarioId: number;
    notaRecepcionIds?: number[];
}