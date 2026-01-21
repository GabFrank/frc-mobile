import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { NotificacionDestinatario, NotificacionesUsuarioVariables } from './models/notificacion.model';
import { NotificacionesUsuarioQueryService } from './graphql/notificaciones-usuario-query.service';
import { MarcarNotificacionLeidaMutationService } from './graphql/marcar-notificacion-leida-mutation.service';
import { ConteoNotificacionesNoLeidasQueryService } from './graphql/conteo-notificaciones-no-leidas-query.service';
import { ComentariosNotificacionQueryService } from './graphql/comentarios-notificacion-query.service';
import { CrearComentarioNotificacionMutationService } from './graphql/crear-comentario-notificacion-mutation.service';
import { UsuariosConAccesoNotificacionQueryService } from './graphql/usuarios-con-acceso-notificacion-query.service';
import { EnviarNotificacionPersonalizadaMutationService } from './graphql/enviar-notificacion-personalizada-mutation.service';
import { UsuariosActivosQueryService } from './graphql/usuarios-activos-query.service';
import { NotificacionComentario } from './models/notificacion-comentario.model';
import { Usuario } from './models/usuario.model';

@Injectable({
  providedIn: 'root'
})
export class NotificacionService {
  private readonly notificacionesUsuarioQuery = inject(NotificacionesUsuarioQueryService);
  private readonly marcarLeidaMutation = inject(MarcarNotificacionLeidaMutationService);
  private readonly countNoLeidasQuery = inject(ConteoNotificacionesNoLeidasQueryService);
  private readonly comentariosQuery = inject(ComentariosNotificacionQueryService);
  private readonly crearComentarioMutation = inject(CrearComentarioNotificacionMutationService);
  private readonly usuariosAccesoQuery = inject(UsuariosConAccesoNotificacionQueryService);
  private readonly enviarNotificacionMutation = inject(EnviarNotificacionPersonalizadaMutationService);
  private readonly usuariosActivosQuery = inject(UsuariosActivosQueryService);

  private _notificaciones$ = new BehaviorSubject<NotificacionDestinatario[]>([]);
  public notificaciones$ = this._notificaciones$.asObservable();

  private _cargando$ = new BehaviorSubject<boolean>(false);
  public cargando$ = this._cargando$.asObservable();

  private _totalElements$ = new BehaviorSubject<number>(0);
  public totalElements$ = this._totalElements$.asObservable();

  notificaciones(variables: NotificacionesUsuarioVariables): Observable<NotificacionDestinatario[]> {
    this._cargando$.next(true);
    return this.notificacionesUsuarioQuery.fetch(variables).pipe(
      map(res => {
        const data = res.data?.notificacionesUsuario;
        if (data) {
          this._notificaciones$.next(data.content);
          this._totalElements$.next(data.totalElements);
        }
        this._cargando$.next(false);
        return data?.content || [];
      })
    );
  }

  marcarComoLeida(notificacionId: number): Observable<boolean | null | undefined> {
    return this.marcarLeidaMutation.mutate({ notificacionId }).pipe(
      map(res => res.data?.marcarNotificacionLeida)
    );
  }

  conteoNoLeidas(): Observable<number | null | undefined> {
    return this.countNoLeidasQuery.fetch().pipe(
      map(res => res.data?.conteoNotificacionesNoLeidas)
    );
  }

  comentarios(notificacionId: number): Observable<NotificacionComentario[]> {
    return this.comentariosQuery.watch({ notificacionId }, { fetchPolicy: 'cache-and-network' }).valueChanges.pipe(
      map(res => res.data?.comentariosNotificacion || [])
    );
  }

  crearComentario(notificacionId: number, comentario: string, comentarioPadreId?: number, mediaUrl?: string): Observable<NotificacionComentario | null | undefined> {
    return this.crearComentarioMutation.mutate({ notificacionId, comentario, comentarioPadreId, mediaUrl }).pipe(
      map(res => res.data?.crearComentarioNotificacion)
    );
  }

  usuariosConAcceso(notificacionId: number): Observable<Usuario[]> {
    return this.usuariosAccesoQuery.watch({ notificacionId }).valueChanges.pipe(
      map(res => res.data?.usuariosConAccesoNotificacion || [])
    );
  }

  enviarNotificacionPersonalizada(titulo: string, mensaje: string, tipoEnvio: string, usuariosIds?: number[]): Observable<boolean | null | undefined> {
    return this.enviarNotificacionMutation.mutate({ titulo, mensaje, tipoEnvio, usuariosIds }).pipe(
      map(res => res.data?.enviarNotificacionPersonalizada)
    );
  }

  obtenerUsuariosActivos(): Observable<any[]> {
    return this.usuariosActivosQuery.watch().valueChanges.pipe(
      map(res => res.data?.usuariosActivos || [])
    );
  }
}


