export interface Notificacion {
    id: number;
    titulo: string;
    mensaje: string;
    tipo?: string;
    data?: string;
    estadoTablero?: string;
    fechaVerificacion?: Date;
    creadoEn: Date;
    conteoComentarios?: number;
}

export interface NotificacionDestinatario {
    id: number;
    notificacion: Notificacion;
    leida: boolean;
    fechaLeida?: Date;
    fechaEntrega?: Date;
    creadoEn: Date;
}

export interface NotificacionDestinatarioPage {
    content: NotificacionDestinatario[];
    pageNumber: number;
    pageSize: number;
    totalElements: number;
    totalPages: number;
}

export interface NotificacionesUsuarioVariables {
    leidas?: boolean;
    page?: number;
    size?: number;
    estadoTablero?: string;
    fechaInicio?: string;
    fechaFin?: string;
}

export interface MarcarNotificacionLeidaVariables {
    notificacionId: number;
}

export interface NotificacionesUsuarioResponse {
    notificacionesUsuario: NotificacionDestinatarioPage;
}

export interface ConteoNotificacionesNoLeidasResponse {
    conteoNotificacionesNoLeidas: number;
}

export interface MarcarNotificacionLeidaResponse {
    marcarNotificacionLeida: boolean;
}

export interface MarcarTodasNotificacionesLeidasResponse {
    marcarTodasNotificacionesLeidas: boolean;
}

export interface ConfiguracionNotificacion {
    tipo: string;
    descripcion: string;
    habilitado: boolean;
    esObligatorio: boolean;
}

export const DESCRIPCION_POR_TIPO_NOTIFICACION: Record<string, string> = {
    RETIRO: 'Notificacion de retiro realizado en sucursal',
    VENTA_TRANSFERENCIA: 'Notificacion de venta con pago por transferencia',
    VENTA_STOCK_CRITICO: 'Notificacion de venta con producto en stock cero o negativo',
    VENTA_CREDITO_CLIENTE: 'Notificacion de compra a credito propia',
};

export interface MisConfiguracionesNotificacionResponse {
    misConfiguracionesNotificacion: ConfiguracionNotificacion[];
}

export interface ActualizarPreferenciaNotificacionVariables {
    tipoNotificacion: string;
    habilitado: boolean;
}

export interface ActualizarPreferenciaNotificacionResponse {
    actualizarPreferenciaNotificacion: boolean;
}

export interface EnviarNotificacionPersonalizadaVariables {
    titulo: string;
    mensaje: string;
    tipoEnvio: string;
    usuariosIds?: number[];
}

export interface EnviarNotificacionPersonalizadaResponse {
    enviarNotificacionPersonalizada: boolean;
}

export interface UsuariosActivosResponse {
    usuariosActivos: {
        id: number;
        nickname: string;
        persona?: {
            id: number;
            nombre: string;
        };
    }[];
}
