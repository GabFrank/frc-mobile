import { Mutation } from 'apollo-angular';
import { resetearVerificacion } from './pedidos-mutations.graphql';
import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ResetearVerificacionMutation extends Mutation<{ data: boolean }> {
  override document = resetearVerificacion;
}
