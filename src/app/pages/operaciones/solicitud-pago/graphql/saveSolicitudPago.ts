import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { SolicitudPago } from '../solicitud-pago.model';
import { saveSolicitudPagoMutation } from './graphql-query';

export interface Response {
  data: SolicitudPago;
}

@Injectable({
  providedIn: 'root',
})
export class SaveSolicitudPagoGQL extends Mutation<Response> {
  document = saveSolicitudPagoMutation;
} 