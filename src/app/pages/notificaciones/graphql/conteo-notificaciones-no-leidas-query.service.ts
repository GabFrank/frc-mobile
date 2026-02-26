import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { CONTEO_NOTIFICACIONES_NO_LEIDAS_QUERY } from './notificacion-queries';
import { ConteoNotificacionesNoLeidasResponse } from '../models/notificacion.model';

@Injectable({
    providedIn: 'root',
})
export class ConteoNotificacionesNoLeidasQueryService extends Query<ConteoNotificacionesNoLeidasResponse> {
    document = CONTEO_NOTIFICACIONES_NO_LEIDAS_QUERY;
}
