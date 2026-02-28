import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { MARCAR_NOTIFICACION_LEIDA_MUTATION } from './notificacion-queries';
import { MarcarNotificacionLeidaResponse, MarcarNotificacionLeidaVariables } from '../models/notificacion.model';

@Injectable({
    providedIn: 'root',
})
export class MarcarNotificacionLeidaMutationService extends Mutation<MarcarNotificacionLeidaResponse, MarcarNotificacionLeidaVariables> {
    document = MARCAR_NOTIFICACION_LEIDA_MUTATION;
}
