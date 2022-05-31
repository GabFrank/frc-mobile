import { CargandoService } from './../services/cargando.service';
import { TipoNotificacion } from './../services/notificacion.service';
import { NotificacionService } from 'src/app/services/notificacion.service';
import { DialogoService } from 'src/app/services/dialogo.service';
import { Injectable } from "@angular/core";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { Apollo, Mutation, Query } from "apollo-angular";
import { Observable } from "rxjs";
import { MainService } from "../services/main.service";

@UntilDestroy({ checkProperties: true })
@Injectable({
  providedIn: "root",
})
export class GenericCrudService {

  isLoading = false;

  constructor(
    private mainService: MainService,
    private dialogoService: DialogoService,
    private notificacionService: NotificacionService,
    private cargandoService: CargandoService,
    private apollo: Apollo
  ) {
  }

  onGetAll(gql: Query): Observable<any> {
    this.cargandoService.open(null, false)
    return new Observable((obs) => {
      gql
        .fetch({}, { fetchPolicy: "no-cache", errorPolicy: "all" }).pipe(untilDestroyed(this))
        .subscribe((res) => {
          this.isLoading = false
          this.cargandoService.close()
          if (res.errors == null) {
            obs.next(res.data["data"]);
          } else {
            this.notificacionService.open('Ups!! Algo salió mal', TipoNotificacion.DANGER, 2)
          }
        });
    });
  }

  onGetById<T>(gql: any, id: number): Observable<T> {
    this.isLoading = true;
    this.cargandoService.open(null, false)
    return new Observable((obs) => {
      gql
        .fetch({ id }, { fetchPolicy: "no-cache", errorPolicy: "all" }).pipe(untilDestroyed(this))
        .subscribe((res) => {
          this.isLoading = false;
          this.cargandoService.close()
          if (res.errors == null) {
            obs.next(res.data["data"]);
            if (res.data["data"] == null) {
              this.notificacionService.open('Item no encontrado', TipoNotificacion.WARN, 2)
            }
          } else {
            console.log(res.errors)
            this.notificacionService.open('Ups!! Algo salió mal', TipoNotificacion.DANGER, 2)
          }
        });
    });
  }

  onGetByTexto(gql: Query, texto: string): Observable<any> {
    this.isLoading = true;
    this.cargandoService.open(null, false)
    return new Observable((obs) => {
      gql
        .fetch({ texto }, { fetchPolicy: "no-cache", errorPolicy: "all" }).pipe(untilDestroyed(this))
        .subscribe((res) => {
          console.log(res)
          this.cargandoService.close()
          this.isLoading = false;
          if (res.errors == null) {
            obs.next(res.data["data"]);
          } else {
            console.log(res.errors)
            this.notificacionService.open('Ups!! Algo salió mal', TipoNotificacion.DANGER, 2)
          }
        });
    });
  }

  onSave<T>(gql: Mutation, input): Observable<T> {
    this.isLoading = true;
    this.cargandoService.open(null, false)
    if (input.usuarioId == null) {
      input.usuarioId = +localStorage.getItem("usuarioId");
    }
    return new Observable((obs) => {
      gql
        .mutate(
          { entity: input },
          { fetchPolicy: "no-cache", errorPolicy: "all" }
        ).pipe(untilDestroyed(this))
        .subscribe((res) => {
          this.isLoading = false;
          this.cargandoService.close()
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

  onDelete(
    gql: Mutation,
    id,
    titulo?,
    data?: any,
    showDialog?: boolean
  ): Observable<any> {
    this.cargandoService.open(null, false)
    return new Observable((obs) => {
      if (showDialog == false) {
        gql
          .mutate(
            {
              id,
            },
            { errorPolicy: "all" }
          ).pipe(untilDestroyed(this))
          .subscribe((res) => {
            this.cargandoService.close()
            if (res.errors == null) {
              this.notificacionService.open('Eliminado con éxito', TipoNotificacion.SUCCESS, 2)
              obs.next(true);
            } else {
              {
                console.log(res.errors)
                this.notificacionService.open('Ups!! Algo salió mal', TipoNotificacion.DANGER, 2)
                obs.next(null);
              }
            }
          });
      } else {
        this.dialogoService
          .open(
            "Atención!!",
            "Realemente desea eliminar este " + titulo,
            true
          ).then((res1) => {
            if (res1) {
              gql
                .mutate(
                  {
                    id,
                  },
                  { errorPolicy: "all" }
                )
                .subscribe((res) => {
                  this.cargandoService.close()
                  if (res.errors == null) {
                    this.notificacionService.open('Eliminado con éxito', TipoNotificacion.SUCCESS, 2)
                    obs.next(true);
                  } else {
                    {
                      this.notificacionService.open('Ups!! Algo salió mal', TipoNotificacion.DANGER, 2)

                      obs.next(null);
                    }
                  }
                });
            }
          })
      }
    });
  }

  onGetByFecha(gql: any, inicio: Date, fin: Date): Observable<any> {
    let hoy = new Date();
    let ayer = new Date(hoy.getDay() - 1);
    ayer.setHours(0);
    ayer.setMinutes(0);
    ayer.setSeconds(0);
    this.cargandoService.open(null, false)
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
        .fetch({ inicio, fin }, { fetchPolicy: "no-cache", errorPolicy: "all" }).pipe(untilDestroyed(this))
        .subscribe((res) => {
          this.cargandoService.close()
          if (res.errors == null) {
            obs.next(res.data["data"]);
          } else {
            this.notificacionService.open('Ups!! Algo salió mal', TipoNotificacion.DANGER, 2)
          }
        });
    });
  }


  onSaveConDetalle(gql: Mutation, entity: any, detalleList: any[], info?: string) {
    entity.usuarioId = this.mainService?.usuarioActual?.id;
    this.cargandoService.open(null, false)
    return new Observable((obs) => {
      gql
        .mutate(
          {
            entity,
            detalleList,
          },
          {
            fetchPolicy: "no-cache",
            errorPolicy: "all",
          }
        ).pipe(untilDestroyed(this))
        .subscribe((res) => {
          this.cargandoService.close()
          if (res.errors == null) {
            this.notificacionService.open('Guardado con éxito', TipoNotificacion.SUCCESS, 2)
            obs.next(res.data['data']);
          } else {
            this.notificacionService.open('Ups!! Algo salió mal', TipoNotificacion.DANGER, 2)
            console.log(res);
            obs.next(null);
          }
        });
    });
  }
}
