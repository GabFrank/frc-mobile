import { CargandoService } from './../services/cargando.service';
import { TipoNotificacion } from './../services/notificacion.service';
import { NotificacionService } from 'src/app/services/notificacion.service';
import { DialogoService } from 'src/app/services/dialogo.service';
import { Injectable } from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Apollo, Mutation, Query, Subscription } from 'apollo-angular';
import { Observable } from 'rxjs';
import { MainService } from '../services/main.service';

@UntilDestroy({ checkProperties: true })
@Injectable({
  providedIn: 'root'
})
export class GenericCrudService {
  isLoading = false;

  constructor(
    private mainService: MainService,
    private dialogoService: DialogoService,
    private notificacionService: NotificacionService,
    private cargandoService: CargandoService,
    private apollo: Apollo
  ) { }

  async onGetCustom(
    gql: Query,
    data: any
  ): Promise<Observable<any>> {
    return new Observable((obs) => {
      gql
        .fetch(data, { fetchPolicy: 'no-cache', errorPolicy: 'all' })
        .pipe(untilDestroyed(this))
        .subscribe((res) => {
          if (res.errors == null) {
            obs.next(res.data['data']);
          } else {
            console.log(res.errors);
            this.notificacionService.open(
              'Ups!! Algo salió mal',
              TipoNotificacion.DANGER,
              2
            );
          }
        });
    });
  }

  async onCustomGet(
    gql: Query,
    data: any,
    errorOnEmpty?
  ): Promise<Observable<any>> {
    let loading = await this.cargandoService.open(null, false);
    return new Observable((obs) => {
      gql
        .fetch(data, { fetchPolicy: 'no-cache', errorPolicy: 'all' })
        .pipe(untilDestroyed(this))
        .subscribe((res) => {
          this.isLoading = false;
          this.cargandoService.close(loading);
          if (res.errors == null) {
            obs.next(res.data['data']);
            if (res.data['data'] != null) {
              if (res.data['data']?.length == 0 && errorOnEmpty) {
                this.notificacionService.warn('Item no encontrado');
              } else {
                this.notificacionService.success('Item encontrado');
              }
            }
          } else {
            console.log(res.errors);
            this.notificacionService.open(
              'Ups!! Algo salió mal',
              TipoNotificacion.DANGER,
              2
            );
          }
        });
    });
  }

  async onCustomSub(gql: Subscription, data: any): Promise<Observable<any>> {
    let loading = await this.cargandoService.open(null, false);
    return new Observable((obs) => {
      gql
        .subscribe(data, { fetchPolicy: 'no-cache', errorPolicy: 'all' })
        .pipe(untilDestroyed(this))
        .subscribe((res) => {
          this.isLoading = false;
          this.cargandoService.close(loading);
          if (res.errors == null) {
            obs.next(res.data['data']);
            if (res.data['data'] != null) {
              this.notificacionService.success('Item encontrada');
            }
          } else {
            console.log(res.errors);
            this.notificacionService.open(
              'Ups!! Algo salió mal',
              TipoNotificacion.DANGER,
              2
            );
          }
        });
    });
  }

  async onGetAll(gql: Query, page?, size?): Promise<Observable<any>> {
    let loading = await this.cargandoService.open(null, false);
    return new Observable((obs) => {
      gql
        .fetch({ page, size }, { fetchPolicy: 'no-cache', errorPolicy: 'all' })
        .pipe(untilDestroyed(this))
        .subscribe((res) => {
          this.isLoading = false;
          this.cargandoService.close(loading);
          if (res.errors == null) {
            obs.next(res.data['data']);
          } else {
            this.notificacionService.open(
              'Ups!! Algo salió mal',
              TipoNotificacion.DANGER,
              2
            );
          }
        });
    });
  }

  async onGetById<T>(
    gql: any,
    id: number,
    page?,
    size?,
    sucId?
  ): Promise<Observable<T>> {
    this.isLoading = true;
    let loading = await this.cargandoService.open('Buscando...', false);
    return new Observable((obs) => {
      gql
        .fetch(
          { id, page, size, sucId },
          { fetchPolicy: 'no-cache', errorPolicy: 'all' }
        )
        .pipe(untilDestroyed(this))
        .subscribe((res) => {
          this.isLoading = false;
          this.cargandoService.close(loading);
          if (res.errors == null) {
            obs.next(res.data['data']);
            if (res.data['data'] == null) {
              this.notificacionService.open(
                'Item no encontrado',
                TipoNotificacion.WARN,
                2
              );
            }
          } else {
            console.log(res.errors);
            this.notificacionService.open(
              'Ups!! Algo salió mal',
              TipoNotificacion.DANGER,
              2
            );
          }
        });
    });
  }

  async onGet<T>(gql: any, data: any): Promise<Observable<T>> {
    this.isLoading = true;
    let loading = await this.cargandoService.open('Buscando...', false);
    return new Observable((obs) => {
      gql
        .fetch(data, { fetchPolicy: 'no-cache', errorPolicy: 'all' })
        .pipe(untilDestroyed(this))
        .subscribe((res) => {
          this.isLoading = false;
          this.cargandoService.close(loading);
          if (res.errors == null) {
            obs.next(res.data['data']);
            if (res.data['data'] == null) {
              this.notificacionService.open(
                'Item no encontrado',
                TipoNotificacion.WARN,
                2
              );
            }
          } else {
            console.log(res.errors);
            this.notificacionService.open(
              'Ups!! Algo salió mal',
              TipoNotificacion.DANGER,
              2
            );
          }
        });
    });
  }

  async onGetByTexto(gql: Query, texto: string): Promise<Observable<any>> {
    this.isLoading = true;
    let loading = await this.cargandoService.open(null, false);
    return new Observable((obs) => {
      gql
        .fetch({ texto }, { fetchPolicy: 'no-cache', errorPolicy: 'all' })
        .pipe(untilDestroyed(this))
        .subscribe((res) => {
          console.log(res);
          this.cargandoService.close(loading);
          this.isLoading = false;
          if (res.errors == null) {
            obs.next(res.data['data']);
          } else {
            console.log(res.errors);
            this.notificacionService.open(
              'Ups!! Algo salió mal',
              TipoNotificacion.DANGER,
              2
            );
          }
        });
    });
  }

  async onGetByTextoPorSucursal(
    gql: Query,
    texto: string,
    sucId
  ): Promise<Observable<any>> {
    this.isLoading = true;
    let loading = await this.cargandoService.open(null, false);
    return new Observable((obs) => {
      gql
        .fetch(
          { texto, sucId },
          { fetchPolicy: 'no-cache', errorPolicy: 'all' }
        )
        .pipe(untilDestroyed(this))
        .subscribe((res) => {
          console.log(res);
          this.cargandoService.close(loading);
          this.isLoading = false;
          if (res.errors == null) {
            obs.next(res.data['data']);
          } else {
            console.log(res.errors);
            this.notificacionService.open(
              'Ups!! Algo salió mal',
              TipoNotificacion.DANGER,
              2
            );
          }
        });
    });
  }

  async onSave<T>(gql: Mutation, input, sucId?): Promise<Observable<T>> {
    this.isLoading = true;
    let loading = await this.cargandoService.open(null, false);
    if (input.usuarioId == null) {
      input.usuarioId = +localStorage.getItem('usuarioId');
    }
    return new Observable((obs) => {
      gql
        .mutate(
          { entity: input, sucId },
          { fetchPolicy: 'no-cache', errorPolicy: 'all' }
        )
        .pipe(untilDestroyed(this))
        .subscribe((res) => {
          this.isLoading = false;
          this.cargandoService.close(loading);
          if (res.errors == null) {
            obs.next(res.data['data']);
            this.notificacionService.open(
              'Guardado con éxito',
              TipoNotificacion.SUCCESS,
              2
            );
          } else {
            console.log(res.errors);
            this.notificacionService.open(
              'Ups!! Algo salió mal',
              TipoNotificacion.DANGER,
              2
            );
          }
        });
    });
  }

  async onDelete(
    gql: Mutation,
    id,
    titulo?,
    data?: any,
    showDialog?: boolean
  ): Promise<Observable<any>> {
    let loading = await this.cargandoService.open(null, false);
    return new Observable((obs) => {
      if (showDialog == false) {
        gql
          .mutate(
            {
              id
            },
            { errorPolicy: 'all' }
          )
          .pipe(untilDestroyed(this))
          .subscribe((res) => {
            this.cargandoService.close(loading);
            if (res.errors == null) {
              this.notificacionService.open(
                'Eliminado con éxito',
                TipoNotificacion.SUCCESS,
                2
              );
              obs.next(true);
            } else {
              {
                console.log(res.errors);
                this.notificacionService.open(
                  'Ups!! Algo salió mal',
                  TipoNotificacion.DANGER,
                  2
                );
                obs.next(null);
              }
            }
          });
      } else {
        this.cargandoService.close(loading);
        this.dialogoService
          .open(
            'Atención!!',
            (titulo || 'Realemente desea eliminar este item:') + data + '?',
            true
          )
          .then((res1) => {
            if (res1.role == 'aceptar') {
              gql
                .mutate(
                  {
                    id
                  },
                  { errorPolicy: 'all' }
                )
                .subscribe((res) => {
                  this.cargandoService.close(loading);
                  if (res.errors == null) {
                    this.notificacionService.open(
                      'Eliminado con éxito',
                      TipoNotificacion.SUCCESS,
                      2
                    );
                    obs.next(true);
                  } else {
                    {
                      this.notificacionService.open(
                        'Ups!! Algo salió mal',
                        TipoNotificacion.DANGER,
                        2
                      );

                      obs.next(null);
                    }
                  }
                });
            }
          });
      }
    });
  }

  async onGetByFecha(
    gql: any,
    inicio: Date,
    fin: Date
  ): Promise<Observable<any>> {
    let hoy = new Date();
    let ayer = new Date(hoy.getDay() - 1);
    ayer.setHours(0);
    ayer.setMinutes(0);
    ayer.setSeconds(0);
    let loading = await this.cargandoService.open(null, false);
    if (inicio == null) {
      if (fin == null) {
        inicio = ayer;
        fin = hoy;
      } else {
        let aux = new Date(fin);
        aux.setHours(0);
        aux.setMinutes(0);
        aux.setSeconds(0);
        inicio = aux;
      }
    } else {
      if (fin == null) {
        fin = hoy;
      }
    }
    return new Observable((obs) => {
      gql
        .fetch({ inicio, fin }, { fetchPolicy: 'no-cache', errorPolicy: 'all' })
        .pipe(untilDestroyed(this))
        .subscribe((res) => {
          this.cargandoService.close(loading);
          if (res.errors == null) {
            obs.next(res.data['data']);
          } else {
            this.notificacionService.open(
              'Ups!! Algo salió mal',
              TipoNotificacion.DANGER,
              2
            );
          }
        });
    });
  }

  async onSaveConDetalle(
    gql: Mutation,
    entity: any,
    detalleList: any[],
    info?: string
  ) {
    entity.usuarioId = this.mainService?.usuarioActual?.id;
    let loading = await this.cargandoService.open(null, false);
    return new Observable((obs) => {
      gql
        .mutate(
          {
            entity,
            detalleList
          },
          {
            fetchPolicy: 'no-cache',
            errorPolicy: 'all'
          }
        )
        .pipe(untilDestroyed(this))
        .subscribe((res) => {
          this.cargandoService.close(loading);
          if (res.errors == null) {
            this.notificacionService.open(
              'Guardado con éxito',
              TipoNotificacion.SUCCESS,
              2
            );
            obs.next(res.data['data']);
          } else {
            this.notificacionService.open(
              'Ups!! Algo salió mal',
              TipoNotificacion.DANGER,
              2
            );
            console.log(res);
            obs.next(null);
          }
        });
    });
  }
  async onCustomSave(gql: Mutation, data): Promise<Observable<any>> {
    let loading = await this.cargandoService.open(null, false);
    return new Observable((obs) => {
      gql
        .mutate(data, {
          fetchPolicy: 'no-cache',
          errorPolicy: 'all'
        })
        .pipe(untilDestroyed(this))
        .subscribe((res) => {
          this.cargandoService.close(loading);
          if (res.errors == null) {
            this.notificacionService.open(
              'Guardado con éxito',
              TipoNotificacion.SUCCESS,
              2
            );
            obs.next(res.data['data']);
          } else {
            this.notificacionService.open(
              'Ups!! Algo salió mal',
              TipoNotificacion.DANGER,
              2
            );
            console.log(res);
            obs.next(null);
          }
        });
    });
  }
}
