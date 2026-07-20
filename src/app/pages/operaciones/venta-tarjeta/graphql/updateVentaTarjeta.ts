import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { VentaTarjeta } from '../venta-tarjeta.model';
import { updateVentaTarjetaMutation } from './graphql-query';

export interface Response {
  data: VentaTarjeta;
}

@Injectable({ providedIn: 'root' })
export class UpdateVentaTarjetaGQL extends Mutation<Response> {
  document = updateVentaTarjetaMutation;
}
