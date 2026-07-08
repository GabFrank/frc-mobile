import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { MotivoAveria } from '../devolucion.model';
import { motivosAveriaActivosQuery } from './graphql-query';

export interface Response {
  data: MotivoAveria[];
}

@Injectable({
  providedIn: 'root',
})
export class MotivosAveriaActivosGQL extends Query<Response> {
  document = motivosAveriaActivosQuery;
}
