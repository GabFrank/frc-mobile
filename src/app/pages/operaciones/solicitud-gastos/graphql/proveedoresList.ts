import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { Proveedor } from 'src/app/pages/personas/proveedor/proveedor.model';
import { proveedoresListQuery } from './graphql-query';

export interface ProveedoresListResponse {
  data: Proveedor[];
}

@Injectable({
  providedIn: 'root',
})
export class ProveedoresListGQL extends Query<ProveedoresListResponse, { page?: number; size?: number }> {
  document = proveedoresListQuery;
}
