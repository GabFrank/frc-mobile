import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { MARCAR_TODAS_NOTIFICACIONES_LEIDAS_MUTATION } from './notificacion-queries';
import { MarcarTodasNotificacionesLeidasResponse } from '../models/notificacion.model';

@Injectable({
    providedIn: 'root',
})
export class MarcarTodasNotificacionesLeidasMutationService extends Mutation<MarcarTodasNotificacionesLeidasResponse> {
    document = MARCAR_TODAS_NOTIFICACIONES_LEIDAS_MUTATION;
}
