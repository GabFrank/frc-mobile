import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { devolucionConFiltrosQuery } from './graphql-query';

export interface Response {
  data: any;
}

@Injectable({
  providedIn: 'root',
})
export class DevolucionConFiltrosGQL extends Query<Response> {
  document = devolucionConFiltrosQuery;
}
