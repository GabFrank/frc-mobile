import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { PdvCaja } from '../caja.model';
import { savePdvCajaPorSucursal } from './graphql-query';

export interface Response {
  data: PdvCaja;
}

@Injectable({
  providedIn: 'root',
})
export class SaveCajaPorSucursalGQL extends Mutation<Response> {
  document = savePdvCajaPorSucursal;
}
