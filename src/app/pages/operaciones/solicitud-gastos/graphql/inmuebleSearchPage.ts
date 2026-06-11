import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { Inmueble } from '../models/ente.model';
import { inmuebleSearchPageQuery } from './graphql-query';

export interface InmueblePageResponse {
  data: {
    hasNext?: boolean;
    getContent?: Inmueble[];
  };
}

@Injectable({
  providedIn: 'root',
})
export class InmuebleSearchPageGQL extends Query<
  InmueblePageResponse,
  { texto?: string; page: number; size: number }
> {
  document = inmuebleSearchPageQuery;
}
