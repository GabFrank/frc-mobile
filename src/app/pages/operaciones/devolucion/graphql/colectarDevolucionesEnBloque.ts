import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { colectarDevolucionesEnBloqueMutation } from './graphql-query';

export interface Response {
  data: { resultados: { id: number; ok: boolean; mensaje: string }[] };
}

@Injectable({
  providedIn: 'root',
})
export class ColectarDevolucionesEnBloqueGQL extends Mutation<Response> {
  document = colectarDevolucionesEnBloqueMutation;
}
