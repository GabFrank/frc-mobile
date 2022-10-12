import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { Maletin } from '../maletin.model';
import { saveMaletin } from './graphql-query';

export interface Response {
  data: Maletin;
}

@Injectable({
  providedIn: 'root',
})
export class SaveMaletinGQL extends Mutation<Response> {
  document = saveMaletin;
}
