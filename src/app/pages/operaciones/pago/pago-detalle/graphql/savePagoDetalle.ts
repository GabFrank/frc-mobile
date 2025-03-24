import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { PagoDetalle } from '../pago-detalle.model';
import { savePagoDetalleMutation } from './graphql-query';

export interface Response {
  data: PagoDetalle;
}

@Injectable({
  providedIn: 'root',
})
export class SavePagoDetalleGQL extends Mutation<Response> {
  document = savePagoDetalleMutation;
} 