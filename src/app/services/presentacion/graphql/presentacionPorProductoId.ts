import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { presentacionPorProductoId } from './graphql-query';
import { Presentacion } from 'src/app/domains/productos/presentacion.model';


export interface Response {
  data: Presentacion[];
}

@Injectable({
  providedIn: 'root',
})
export class PresentacionPorProductoIdGQL extends Query<Response> {
  document = presentacionPorProductoId;
}
