import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { CrearComentarioNotificacionResponse, CrearComentarioNotificacionVariables } from '../models/comentarios-notificacion-request.model';
import { CREAR_COMENTARIO_NOTIFICACION_MUTATION } from './notificacion-queries';

@Injectable({
    providedIn: 'root',
})
export class CrearComentarioNotificacionMutationService extends Mutation<CrearComentarioNotificacionResponse, CrearComentarioNotificacionVariables> {
    document = CREAR_COMENTARIO_NOTIFICACION_MUTATION;
}
