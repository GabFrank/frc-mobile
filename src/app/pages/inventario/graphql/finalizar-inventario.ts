import { finalizarInventarioQuery } from './graphql-query';
import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { Inventario } from '../inventario.model';

@Injectable({
  providedIn: 'root',
})
export class FinalizarInventarioGQL extends Mutation<Inventario> {
  document = finalizarInventarioQuery;
}
