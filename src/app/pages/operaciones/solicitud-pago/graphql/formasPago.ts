import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import gql from 'graphql-tag';
import { FormaPago } from 'src/app/domains/forma-pago/forma-pago.model';

const formasPagoQuery = gql`
  query formasPago($page: Int, $size: Int) {
    data: formasPago(page: $page, size: $size) {
      id
      descripcion
    }
  }
`;

export interface FormasPagoResponse {
  data: FormaPago[];
}

@Injectable({
  providedIn: 'root',
})
export class FormasPagoGQL extends Query<FormasPagoResponse, { page?: number; size?: number }> {
  document = formasPagoQuery;
}
