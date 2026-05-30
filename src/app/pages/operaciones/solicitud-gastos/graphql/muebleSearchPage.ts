import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { Mueble } from '../models/ente.model';
import { muebleSearchPageQuery } from './graphql-query';

export interface MueblePageResponse {
  data: {
    hasNext?: boolean;
    getContent?: Mueble[];
  };
}

@Injectable({
  providedIn: 'root',
})
export class MuebleSearchPageGQL extends Query<
  MueblePageResponse,
  { texto?: string; page: number; size: number }
> {
  document = muebleSearchPageQuery;
}
