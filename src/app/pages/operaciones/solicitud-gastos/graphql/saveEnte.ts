import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { Ente, TipoEnte } from '../models/ente.model';
import { saveEnteMutation } from './graphql-query';

export interface SaveEnteInput {
  tipoEnte: TipoEnte;
  referenciaId: number;
  activo: boolean;
  usuarioId?: number;
}

export interface SaveEnteResponse {
  data: Ente;
}

@Injectable({
  providedIn: 'root',
})
export class SaveEnteGQL extends Mutation<SaveEnteResponse, { entity: SaveEnteInput }> {
  document = saveEnteMutation;
}
