import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { inventarioItemsDeInventariosAnterioresQuery } from './graphql-query';
import { InventarioProductoItem } from '../inventario.model';

@Injectable({
  providedIn: 'root',
})
export class GetInventarioItemsDeInventariosAnterioresGQL extends Query<InventarioProductoItem[]> {
  document = inventarioItemsDeInventariosAnterioresQuery;
}

