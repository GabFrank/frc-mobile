import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { vacacionesPendientesAprobacionMobileQuery } from './graphql-query';

export interface Response { data: any; }

@Injectable({ providedIn: 'root' })
export class VacacionesPendientesAprobacionMobileGQL extends Query<Response> { document = vacacionesPendientesAprobacionMobileQuery; }
