import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { Cliente } from '../model/cliente.model';
import { saveCliente } from './graphql-query';

export interface Response {
    data: Cliente;
}

@Injectable({
    providedIn: 'root',
})
export class SaveClienteGQL extends Mutation<Response> {
    document = saveCliente;
}
