import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { Devolucion } from '../devolucion.model';
import { devolucionByIdQuery } from './graphql-query';

export interface Response {
  data: Devolucion;
}

@Injectable({
  providedIn: 'root',
})
export class DevolucionByIdGQL extends Query<Response> {
  document = devolucionByIdQuery;
}
