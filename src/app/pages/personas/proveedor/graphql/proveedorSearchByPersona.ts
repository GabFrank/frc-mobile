import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { Proveedor } from '../proveedor.model';
import { proveedoresSearchByPersona } from './graphql-query';

export interface Response {
  data: Proveedor[];
}


@Injectable({
  providedIn: 'root',
})
export class ProveedoresSearchByPersonaGQL extends Query<Response> {
  document = proveedoresSearchByPersona;
}
