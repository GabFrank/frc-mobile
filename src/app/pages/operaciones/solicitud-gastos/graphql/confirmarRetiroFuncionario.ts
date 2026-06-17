import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { confirmarRetiroFuncionarioMutation } from './graphql-query';
import { PreGasto } from '../models/pre-gasto.model';

export interface ConfirmarRetiroResponse {
  data: PreGasto;
}

@Injectable({ providedIn: 'root' })
export class ConfirmarRetiroFuncionarioGQL extends Mutation<ConfirmarRetiroResponse> {
  document = confirmarRetiroFuncionarioMutation;
}
