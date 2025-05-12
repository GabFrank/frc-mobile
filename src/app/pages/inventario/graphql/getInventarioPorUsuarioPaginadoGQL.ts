import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { inventarioPorUsuarioPaginadoQuery } from './graphql-query'; // Importar la query
import { PageInfo } from 'src/app/app.component'; // Ajusta la ruta si es necesario
import { Inventario } from '../inventario.model'; // Ajusta la ruta si es necesario

export interface Response {
  data: PageInfo<Inventario>; // La query tiene el alias 'data'
}

@Injectable({
  providedIn: 'root',
})
export class GetInventarioPorUsuarioPaginadoGQL extends Query<Response> {
  document = inventarioPorUsuarioPaginadoQuery;
} 