import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { stockPorProductoQuery } from './graphql-query';

export interface StockPorProductoResponse {
  data: number;
}

@Injectable({
  providedIn: 'root',
})
export class GetStockPorProductoGQL extends Query<StockPorProductoResponse> {
  document = stockPorProductoQuery;
}

