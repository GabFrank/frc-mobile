import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { Producto } from 'src/app/domains/productos/producto.model';
import { saveProducto } from './graphql-query';

export interface Response {
  data: Producto;
}

@Injectable({
  providedIn: 'root',
})
export class SaveProductoGQL extends Mutation<Response> {
  document = saveProducto;
}
