import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { Proveedor } from 'src/app/pages/personas/proveedor/proveedor.model';
import { proveedorSearchByPersonaPageQuery } from './graphql-query';

export interface ProveedorPageResponse {
  data: {
    hasNext?: boolean;
    getContent?: Proveedor[];
  };
}

@Injectable({
  providedIn: 'root',
})
export class ProveedorSearchByPersonaPageGQL extends Query<
  ProveedorPageResponse,
  { texto?: string; page?: number; size?: number }
> {
  document = proveedorSearchByPersonaPageQuery;
}
