import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { saveImagenProductoQuery } from './graphql-query';

@Injectable({
  providedIn: 'root',
})
export class SaveImagenProductoGQL extends Mutation<boolean> {
  document = saveImagenProductoQuery;
}
