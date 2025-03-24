import { Usuario } from 'src/app/domains/personas/usuario.model';
import { dateToString } from 'src/app/generic/utils/dateUtils';
import { Pago } from '../pago.model';

// These imports may need to be adjusted based on actual paths in the project
interface Moneda {
  id: number;
}

interface FormaPago {
  id: number;
}

interface Sucursal {
  id: number;
}

interface PdvCaja {
  id: number;
}

export class PagoDetalle {
  id: number;
  pago: Pago;
  usuario: Usuario;
  creadoEn: Date;
  moneda: Moneda;
  formaPago: FormaPago;
  total: number;
  sucursal: Sucursal;
  caja: PdvCaja;
  activo: boolean;
  fechaProgramado: Date;

  toInput(): PagoDetalleInput {
    let input = new PagoDetalleInput();
    input.id = this.id;
    input.pagoId = this.pago?.id;
    input.usuarioId = this.usuario?.id;
    input.creadoEn = dateToString(this.creadoEn);
    input.monedaId = this.moneda?.id;
    input.formaPagoId = this.formaPago?.id;
    input.total = this.total;
    input.sucursalId = this.sucursal?.id;
    input.cajaId = this.caja?.id;
    input.activo = this.activo;
    input.fechaProgramado = dateToString(this.fechaProgramado);
    return input;
  }
}

export class PagoDetalleInput {
  id: number;
  pagoId: number;
  usuarioId: number;
  creadoEn: string;
  monedaId: number;
  formaPagoId: number;
  total: number;
  sucursalId: number;
  cajaId: number;
  activo: boolean;
  fechaProgramado: string;
} 