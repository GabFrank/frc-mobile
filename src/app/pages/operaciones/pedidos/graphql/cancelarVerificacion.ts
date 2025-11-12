import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { cancelarVerificacion } from './pedidos-mutations.graphql';

@Injectable({ providedIn: 'root' })
export class CancelarVerificacionMutation extends Mutation<{ data: boolean }> {
  override document = cancelarVerificacion;
} 