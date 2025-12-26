import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { NotificacionesUsuarioResponse, NotificacionesUsuarioVariables } from '../models/notificacion.model';
import { NOTIFICACIONES_USUARIO_QUERY } from './notificacion-queries';

@Injectable({
    providedIn: 'root',
})
export class NotificacionesUsuarioQueryService extends Query<NotificacionesUsuarioResponse, NotificacionesUsuarioVariables> {
    document = NOTIFICACIONES_USUARIO_QUERY;
}
