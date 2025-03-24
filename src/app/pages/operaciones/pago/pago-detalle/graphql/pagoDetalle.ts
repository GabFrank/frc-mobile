import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { PagoDetalle } from '../pago-detalle.model';
import { pagoDetalleQuery } from './graphql-query';

export interface Response {
  data: PagoDetalle;
}

@Injectable({
  providedIn: 'root',
})
export class PagoDetalleGQL extends Query<Response> {
  document = pagoDetalleQuery;
} 