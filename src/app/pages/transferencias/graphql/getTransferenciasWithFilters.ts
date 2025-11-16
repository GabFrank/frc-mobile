import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { PageInfo } from 'src/app/app.component';
import { Transferencia } from '../transferencia.model';
import { transferenciasWithFiltersQuery } from './graphql-query';

@Injectable({
  providedIn: 'root'
})
export class GetTransferenciasWithFiltersGQL extends Query<PageInfo<Transferencia>> {
  document = transferenciasWithFiltersQuery;
}

