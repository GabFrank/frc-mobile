import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { Producto } from 'src/app/domains/productos/producto.model';
import { productosQuery } from './graphql-query';

export interface Response {
  data: Producto[];
}

@Injectable({
  providedIn: 'root',
})
export class AllProductosGQL extends Query<Response> {
  document = productosQuery;
}
