import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { ENVIAR_NOTIFICACION_PERSONALIZADA_MUTATION } from './notificacion-queries';
import { EnviarNotificacionPersonalizadaResponse, EnviarNotificacionPersonalizadaVariables } from '../models/notificacion.model';

@Injectable({
    providedIn: 'root',
})
export class EnviarNotificacionPersonalizadaMutationService extends Mutation<EnviarNotificacionPersonalizadaResponse, EnviarNotificacionPersonalizadaVariables> {
    document = ENVIAR_NOTIFICACION_PERSONALIZADA_MUTATION;
}
