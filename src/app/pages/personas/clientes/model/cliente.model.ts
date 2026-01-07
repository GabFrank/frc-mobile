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
    credito?: number;
    codigo?: string;
    sucursalId?: number;
    personaId?: number;
    usuarioId?: number;
    direccion?: string;
    nombre?: string;
    tributa?: boolean;
    verificadoSet?: boolean;
    documento?: string;
}
