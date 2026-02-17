import { Usuario } from 'src/app/domains/personas/usuario.model';
import { dateToString } from 'src/app/generic/utils/dateUtils';
import { Proveedor } from 'src/app/pages/personas/proveedor/proveedor.model';
import { Moneda } from 'src/app/pages/operaciones/moneda/moneda.model';
import { FormaPago } from 'src/app/domains/forma-pago/forma-pago.model';
import { NotaRecepcion } from 'src/app/pages/operaciones/pedidos/nota-recepcion/nota-recepcion.model';

export enum SolicitudPagoEstado {
  PENDIENTE = 'PENDIENTE',
  PARCIAL = 'PARCIAL',
  CONCLUIDO = 'CONCLUIDO',
  CANCELADO = 'CANCELADO'
}

export interface SolicitudPago {
  id?: number;
  proveedor?: Proveedor;
  numeroSolicitud?: string;
  fechaSolicitud?: string;
  fechaPagoPropuesta?: string;
  montoTotal?: number;
  moneda?: Moneda;
  formaPago?: FormaPago;
  estado?: SolicitudPagoEstado;
  observaciones?: string;
  creadoEn?: string;
  usuario?: Usuario;
  pago?: any;
  notasRecepcion?: SolicitudPagoNotaRecepcion[];
}

export interface SolicitudPagoNotaRecepcion {
  id?: number;
  solicitudPago?: SolicitudPago;
  notaRecepcion?: NotaRecepcion;
  montoIncluido?: number;
  creadoEn?: string;
}

export interface SolicitudPagoInput {
  id?: number;
  proveedorId: number;
  numeroSolicitud?: string;
  fechaSolicitud?: string;
  fechaPagoPropuesta?: string;
  montoTotal: number;
  monedaId: number;
  formaPagoId: number;
  estado: SolicitudPagoEstado;
  observaciones?: string;
  notaRecepcionIds: number[];
}

export interface SolicitudPagoPage {
  getTotalPages?: number;
  getTotalElements?: number;
  getNumberOfElements?: number;
  isFirst?: boolean;
  isLast?: boolean;
  hasNext?: boolean;
  hasPrevious?: boolean;
  getContent?: SolicitudPago[];
}
