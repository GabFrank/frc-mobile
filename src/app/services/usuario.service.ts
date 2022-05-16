import { Observable } from 'rxjs';
import { Usuario } from '../domains/personas/usuario.model';
import { SaveUsuarioGQL } from '../graphql/personas/usuario/graphql/saveUsuario';
import { UsuarioPorIdGQL } from '../graphql/personas/usuario/graphql/usuarioPorId';
import { UsuarioPorPersonaIdGQL } from '../graphql/personas/usuario/graphql/usuarioPorPersonaId';
import { UsuarioSearchGQL } from '../graphql/personas/usuario/graphql/usuarioSearch';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Injectable } from '@angular/core';

@UntilDestroy()
@Injectable({
  providedIn: 'root',
})
export class UsuarioService {
  constructor(
    private getUsuario: UsuarioPorIdGQL,
    private getUsuarioPorPersonaId: UsuarioPorPersonaIdGQL,
    private saveUsuario: SaveUsuarioGQL,
    private searchUsuario: UsuarioSearchGQL
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
}


