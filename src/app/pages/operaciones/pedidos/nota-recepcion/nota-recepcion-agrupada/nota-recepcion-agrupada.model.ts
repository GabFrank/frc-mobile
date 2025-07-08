import { Sucursal } from 'src/app/domains/empresarial/sucursal/sucursal.model';
import { Usuario } from 'src/app/domains/personas/usuario.model';
import { dateToString } from 'src/app/generic/utils/dateUtils';
import { Proveedor } from 'src/app/pages/personas/proveedor/proveedor.model';
import { Pedido } from 'src/app/pages/operaciones/pedidos/pedido.model';

export class NotaRecepcionAgrupada {
  id: number;
  pedido: Pedido;
  proveedor: Proveedor;
  sucursal: Sucursal;
  creadoEn: Date;
  usuario: Usuario;
  estado: NotaRecepcionAgrupadaEstado;
  cantNotas:number;


  toInput(): NotaRecepcionAgrupadaInput {
    let input = new NotaRecepcionAgrupadaInput();
    input.id = this.id;
    input.pedidoId = this.pedido?.id;
    input.proveedorId = this.proveedor?.id;
    input.sucursalId = this.sucursal?.id;
    input.usuarioId = this.usuario?.id;
    input.creadoEn = dateToString(this.creadoEn);
    input.estado = this.estado;
    return input;
  }
}

export class NotaRecepcionAgrupadaInput {
  id: number;
  pedidoId: number;
  proveedorId: number;
  sucursalId: number;
  creadoEn: string;
  usuarioId: number;
  estado: NotaRecepcionAgrupadaEstado;
}

export enum NotaRecepcionAgrupadaEstado {
  EN_RECEPCION = 'EN_RECEPCION',
  CONCLUIDO = 'CONCLUIDO',
  CANCELADO = 'CANCELADO'
}
