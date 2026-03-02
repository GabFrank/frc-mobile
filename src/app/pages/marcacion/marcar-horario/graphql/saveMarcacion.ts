import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import gql from 'graphql-tag';
import { Marcacion } from '../models/marcacion.model';

@Injectable({
  providedIn: 'root',
})
export class SaveMarcacionGQL extends Mutation<{ data: Marcacion }> {
  document = gql`
    mutation saveMarcacion($entity: MarcacionInput!, $sucId: ID) {
      data: saveMarcacion(marcacion: $entity) {
        id
        sucursalId
        tipo
        fechaEntrada
        fechaSalida
        esSalidaAlmuerzo
      }
    }
  `;
}
