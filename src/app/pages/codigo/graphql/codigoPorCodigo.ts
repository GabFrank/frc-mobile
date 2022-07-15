import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { Codigo } from 'src/app/domains/productos/codigo.model';
import { codigoPorCodigo } from './graphql-query';


export interface Response {
  data: Codigo[];
}


@Injectable({
  providedIn: 'root',
})
export class CodigoPorCodigoGQL extends Query<Response> {
  document = codigoPorCodigo;
}


