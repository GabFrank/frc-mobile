import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { incorporarEmbeddingMarcacionQuery } from './graphql-query';

@Injectable({
  providedIn: 'root'
})
export class IncorporarEmbeddingMarcacionGQL extends Mutation<{ data: boolean }> {
  document = incorporarEmbeddingMarcacionQuery;
}
