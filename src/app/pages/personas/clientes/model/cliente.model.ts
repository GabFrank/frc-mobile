import { Sucursal } from "src/app/domains/empresarial/sucursal/sucursal.model";
import { Persona } from "src/app/domains/personas/persona.model";
import { Usuario } from "src/app/domains/personas/usuario.model";

export enum TipoCliente {
    NORMAL = 'NORMAL',
    ASOCIADO = 'ASOCIADO',
    CONVENIADO = 'CONVENIADO',
    FUNCIONARIO = 'FUNCIONARIO',
    VIP = 'VIP'
}

export interface Cliente {
    id: number;
    tipo: TipoCliente;
    credito: number;
    codigo: string;
    persona: Persona;
    sucursal: Sucursal;
    usuario: Usuario;
    creadoEn: Date;
    tributa: boolean;
    verificadoSet: boolean;
}

export interface ClienteInput {
    id?: number;
    tipo?: TipoCliente;
    personaId?: number;
    nombre?: string;
    credito?: number;
    creadoEn?: Date;
    direccion?: string;
    usuarioId?: number;
    documento?: string;
    saldo?: number;
    codigo?: string;
    sucursalId?: number;
    tributa?: boolean;
    verificadoSet?: boolean;
}

export interface PersonaInput {
    id?: number;
    nombre?: string;
    apodo?: string;
    documento?: string;
    nacimiento?: string;
    sexo?: string;
    direccion?: string;
    email?: string;
    ciudadId?: number;
    telefono?: string;
    socialMedia?: string;
    imagenes?: string;
    creadoEn?: Date;
    usuarioId?: number;
    isFuncionario?: boolean;
    isCliente?: boolean;
    isProveedor?: boolean;
}
