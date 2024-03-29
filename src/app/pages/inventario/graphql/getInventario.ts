import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { inventarioQuery } from './graphql-query';
import { Inventario } from '../inventario.model';



@Injectable({
  providedIn: 'root',
})
export class GetInventarioGQL extends Query<Inventario> {
  document = inventarioQuery;
}
