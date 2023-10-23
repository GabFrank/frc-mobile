import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { Transferencia, TransferenciaItem } from '../transferencia.model';
import { transferenciaItemPorTransferenciaIdQuery, transferenciaQuery } from './graphql-query';
import { PageInfo } from 'src/app/app.component';

@Injectable({
  providedIn: 'root',
})
export class GetTransferenciaItensPorTransferenciaIdGQL extends Query<PageInfo<TransferenciaItem>> {
  document = transferenciaItemPorTransferenciaIdQuery;
}
