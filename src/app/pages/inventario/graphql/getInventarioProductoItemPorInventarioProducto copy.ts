import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { inventarioProItemPorInventarioProQuery, inventarioQuery } from './graphql-query';
import { Inventario, InventarioProductoItem } from '../inventario.model';



@Injectable({
  providedIn: 'root',
})
export class GetInventarioItemPorInvetarioProductoGQL extends Query<InventarioProductoItem[]> {
  document = inventarioProItemPorInventarioProQuery;
}
