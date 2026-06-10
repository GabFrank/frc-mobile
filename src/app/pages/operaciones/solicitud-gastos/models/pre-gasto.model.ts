import { Moneda } from "../../moneda/moneda.model";
import { SucursalItem } from "../interfaces";
import { TipoGasto } from "./tipo-gasto.model";

export class PersonaResumen {
  id: number;
  nombre: string;
}

export class GastoRendicion {
  id: number;
  montoTotal: number;
  fotoFacturaUrl?: string;
  fotoProductoUrl?: string;
  fotosFacturaUrls?: string[];
  fotosProductoUrls?: string[];
  kmActual?: number;
  litros?: number;
  precioPorLitro?: number;
  ubicacionProvisoria?: string;
  establecimientoAlimentacion?: string;
  creadoEn?: string;
  tipoGasto?: TipoGasto;
}

export class PreGasto {
  id: number;
  sucursalId?: number;
  descripcion?: string;
  estado: string;
  montoSolicitado?: number;
  montoRetirado?: number;
  montoGastado?: number;
  saldoDevolver?: number;
  moneda?: Moneda;
  sucursalCaja?: SucursalItem;
  cajaId?: number;
  qrToken?: string;
  retiroConfirmadoEn?: string;
  creadoEn?: string;
  estadoEtiqueta?: string;
  estadoColor?: string;
  estadoIcono?: string;
  estadoRendicion?: string;
  funcionario?: PersonaResumen;
  tipoGasto?: TipoGasto;
  finanzas?: { monto: number; moneda?: Moneda }[];
  rendiciones?: GastoRendicion[];
}

export class GastoRendicionInput {
  preGastoId: number;
  sucursalId: number;
  tipoGastoId?: number;
  montoTotal: number;
  fotoFacturaUrl?: string;
  fotoProductoUrl?: string;
  fotosFacturaUrls?: string[];
  fotosProductoUrls?: string[];
  kmActual?: number;
  litros?: number;
  precioPorLitro?: number;
  ubicacionProvisoria?: string;
  establecimientoAlimentacion?: string;
  usuarioId?: number;
}
