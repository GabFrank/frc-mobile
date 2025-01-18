import { Usuario } from 'src/app/domains/personas/usuario.model';
import { dateToString } from 'src/app/generic/utils/dateUtils';
import { Compra } from '../compra/compra.model';
import { PedidoItem } from '../pedido-item/pedido-item.model';
import { Pedido } from '../pedido.model';
import { Documento } from 'src/app/pages/financiero/documento/documento.model';

export class NotaRecepcion {
  id: number;
  pedido: Pedido;
  compra: Compra;
  documento: Documento;
  tipoBoleta: string;
  valor: number = 0;
  descuento: number;
  pagado: boolean;
  numero: number;
  timbrado: number;
  creadoEn: Date;
  fecha: Date;
  usuario: Usuario;
  pedidoItemList: PedidoItem[] = [];
  cantidadItens: number = 0;
  cantidadItensVerificadoRecepcionMercaderia: number = 0;

  toInput(): NotaRecepcionInput {
    let input = new NotaRecepcionInput();
    input.id = this.id;
    input.numero = this.numero;
    input.pagado = this.pagado;
    input.timbrado = this.timbrado;
    input.valor = this.valor;
    input.descuento = this.descuento;
    input.documentoId = this.documento?.id;
    input.usuarioId = this.usuario?.id;
    input.pedidoId = this.pedido?.id;
    input.compraId = this.compra?.id;
    input.tipoBoleta = this.tipoBoleta;
    input.fecha = dateToString(this.fecha);
    input.creadoEn = dateToString(this.creadoEn);
    return input;
  }
}

export class NotaRecepcionInput {
  id: number;
  pedidoId: number;
  compraId: number;
  documentoId: number;
  tipoBoleta: string;
  valor: number;
  descuento: number;
  pagado: boolean;
  numero: number;
  timbrado: number;
  creadoEn: string;
  fecha: string;
  usuarioId: number;
}
