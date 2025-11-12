import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { cancelarRechazo } from './pedidos-mutations.graphql';

@Injectable({ providedIn: 'root' })
export class CancelarRechazoMutation extends Mutation<{ data: boolean }> {
  override document = cancelarRechazo;
} 