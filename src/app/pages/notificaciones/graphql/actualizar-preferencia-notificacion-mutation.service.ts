import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { ActualizarPreferenciaNotificacionResponse, ActualizarPreferenciaNotificacionVariables } from '../models/notificacion.model';
import { ACTUALIZAR_PREFERENCIA_NOTIFICACION_MUTATION } from './notificacion-queries';

@Injectable({
    providedIn: 'root',
})
export class ActualizarPreferenciaNotificacionMutationService extends Mutation<ActualizarPreferenciaNotificacionResponse, ActualizarPreferenciaNotificacionVariables> {
    document = ACTUALIZAR_PREFERENCIA_NOTIFICACION_MUTATION;
}
