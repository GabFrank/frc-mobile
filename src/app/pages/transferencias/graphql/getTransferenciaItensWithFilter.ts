import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { PageInfo } from 'src/app/app.component';
import { TransferenciaItem } from '../transferencia.model';
import { transferenciaItemPorTransferenciaIdWithFilterQuery } from './graphql-query';

@Injectable({
  providedIn: 'root'
})
export class GetTransferenciaItensWithFilterGQL extends Query<PageInfo<TransferenciaItem>> {
  document = transferenciaItemPorTransferenciaIdWithFilterQuery;
}
