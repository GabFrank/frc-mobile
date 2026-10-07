import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { etiquetasSeparadoPdfQuery } from './graphql-query';

export interface Response {
  data: string;
}

@Injectable({
  providedIn: 'root',
})
export class EtiquetasSeparadoPdfGQL extends Query<Response> {
  document = etiquetasSeparadoPdfQuery;
}
