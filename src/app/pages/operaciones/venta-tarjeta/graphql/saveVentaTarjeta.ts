import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { VentaTarjeta } from '../venta-tarjeta.model';
import { saveVentaTarjetaMutation } from './graphql-query';

export interface Response {
  data: VentaTarjeta;
}

@Injectable({ providedIn: 'root' })
export class SaveVentaTarjetaGQL extends Mutation<Response> {
  document = saveVentaTarjetaMutation;
}
