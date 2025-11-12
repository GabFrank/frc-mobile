import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { iniciarRecepcion } from './pedidos-mutations.graphql';
import { RecepcionMercaderia } from '../../../../domains/operaciones/pedido/recepcion-mercaderia.model';

export interface IniciarRecepcionInput {
  sucursalId: number;
  notaRecepcionIds: number[];
  proveedorId: number;
  monedaId: number;
  usuarioId: number;
  cotizacion?: number;
}

@Injectable({ providedIn: 'root' })
export class IniciarRecepcionMutation extends Mutation<{ data: RecepcionMercaderia }> {
  override document = iniciarRecepcion;
} 