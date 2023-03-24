import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { saveVenta } from './graphql-query';
import { Venta } from 'src/app/domains/venta/venta.model';

class Response {
  data: Venta
}

@Injectable({
  providedIn: 'root',
})
export class SaveVentaGQL extends Mutation<Response> {
  document = saveVenta;
}
