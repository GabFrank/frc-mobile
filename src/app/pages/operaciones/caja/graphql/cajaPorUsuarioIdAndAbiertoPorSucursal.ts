import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { PdvCaja } from '../caja.model';
import { cajaAbiertoPorUsuarioIdPorSucursalQuery } from './graphql-query';

export interface Response {
  data: PdvCaja;
}

@Injectable({
  providedIn: 'root',
})
export class CajaPorUsuarioIdAndAbiertoPorSucursalGQL extends Query<Response> {
  document = cajaAbiertoPorUsuarioIdPorSucursalQuery;
}
