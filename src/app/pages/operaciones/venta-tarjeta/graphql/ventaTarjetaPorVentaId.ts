import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { VentaTarjeta } from '../venta-tarjeta.model';
import { ventaTarjetaPorVentaIdQuery } from './graphql-query';

export interface Response {
  data: VentaTarjeta;
}

@Injectable({ providedIn: 'root' })
export class VentaTarjetaPorVentaIdGQL extends Query<Response> {
  document = ventaTarjetaPorVentaIdQuery;
}
