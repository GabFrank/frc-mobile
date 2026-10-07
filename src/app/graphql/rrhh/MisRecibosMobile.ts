import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { misRecibosMobileQuery } from './graphql-query';

export interface Response { data: any; }

@Injectable({ providedIn: 'root' })
export class MisRecibosMobileGQL extends Query<Response> { document = misRecibosMobileQuery; }
