import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { Cliente } from 'src/app/domains/cliente/cliente.model';
import { clientesSearchByPersona } from './graphql-query';

export interface Response {
  data: Cliente[];
}


@Injectable({
  providedIn: 'root',
})
export class ClientesSearchByPersonaGQL extends Query<Response> {
  document = clientesSearchByPersona;
}
