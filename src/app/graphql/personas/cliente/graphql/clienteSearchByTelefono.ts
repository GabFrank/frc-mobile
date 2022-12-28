import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { Cliente } from 'src/app/domains/cliente/cliente.model';
import { clientesSearchByTelefono } from './graphql-query';

export interface Response {
  data: Cliente[];
}


@Injectable({
  providedIn: 'root',
})
export class ClientesSearchByTelefonoGQL extends Query<Response> {
  document = clientesSearchByTelefono;
}
