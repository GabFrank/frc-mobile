import { Persona } from './persona.model';

export interface Usuario {
    id: number;
    nickname: string;
    persona?: Persona;
}
