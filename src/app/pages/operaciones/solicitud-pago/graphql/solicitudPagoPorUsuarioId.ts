import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { SolicitudPago } from '../solicitud-pago.model';
import { solicitudPagoPorUsuarioIdQuery } from './graphql-query';

export interface Response {
  data: SolicitudPago[];
}

@Injectable({
  providedIn: 'root',
})
export class SolicitudPagoPorUsuarioIdGQL extends Query<Response> {
  document = solicitudPagoPorUsuarioIdQuery;
} 