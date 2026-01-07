import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { Cliente } from '../model/cliente.model';
import { clientePorPersona } from './graphql-query';

export interface Response {
    cliente: Cliente[];
}

@Injectable({
    providedIn: 'root',
})
export class ClienteSearchByPersonaGQL extends Query<Response> {
    document = clientePorPersona;
}
