import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { SolicitudPago } from '../solicitud-pago.model';
import { solicitudPagoQuery } from './graphql-query';

export interface Response {
  data: SolicitudPago;
}

@Injectable({
  providedIn: 'root',
})
export class SolicitudPagoGQL extends Query<Response> {
  document = solicitudPagoQuery;
} 