import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { USUARIOS_ACTIVOS_QUERY } from './notificacion-queries';
import { UsuariosActivosResponse } from '../models/notificacion.model';

@Injectable({
    providedIn: 'root',
})
export class UsuariosActivosQueryService extends Query<UsuariosActivosResponse> {
    document = USUARIOS_ACTIVOS_QUERY;
}
