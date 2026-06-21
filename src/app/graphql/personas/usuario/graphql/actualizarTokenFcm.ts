import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { actualizarTokenFcmGQL } from './graphql-query';

export interface ActualizarTokenFcmResponse {
  data: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ActualizarTokenFcmGQL extends Mutation<ActualizarTokenFcmResponse> {
  document = actualizarTokenFcmGQL;
}
