import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { finalizarRecepcion } from './pedidos-mutations.graphql';

export interface ConstanciaDeRecepcion {
  id: number;
  codigoVerificacion: string;
  fechaEmision: Date;
  estado: string;
}

@Injectable({ providedIn: 'root' })
export class FinalizarRecepcionMutation extends Mutation<{ data: ConstanciaDeRecepcion }> {
  override document = finalizarRecepcion;
} 