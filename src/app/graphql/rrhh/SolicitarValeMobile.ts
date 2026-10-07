import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { solicitarValeMobileMutation } from './graphql-query';

export interface Response { data: any; }

@Injectable({ providedIn: 'root' })
export class SolicitarValeMobileGQL extends Mutation<Response> { document = solicitarValeMobileMutation; }
