import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { ventasPorCajaIdQuery } from './graphql-query';
import { Venta } from 'src/app/domains/venta/venta.model';

class Response {
  data: Venta[]
}

@Injectable({
  providedIn: 'root',
})
export class VentaPorCajaIdGQL extends Query<Response> {
  document = ventasPorCajaIdQuery;
}
