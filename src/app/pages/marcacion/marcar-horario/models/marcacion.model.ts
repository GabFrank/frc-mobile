import { Sucursal } from '../../../../domains/empresarial/sucursal/sucursal.model';
import { Usuario } from '../../../../domains/personas/usuario.model';

export enum TipoMarcacion {
    ENTRADA = 'ENTRADA',
    SALIDA = 'SALIDA'
}

export class Marcacion {
    id: number;
    sucursalId: number;
    usuario: Usuario;
    tipo: TipoMarcacion;
    latitud: number;
    longitud: number;
    precisionGps: number;
    distanciaSucursalMetros: number;
    deviceId: string;
    deviceInfo: string;
    sucursalEntrada: Sucursal;
    fechaEntrada: Date;
    sucursalSalida: Sucursal;
    fechaSalida: Date;
    presencial: boolean;
    autorizacion: number;
    codigo: string;
    esSalidaAlmuerzo: boolean;
}

export class MarcacionInput {
    id?: number;
    sucursalId?: number;
    usuarioId: number;
    tipo: TipoMarcacion;
    latitud?: number;
    longitud?: number;
    precisionGps?: number;
    distanciaSucursalMetros?: number;
    deviceId?: string;
    deviceInfo?: string;
    sucursalEntradaId?: number;
    fechaEntrada?: string;
    sucursalSalidaId?: number;
    fechaSalida?: string;
    codigo?: string;
    embedding?: number[];
    esSalidaAlmuerzo?: boolean;
}
export enum EstadoJornada {
    NORMAL = 'NORMAL',
    INCOMPLETO = 'INCOMPLETO',
    AUSENTE = 'AUSENTE'
}

export class Jornada {
    id: number;
    sucursalId: number;
    usuario: Usuario;
    fecha: string;

    marcacionEntrada: Marcacion;
    marcacionSalidaAlmuerzo: Marcacion;
    marcacionEntradaAlmuerzo: Marcacion;
    marcacionSalida: Marcacion;

    minutosTrabajados: number;
    minutosExtras: number;
    minutosLlegadaTardia: number;
    minutosLlegadaTardiaAlmuerzo: number;

    turno: string;
    estado: EstadoJornada;
    observacion: string;
    actualizadoEn: string;
}
