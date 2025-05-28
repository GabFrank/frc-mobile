import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { productosFaltantesQuery } from './graphql-query';
import { PageInfo } from 'src/app/app.component';
import { ProductoSaldoDto } from '../inventario.model';

export interface Response {
  data: PageInfo<ProductoSaldoDto>;
}

@Injectable({
  providedIn: 'root',
})
export class GetProductosFaltantesGQL extends Query<Response> {
  document = productosFaltantesQuery;
} 