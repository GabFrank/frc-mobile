import { Observable } from 'rxjs';
import { Usuario, UsuarioInput } from '../domains/personas/usuario.model';
import { SaveUsuarioGQL } from '../graphql/personas/usuario/graphql/saveUsuario';
import { UsuarioPorIdGQL } from '../graphql/personas/usuario/graphql/usuarioPorId';
import { UsuarioPorPersonaIdGQL } from '../graphql/personas/usuario/graphql/usuarioPorPersonaId';
import { UsuarioSearchGQL } from '../graphql/personas/usuario/graphql/usuarioSearch';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Injectable } from '@angular/core';
import { CargandoService } from './cargando.service';
import { NotificacionService, TipoNotificacion } from './notificacion.service';

@UntilDestroy()
@Injectable({
  providedIn: 'root',
})
export class UsuarioService {
  constructor(
    private getUsuario: UsuarioPorIdGQL,
    private getUsuarioPorPersonaId: UsuarioPorPersonaIdGQL,
    private saveUsuario: SaveUsuarioGQL,
    private searchUsuario: UsuarioSearchGQL,
    private cargandoService: CargandoService,
    private notificacionService: NotificacionService
  ) // private mainService: MainService
  { }

  onGetUsuario(id: number): Observable<any> {
    return new Observable((obs) => {
      this.getUsuario
        .fetch(
          {
            id,
          },
          {
            fetchPolicy: 'no-cache',
            errorPolicy: 'all',
          }
        ).pipe(untilDestroyed(this))
        .subscribe((res) => {
          if (res?.errors == null) {
            obs.next(res?.data.data);
          } else {
            obs.next(res.errors);
          }
        });
    });
  }

  onGetUsuarioPorPersonaId(id: number): Observable<any> {
    return new Observable((obs) => {
      this.getUsuarioPorPersonaId
        .fetch(
          {
            id,
          },
          {
            fetchPolicy: 'no-cache',
            errorPolicy: 'all',
          }
        ).pipe(untilDestroyed(this))
        .subscribe((res) => {
          if (res?.errors == null) {
            obs.next(res?.data.data);
          } else {
            obs.next(res.errors);
          }
        });
    });
  }

  onSeachUsuario(texto: string): Observable<Usuario[]> {
    if (texto != null || texto != '') {
      return new Observable((obs) => {
        this.searchUsuario
          .fetch(
            {
              texto: texto.toUpperCase(),
            },
            {
              fetchPolicy: 'no-cache',
              errorPolicy: 'all',
            }
          )
          .pipe(untilDestroyed(this))
          .subscribe((res) => {
            if (res.errors == null) {
              obs.next(res.data);
            }
          });
      });
    }
  }

  async onSaveUsuario(input: UsuarioInput): Promise<Observable<Usuario>> {
    let loading = await this.cargandoService.open(null, false)
    return new Observable((obs) => {
      this.saveUsuario
        .mutate(
          { entity: input },
          { fetchPolicy: "no-cache", errorPolicy: "all" }
        ).pipe(untilDestroyed(this))
        .subscribe((res) => {
          this.cargandoService.close(loading)
          if (res.errors == null) {
            obs.next(res.data["data"]);
            this.notificacionService.open('Guardado con éxito', TipoNotificacion.SUCCESS, 2)

          } else {
            console.log(res.errors)
            this.notificacionService.open('Ups!! Algo salió mal', TipoNotificacion.DANGER, 2)
          }
        });
    });
  }
}


