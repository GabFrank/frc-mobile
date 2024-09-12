import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { Inventario } from '../inventario.model';
import {
  reabrirInventarioQuery
} from './graphql-query';

@Injectable({
  providedIn: 'root'
})
export class ReabrirInventarioGQL extends Mutation<Inventario> {
  document = reabrirInventarioQuery;
}
