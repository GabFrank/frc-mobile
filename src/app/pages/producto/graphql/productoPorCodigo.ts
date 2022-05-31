import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { Producto } from 'src/app/domains/productos/producto.model';
import { productoPorCodigoQuery} from './graphql-query';

export interface Response {
  data: Producto;
}

@Injectable({
  providedIn: 'root',
})
export class ProductoPorCodigoGQL extends Query<Response> {
  document = productoPorCodigoQuery;
}
