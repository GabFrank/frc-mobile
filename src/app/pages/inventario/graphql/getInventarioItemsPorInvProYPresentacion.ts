import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { inventarioItemsPorInvProYPresentacionQuery } from './graphql-query';
import { InventarioProductoItem } from '../inventario.model';

@Injectable({
  providedIn: 'root',
})
export class GetInventarioItemsPorInvProYPresentacionGQL extends Query<InventarioProductoItem[]> {
  document = inventarioItemsPorInvProYPresentacionQuery;
}


