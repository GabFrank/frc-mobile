import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { verificarProductoMobileMutation } from './graphql-query';

export interface Response {
  data: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class VerificarProductoMobileGQL extends Mutation<Response> {
  document = verificarProductoMobileMutation;
}
