import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { getUsuarioImagesQuery } from './graphql-query';

@Injectable({
  providedIn: 'root'
})
export class GetUsuarioImagesGQL extends Query<string[]> {
  document = getUsuarioImagesQuery;
}
