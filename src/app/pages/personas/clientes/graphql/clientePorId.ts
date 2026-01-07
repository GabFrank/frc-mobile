import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { Cliente } from '../model/cliente.model';
import { clientePorId } from './graphql-query';

export interface Response {
    cliente: Cliente;
}

@Injectable({
    providedIn: 'root',
})
export class ClientePorIdGQL extends Query<Response> {
    document = clientePorId;
}
