import { Usuario } from './usuario.model';

export interface NotificacionComentario {
    id: number;
    usuario: Usuario;
    comentario: string;
    comentarioPadre?: NotificacionComentario;
    creadoEn: Date;
    actualizadoEn?: Date;
    mediaUrl?: string;
}
