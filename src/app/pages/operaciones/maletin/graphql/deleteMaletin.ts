import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { Maletin } from '../maletin.model';
import { deleteMaletinQuery } from './graphql-query';

export interface Response {
  data: Maletin;
}

@Injectable({
  providedIn: 'root',
})
export class DeleteMaletinGQL extends Mutation<boolean> {
  document = deleteMaletinQuery;
}
