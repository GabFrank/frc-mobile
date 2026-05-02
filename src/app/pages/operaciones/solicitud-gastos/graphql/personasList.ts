import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { Persona } from 'src/app/domains/personas/persona.model';
import { personasListQuery } from './graphql-query';

export interface PersonasListResponse {
  data: Persona[];
}

@Injectable({
  providedIn: 'root',
})
export class PersonasListGQL extends Query<PersonasListResponse, { page?: number; size?: number }> {
  document = personasListQuery;
}
