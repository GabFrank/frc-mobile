import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { recepcionMercaderiaPorIdQuery } from './graphql-query';
import { RecepcionMercaderia } from '../recepcion-mercaderia.model';

export interface Response {
  data: RecepcionMercaderia;
}

@Injectable({
  providedIn: 'root',
})
export class RecepcionMercaderiaPorIdGQL extends Query<Response> {
  document = recepcionMercaderiaPorIdQuery;
}
