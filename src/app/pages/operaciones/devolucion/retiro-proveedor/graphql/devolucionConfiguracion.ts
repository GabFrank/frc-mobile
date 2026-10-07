import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { devolucionConfiguracionQuery } from './graphql-query';

export interface Response {
  data: { retiroPermitirSeleccionManual: boolean };
}

@Injectable({
  providedIn: 'root',
})
export class DevolucionConfiguracionGQL extends Query<Response> {
  document = devolucionConfiguracionQuery;
}
