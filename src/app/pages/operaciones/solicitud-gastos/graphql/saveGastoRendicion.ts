import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { saveGastoRendicionMutation } from './graphql-query';
import { GastoRendicion } from '../models/pre-gasto.model';

export interface SaveGastoRendicionResponse {
  data: GastoRendicion;
}

@Injectable({ providedIn: 'root' })
export class SaveGastoRendicionGQL extends Mutation<SaveGastoRendicionResponse> {
  document = saveGastoRendicionMutation;
}
