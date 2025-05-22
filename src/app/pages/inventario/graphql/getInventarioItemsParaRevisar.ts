import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { PageInfo } from 'src/app/app.component';
import { InventarioProductoItem } from '../inventario.model';
import { getInventarioItemsParaRevisarQuery } from './graphql-query';

export interface Response {
  getInventarioItemsParaRevisar: PageInfo<InventarioProductoItem>;
}

@Injectable({
  providedIn: 'root',
})
export class GetInventarioItemsParaRevisarGQL extends Query<Response> {
  document = getInventarioItemsParaRevisarQuery;
} 