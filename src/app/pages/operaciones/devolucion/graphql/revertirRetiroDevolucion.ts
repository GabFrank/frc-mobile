import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { revertirRetiroDevolucionMutation } from './graphql-query';

export interface Response {
  data: any;
}

@Injectable({ providedIn: 'root' })
export class RevertirRetiroDevolucionGQL extends Mutation<Response> {
  document = revertirRetiroDevolucionMutation;
}
