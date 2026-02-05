import { RecepcionMercaderia } from './recepcion-mercaderia.model';
import { Producto } from 'src/app/domains/productos/producto.model';
import { Presentacion } from 'src/app/domains/productos/presentacion.model';
import { Sucursal } from 'src/app/domains/empresarial/sucursal/sucursal.model';
import { Usuario } from 'src/app/domains/personas/usuario.model';
import { dateToString } from 'src/app/generic/utils/dateUtils';

// Tipos básicos para referencias (se pueden expandir si es necesario)
export interface NotaRecepcionItem {
  id: number;
  producto: Producto;
}

export interface NotaRecepcionItemDistribucion {
  id: number;
}

export class RecepcionMercaderiaItem {
  id: number;
  recepcionMercaderia: RecepcionMercaderia;
  notaRecepcionItem: NotaRecepcionItem;
  notaRecepcionItemDistribucion: NotaRecepcionItemDistribucion;
  producto: Producto;
  presentacionRecibida: Presentacion;
  sucursalEntrega: Sucursal;
  usuario: Usuario;
  cantidadRecibida: number;
  cantidadRechazada: number;
  vencimientoRecibido: Date;
  lote: string;
  esBonificacion: boolean;
  motivoRechazo: string;
  observaciones: string;
  metodoVerificacion: MetodoVerificacion;
  motivoVerificacionManual: MotivoVerificacionManual;
  estadoVerificacion: EstadoVerificacion;

  toInput(): RecepcionMercaderiaItemInput {
    let input = new RecepcionMercaderiaItemInput();
    input.id = this.id;
    input.recepcionMercaderiaId = this.recepcionMercaderia?.id;
    input.notaRecepcionItemId = this.notaRecepcionItem?.id;
    input.notaRecepcionItemDistribucionId = this.notaRecepcionItemDistribucion?.id;
    input.productoId = this.producto?.id;
    input.presentacionRecibidaId = this.presentacionRecibida?.id;
    input.sucursalEntregaId = this.sucursalEntrega?.id;
    input.usuarioId = this.usuario?.id;
    input.cantidadRecibida = this.cantidadRecibida;
    input.cantidadRechazada = this.cantidadRechazada;
    input.vencimientoRecibido = dateToString(this.vencimientoRecibido);
    input.lote = this.lote;
    input.esBonificacion = this.esBonificacion;
    input.motivoRechazo = this.motivoRechazo;
    input.observaciones = this.observaciones;
    input.metodoVerificacion = this.metodoVerificacion;
    input.motivoVerificacionManual = this.motivoVerificacionManual;
    input.estadoVerificacion = this.estadoVerificacion;
    return input;
  }
}

export class RecepcionMercaderiaItemInput {
  id: number;
  recepcionMercaderiaId: number;
  notaRecepcionItemId: number;
  notaRecepcionItemDistribucionId: number;
  productoId: number;
  presentacionRecibidaId: number;
  sucursalEntregaId: number;
  usuarioId: number;
  cantidadRecibida: number;
  cantidadRechazada: number;
  vencimientoRecibido: string;
  lote: string;
  esBonificacion: boolean;
  motivoRechazo: string;
  observaciones: string;
  metodoVerificacion: MetodoVerificacion;
  motivoVerificacionManual: MotivoVerificacionManual;
  estadoVerificacion: EstadoVerificacion;
  variaciones: RecepcionMercaderiaItemVariacionInput[];
}

export class RecepcionMercaderiaItemVariacionInput {
  presentacionId: number;
  cantidad: number;
  vencimiento: string;
  lote: string;
  rechazado: boolean;
  motivoRechazo: string;
}

export enum MetodoVerificacion {
  ESCANER = 'ESCANER',
  MANUAL = 'MANUAL'
}

export enum MotivoVerificacionManual {
  CODIGO_ILEGIBLE = 'CODIGO_ILEGIBLE',
  PRODUCTO_SIN_CODIGO = 'PRODUCTO_SIN_CODIGO'
}

export enum EstadoVerificacion {
  PENDIENTE = 'PENDIENTE',
  VERIFICADO = 'VERIFICADO',
  VERIFICADO_CON_DIFERENCIA = 'VERIFICADO_CON_DIFERENCIA',
  RECHAZADO = 'RECHAZADO'
}

export enum MotivoRechazoFisico {
  PRODUCTO_DANADO = 'PRODUCTO_DANADO',
  PRODUCTO_VENCIDO = 'PRODUCTO_VENCIDO',
  CANTIDAD_INCORRECTA = 'CANTIDAD_INCORRECTA',
  PRODUCTO_DIFERENTE = 'PRODUCTO_DIFERENTE',
  EMBALAJE_DANADO = 'EMBALAJE_DANADO'
}

export const MotivoRechazoFisicoLabels: { [key in MotivoRechazoFisico]: string } = {
  [MotivoRechazoFisico.PRODUCTO_DANADO]: 'Producto Dañado',
  [MotivoRechazoFisico.PRODUCTO_VENCIDO]: 'Producto Vencido',
  [MotivoRechazoFisico.CANTIDAD_INCORRECTA]: 'Cantidad Incorrecta',
  [MotivoRechazoFisico.PRODUCTO_DIFERENTE]: 'Producto Diferente',
  [MotivoRechazoFisico.EMBALAJE_DANADO]: 'Embalaje Dañado'
};
