import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { ventaTarjetaPorIdQuery } from './graphql-query';

@Injectable({ providedIn: 'root' })
export class VentaTarjetaPorIdGQL extends Query<any> {
  document = ventaTarjetaPorIdQuery;
}
