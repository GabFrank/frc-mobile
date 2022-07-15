import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { Producto } from 'src/app/domains/productos/producto.model';
import { productoPorCodigoQuery, productoStock} from './graphql-query';

export interface Response {
  data: number;
}

@Injectable({
  providedIn: 'root',
})
export class ProductoStockBySucursalGQL extends Query<Response> {
  document = productoStock;
}
