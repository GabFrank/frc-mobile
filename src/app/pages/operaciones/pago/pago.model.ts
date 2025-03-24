import { Usuario } from 'src/app/domains/personas/usuario.model';
import { dateToString } from 'src/app/generic/utils/dateUtils';
import { SolicitudPago } from '../solicitud-pago/solicitud-pago.model';

export enum PagoEstado {
  ABIERTO = 'ABIERTO',
  PENDIENTE = 'PENDIENTE',
  PARCIAL = 'PARCIAL',
  CONCLUIDO = 'CONCLUIDO',
  CANCELADO = 'CANCELADO'
}

export class Pago {
  id: number;
  usuario: Usuario;
  autorizadoPor: Usuario;
  solicitudPago: SolicitudPago;
  creadoEn: Date;
  estado: PagoEstado;
  programado: boolean;

  toInput(): PagoInput {
    let input = new PagoInput();
    input.id = this.id;
    input.usuarioId = this.usuario?.id;
    input.autorizadoPorId = this.autorizadoPor?.id;
    input.solicitudPagoId = this.solicitudPago?.id;
    input.creadoEn = dateToString(this.creadoEn);
    input.estado = this.estado;
    input.programado = this.programado;
    return input;
  }
}

export class PagoInput {
  id: number;
  usuarioId: number;
  autorizadoPorId: number;
  solicitudPagoId: number;
  creadoEn: string;
  estado: PagoEstado;
  programado: boolean;
} 