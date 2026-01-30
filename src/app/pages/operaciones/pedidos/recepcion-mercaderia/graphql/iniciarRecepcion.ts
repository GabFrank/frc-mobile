import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { iniciarRecepcionMutation } from './graphql-query';
import { RecepcionMercaderia } from '../recepcion-mercaderia.model';

export interface Response {
  data: RecepcionMercaderia;
}

@Injectable({
  providedIn: 'root',
})
export class IniciarRecepcionGQL extends Mutation<Response> {
  document = iniciarRecepcionMutation;
}
