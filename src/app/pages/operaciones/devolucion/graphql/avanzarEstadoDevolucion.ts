import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { Devolucion } from '../devolucion.model';
import { avanzarEstadoDevolucionMutation } from './graphql-query';

export interface Response {
  data: Devolucion;
}

@Injectable({
  providedIn: 'root',
})
export class AvanzarEstadoDevolucionGQL extends Mutation<Response> {
  document = avanzarEstadoDevolucionMutation;
}
