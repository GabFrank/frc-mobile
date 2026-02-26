import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { ComentariosNotificacionResponse, ComentariosNotificacionVariables } from '../models/comentarios-notificacion-request.model';
import { COMENTARIOS_NOTIFICACION_QUERY } from './notificacion-queries';

@Injectable({
    providedIn: 'root',
})
export class ComentariosNotificacionQueryService extends Query<ComentariosNotificacionResponse, ComentariosNotificacionVariables> {
    document = COMENTARIOS_NOTIFICACION_QUERY;
}
