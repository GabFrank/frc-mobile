import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { PreRegistroFuncionario } from '../funcionario.model';
import { preRegistroFuncionariosQuery } from './graphql-query';

export interface Response {
  data: PreRegistroFuncionario[];
}

@Injectable({
  providedIn: 'root',
})
export class PreRegistroFuncionarioesGQL extends Query<PreRegistroFuncionario[]> {
  document = preRegistroFuncionariosQuery;
}
