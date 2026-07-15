import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { remitoRetiroQuery } from './graphql-query';

export interface Response {
  data: string;
}

@Injectable({ providedIn: 'root' })
export class RemitoRetiroGQL extends Query<Response> {
  document = remitoRetiroQuery;
}
