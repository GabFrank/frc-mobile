import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { saveUsuarioImageQuery } from './graphql-query';

@Injectable({
  providedIn: 'root'
})
export class SaveUsuarioImageGQL extends Query<Boolean> {
  document = saveUsuarioImageQuery;
}
