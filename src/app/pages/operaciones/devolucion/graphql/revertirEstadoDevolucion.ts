import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { revertirEstadoDevolucionMutation } from './graphql-query';

export interface Response {
  data: { id: number; estado: string };
}

@Injectable({
  providedIn: 'root',
})
export class RevertirEstadoDevolucionGQL extends Mutation<Response> {
  document = revertirEstadoDevolucionMutation;
}
