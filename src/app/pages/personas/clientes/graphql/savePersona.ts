import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { Persona } from 'src/app/domains/personas/persona.model';
import { savePersona } from './graphql-query';

export interface Response {
    data: Persona;
}

@Injectable({
    providedIn: 'root',
})
export class SavePersonaGQL extends Mutation<Response> {
    document = savePersona;
}
