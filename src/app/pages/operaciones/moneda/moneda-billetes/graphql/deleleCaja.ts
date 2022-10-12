import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { deleteCajaQuery } from '../../../caja/graphql/graphql-query';

@Injectable({
  providedIn: 'root',
})
export class DeleteCajaGQL extends Mutation<boolean> {
  document = deleteCajaQuery;
}
