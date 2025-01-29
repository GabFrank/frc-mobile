import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { Proveedor } from '../proveedor.model';
import { proveedoresSearchByPersona, proveedoresSearchByPersonaPage } from './graphql-query';
import { PageInfo } from 'src/app/app.component';

export interface Response {
  data: PageInfo<Proveedor>;
}


@Injectable({
  providedIn: 'root',
})
export class ProveedoresSearchByPersonaPageGQL extends Query<Response> {
  document = proveedoresSearchByPersonaPage;
}
