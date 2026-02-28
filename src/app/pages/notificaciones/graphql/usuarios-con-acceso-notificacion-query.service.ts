import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { UsuariosConAccesoNotificacionResponse, UsuariosConAccesoNotificacionVariables } from '../models/usuarios-con-acceso-notificacion-request.model';
import { USUARIOS_CON_ACCESO_NOTIFICACION_QUERY } from './notificacion-queries';

@Injectable({
    providedIn: 'root',
})
export class UsuariosConAccesoNotificacionQueryService extends Query<UsuariosConAccesoNotificacionResponse, UsuariosConAccesoNotificacionVariables> {
    document = USUARIOS_CON_ACCESO_NOTIFICACION_QUERY;
}
