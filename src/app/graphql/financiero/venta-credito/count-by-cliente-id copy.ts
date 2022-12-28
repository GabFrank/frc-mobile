import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { Usuario } from 'src/app/domains/personas/usuario.model';
import { VentaCredito } from 'src/app/domains/venta-credito/venta-credito.model';
import { countByClienteAndEstado, ventaCreditoPorClienteQuery } from './graphql-query';

export interface Response {
  data: number;
}

@Injectable({
  providedIn: 'root',
})
export class CountVentaCreditoByClienteAndEstadoGQL extends Query<Response> {
  document = countByClienteAndEstado;
}
