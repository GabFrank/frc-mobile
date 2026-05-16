import { Moneda } from "../../moneda/moneda.model";
import { SucursalItem } from "../interfaces";

export class PreGasto {
  id: number;
  descripcion?: string;
  estado: string;
  montoSolicitado?: number;
  montoRetirado?: number;
  montoGastado?: number;
  moneda?: Moneda;
  sucursalCaja?: SucursalItem;
  creadoEn?: string;
  estadoEtiqueta?: string;
  estadoColor?: string;
  estadoIcono?: string;
}
