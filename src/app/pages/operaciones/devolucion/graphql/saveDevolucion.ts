import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { Devolucion } from '../devolucion.model';
import { saveDevolucionMutation } from './graphql-query';

export interface Response {
  data: Devolucion;
}

@Injectable({
  providedIn: 'root',
})
export class SaveDevolucionGQL extends Mutation<Response> {
  document = saveDevolucionMutation;
}
