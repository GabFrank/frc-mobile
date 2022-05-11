import { Persona } from "./persona.model";

export interface Usuario  {
    id: number;
    persona: Persona;
    email: string;
    password: string;
    nickname: string;
    creadoEn: Date;
    usuarioId: Usuario;
    roles: string[];
    avatar: string;
  }