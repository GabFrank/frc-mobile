import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { ventaCreditoQrAuthQuery } from './graphql-query';

export interface Response {
  data: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class VentaCreditoQrAuthGQL extends Query<Response> {
  document = ventaCreditoQrAuthQuery;
}
