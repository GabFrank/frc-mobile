import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { SolicitudPagoPage } from '../solicitud-pago.model';
import { solicitudesPagoPaginatedQuery } from './graphql-query';

export interface SolicitudesPagoPaginatedVariables {
  page?: number;
  size?: number;
  proveedorId?: number;
  estado?: string;
}

export interface SolicitudesPagoPaginatedResponse {
  data: SolicitudPagoPage;
}

@Injectable({
  providedIn: 'root',
})
export class SolicitudesPagoPaginatedGQL extends Query<SolicitudesPagoPaginatedResponse, SolicitudesPagoPaginatedVariables> {
  document = solicitudesPagoPaginatedQuery;
}
