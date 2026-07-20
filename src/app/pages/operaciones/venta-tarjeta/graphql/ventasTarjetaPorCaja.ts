import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { VentaTarjeta } from '../venta-tarjeta.model';
import { ventasTarjetaPorCajaQuery } from './graphql-query';

export interface Response {
  data: VentaTarjeta[];
}

@Injectable({ providedIn: 'root' })
export class VentasTarjetaPorCajaGQL extends Query<Response> {
  document = ventasTarjetaPorCajaQuery;
}
