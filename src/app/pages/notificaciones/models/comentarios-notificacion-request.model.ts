import { NotificacionComentario } from './notificacion-comentario.model';

export interface ComentariosNotificacionVariables {
    notificacionId: number;
}

export interface ComentariosNotificacionResponse {
    comentariosNotificacion: NotificacionComentario[];
}

export interface CrearComentarioNotificacionVariables {
    notificacionId: number;
    comentario: string;
    comentarioPadreId?: number;
    mediaUrl?: string;
}

export interface CrearComentarioNotificacionResponse {
    crearComentarioNotificacion: NotificacionComentario;
}
