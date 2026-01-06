import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import gql from 'graphql-tag';

@Injectable({
    providedIn: 'root',
})
export class CountVentaCreditoGQL extends Query<any> {
    override document = gql`
    query {
      data: countVentaCredito
    }
  `;
}
