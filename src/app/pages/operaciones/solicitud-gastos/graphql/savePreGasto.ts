import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { savePreGastoMutation } from './graphql-query';

export interface GuardarPreGastoResponse {
  data: {
    id: number;
    descripcion?: string;
    estado?: string;
    creadoEn?: string;
  };
}

@Injectable({
  providedIn: 'root',
})
export class SavePreGastoGQL extends Mutation<GuardarPreGastoResponse> {
  document = savePreGastoMutation;
}
