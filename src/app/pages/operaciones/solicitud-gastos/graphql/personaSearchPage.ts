import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { Persona } from 'src/app/domains/personas/persona.model';
import { personaSearchPageQuery } from './graphql-query';

export interface PersonaPageResponse {
  data: {
    hasNext?: boolean;
    getContent?: Persona[];
  };
}

@Injectable({
  providedIn: 'root',
})
export class PersonaSearchPageGQL extends Query<
  PersonaPageResponse,
  { texto?: string; page?: number; size?: number }
> {
  document = personaSearchPageQuery;
}
