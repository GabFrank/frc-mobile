import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { imprimirTransferencia } from './graphql-query';

@Injectable({
    providedIn: 'root',
})
export class ImprimirTransferenciaGQL extends Query<any> {
    document = imprimirTransferencia;
}
