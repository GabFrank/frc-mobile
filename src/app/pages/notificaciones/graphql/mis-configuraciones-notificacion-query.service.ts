import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { MisConfiguracionesNotificacionResponse } from '../models/notificacion.model';
import { MIS_CONFIGURACIONES_NOTIFICACION_QUERY } from './notificacion-queries';

@Injectable({
    providedIn: 'root',
})
export class MisConfiguracionesNotificacionQueryService extends Query<MisConfiguracionesNotificacionResponse> {
    document = MIS_CONFIGURACIONES_NOTIFICACION_QUERY;
}
