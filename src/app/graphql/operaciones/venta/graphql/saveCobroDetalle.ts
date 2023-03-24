import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { saveCobroDetalleQuery } from './graphql-query';

class Response {
  data: any
}

@Injectable({
  providedIn: 'root',
})
export class SaveCobroDetalleGQL extends Mutation<Response> {
  document = saveCobroDetalleQuery;
}
