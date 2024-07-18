import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { isUserFaceAuthQuery } from './graphql-query';

@Injectable({
  providedIn: 'root'
})
export class IsUserFaceAuthGQL extends Query<Boolean> {
  document = isUserFaceAuthQuery;
}
