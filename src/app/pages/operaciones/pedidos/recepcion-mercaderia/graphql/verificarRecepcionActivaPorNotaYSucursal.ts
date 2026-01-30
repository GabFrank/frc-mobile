import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { verificarRecepcionActivaPorNotaYSucursalQuery } from './graphql-query';
import { RecepcionMercaderia } from '../recepcion-mercaderia.model';

export interface Response {
  data: RecepcionMercaderia;
}

@Injectable({
  providedIn: 'root',
})
export class VerificarRecepcionActivaPorNotaYSucursalGQL extends Query<Response> {
  document = verificarRecepcionActivaPorNotaYSucursalQuery;
}
