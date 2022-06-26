import { SucursalByIdGQL } from './graphql/sucursalById';
import { GenericCrudService } from 'src/app/generic/generic-crud.service';
import { NotificacionService } from 'src/app/services/notificacion.service';
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { SucursalesGQL } from "./graphql/sucursalesQuery";
import { Sucursal } from "./sucursal.model";

import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { serverAdress } from "../../../../environments/environment";
import { SucursalActualGQL } from "./graphql/sucursalActual";

@UntilDestroy({ checkProperties: true })
@Injectable({
  providedIn: "root",
})
export class SucursalService {
  httpOptions = {
    headers: new HttpHeaders({
      Accept: "application/json",
      "Content-Type": "application/json",
    }),
  };

  constructor(
    public getAllSucursales: SucursalesGQL,
    private NotificacionService: NotificacionService,
    private getSucursalActual: SucursalActualGQL,
    private getSucursal: SucursalByIdGQL,
    private http: HttpClient,
    private genericCrudService: GenericCrudService
  ) { }

  async onGetAllSucursales(): Promise<Observable<Sucursal[]>> {
    return await this.genericCrudService.onGetAll(this.getAllSucursales);
  }

  async onGetSucursal(id): Promise<Observable<Sucursal>> {
    return await this.genericCrudService.onGetById(this.getSucursal, id)
  }

  getSucursalesAdmin(): Observable<any> {
    return new Observable((obs) => {
      let httpBody = {
        nickname: "ADMIN",
        password: "ADMIN",
      };
      let httpResponse = this.http
        .post(
          `http://${serverAdress.serverIp}:${serverAdress.serverPort}/config/all-sucursales`,
          httpBody,
          this.httpOptions
        )
        .subscribe(
          (res) => {
            obs.next(res);
          },
          (error) => {
            obs.next(error);
          }
        );
    });
  }
}
