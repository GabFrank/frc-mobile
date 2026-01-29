import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { recepcionMercaderiaConFiltrosQuery } from './graphql-query';
import { PageInfo } from 'src/app/app.component';
import { RecepcionMercaderia } from '../recepcion-mercaderia.model';

export interface Response {
  data: PageInfo<RecepcionMercaderia>;
}

@Injectable({
  providedIn: 'root',
})
export class RecepcionMercaderiaConFiltrosGQL extends Query<Response> {
  document = recepcionMercaderiaConFiltrosQuery;
}
