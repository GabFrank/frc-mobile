import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { retirosDevolucionQuery } from './graphql-query';

export interface Response {
  data: any;
}

@Injectable({ providedIn: 'root' })
export class RetirosDevolucionGQL extends Query<Response> {
  document = retirosDevolucionQuery;
}
