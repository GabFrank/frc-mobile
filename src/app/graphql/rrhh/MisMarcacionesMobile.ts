import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { misMarcacionesMobileQuery } from './graphql-query';

export interface Response { data: any; }

@Injectable({ providedIn: 'root' })
export class MisMarcacionesMobileGQL extends Query<Response> { document = misMarcacionesMobileQuery; }
