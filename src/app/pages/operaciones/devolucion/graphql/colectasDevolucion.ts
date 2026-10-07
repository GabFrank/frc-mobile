import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { colectasDevolucionQuery } from './graphql-query';

export interface Response {
  data: any;
}

@Injectable({ providedIn: 'root' })
export class ColectasDevolucionGQL extends Query<Response> {
  document = colectasDevolucionQuery;
}
