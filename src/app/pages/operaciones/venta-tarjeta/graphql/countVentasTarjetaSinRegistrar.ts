import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { countVentasTarjetaSinRegistrarQuery } from './graphql-query';

export interface Response {
  data: number;
}

@Injectable({ providedIn: 'root' })
export class CountVentasTarjetaSinRegistrarGQL extends Query<Response> {
  document = countVentasTarjetaSinRegistrarQuery;
}
