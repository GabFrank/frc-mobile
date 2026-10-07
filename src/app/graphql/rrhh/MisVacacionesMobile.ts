import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { misVacacionesMobileQuery } from './graphql-query';

export interface Response { data: any; }

@Injectable({ providedIn: 'root' })
export class MisVacacionesMobileGQL extends Query<Response> { document = misVacacionesMobileQuery; }
