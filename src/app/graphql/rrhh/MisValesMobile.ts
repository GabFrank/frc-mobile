import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { misValesMobileQuery } from './graphql-query';

export interface Response { data: any; }

@Injectable({ providedIn: 'root' })
export class MisValesMobileGQL extends Query<Response> { document = misValesMobileQuery; }
