import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { saveUsuarioImageQuery } from './graphql-query';

@Injectable({
  providedIn: 'root'
})
export class SaveUsuarioImageGQL extends Mutation<Boolean> {
  document = saveUsuarioImageQuery;
}
