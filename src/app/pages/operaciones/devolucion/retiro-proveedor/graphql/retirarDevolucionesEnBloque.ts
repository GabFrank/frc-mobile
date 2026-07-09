import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { RetiroBloqueResultado } from '../retiro-proveedor.model';
import { retirarDevolucionesEnBloqueMutation } from './graphql-query';

export interface Response {
  data: RetiroBloqueResultado;
}

@Injectable({
  providedIn: 'root',
})
export class RetirarDevolucionesEnBloqueGQL extends Mutation<Response> {
  document = retirarDevolucionesEnBloqueMutation;
}
