import { Injectable } from "@angular/core";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { Observable } from "rxjs";
import { GenericCrudService } from "src/app/generic/generic-crud.service";
import { CargandoService } from "src/app/services/cargando.service";
import { MainService } from "src/app/services/main.service";
import { NotificacionService, TipoNotificacion } from "src/app/services/notificacion.service";
import { environment } from "src/environments/environment";
import { PdvCaja, CajaBalance, PdvCajaInput } from "./caja.model";
import { BalancePorFechaGQL } from "./graphql/balancePorFecha";
import { CajaPorIdGQL } from "./graphql/cajaPorId";
import { CajaPorUsuarioIdAndAbiertoGQL } from "./graphql/cajaPorUsuarioIdAndAbierto";
import { CajaPorUsuarioIdAndAbiertoPorSucursalGQL } from "./graphql/cajaPorUsuarioIdAndAbiertoPorSucursal";
import { CajasPorFechaGQL } from "./graphql/cajasPorFecha";
import { CajasPorUsuarioIdGQL } from "./graphql/cajasPorUsuario";
import { DeleteCajaGQL } from "./graphql/deleleCaja";
import { ImprimirBalanceGQL } from "./graphql/imprimirBalance";
import { SaveCajaGQL } from "./graphql/saveCaja";
import { SaveCajaPorSucursalGQL } from "./graphql/saveCajaPorSucursal";
// import { AbrirCajaGQL } from "./graphql/abrirCaja";

@UntilDestroy({ checkProperties: true })
@Injectable({
  providedIn: "root",
})
export class CajaService {

  selectedCaja: PdvCaja;

  constructor(
    private genericService: GenericCrudService,
    private cajasPorFecha: CajasPorFechaGQL,
    private onSaveCaja: SaveCajaGQL,
    private cajaPorId: CajaPorIdGQL,
    private deleteCaja: DeleteCajaGQL,
    private cajaPorUsuarioIdAndAbierto: CajaPorUsuarioIdAndAbiertoGQL,
    private cajaPorUsuarioIdAndAbiertoPorSucursal: CajaPorUsuarioIdAndAbiertoPorSucursalGQL,
    private imprimirBalance: ImprimirBalanceGQL,
    private mainService: MainService,
    private balancePorFecha: BalancePorFechaGQL,
    private cargandoService: CargandoService,
    private notificacionService: NotificacionService,
    private onSaveCajaPorSucursal: SaveCajaPorSucursalGQL,
    private cajasPorUsuario: CajasPorUsuarioIdGQL,
    // private abrirCaja: AbrirCajaGQL
  ) {

  }

  // onGetAll(): Observable<any> {
  //   return this.genericService.onGetAll(this.getAllCajas);
  // }

  // onGetByDate(inicio?: Date, fin?: Date): Observable<PdvCaja[]> {
  //   let hoy = new Date();
  //   if (inicio == null) {
  //     inicio = new Date()
  //     inicio.setDate(hoy.getDate() - 2);
  //   }
  //   if (fin == null) {
  //     fin = new Date()
  //     fin = hoy;
  //   }
  //   return this.genericService.onGetByFecha(this.cajasPorFecha, inicio, fin);
  // }

  async onGetBalanceByDate(inicio?: Date, fin?: Date): Promise<Observable<CajaBalance>> {
    let hoy = new Date();
    if (inicio == null) {
      inicio = new Date()
      inicio.setDate(hoy.getDate() - 2);
    }
    if (fin == null) {
      fin = new Date()
      fin = hoy;
    }
    return await this.genericService.onGetByFecha(this.balancePorFecha, inicio, fin);
  }

  async onSave(input: PdvCajaInput, sucId): Promise<Observable<any>> {
    return await this.genericService.onSave(this.onSaveCaja, input, sucId);
  }

  async onSavePorSucursal(input: PdvCajaInput, sucId): Promise<Observable<any>> {
    return await this.genericService.onSave(this.onSaveCajaPorSucursal, input, sucId);
  }

  async onGetById(id, sucId?): Promise<Observable<any>> {
    return await this.genericService.onGetById(this.cajaPorId, id, null, null, sucId);
  }

  async onGetByUsuarioId(id, offset = 0): Promise<Observable<any>> {
    let page = 0;
    let size = 20;
    page = Math.floor(offset / size);
    return await this.genericService.onGetById(this.cajasPorUsuario, id, page, size);
  }

  async onGetByUsuarioIdAndAbierto(id): Promise<Observable<PdvCaja[]>> {
    return await this.genericService.onGetById(this.cajaPorUsuarioIdAndAbierto, id);
  }

  async onGetByUsuarioIdAndAbiertoPorSucursal(id, sucId): Promise<Observable<PdvCaja>> {
    let loading = await this.cargandoService.open(null, false)
    return new Observable((obs) => {
      this.cajaPorUsuarioIdAndAbiertoPorSucursal
        .fetch({ id, sucId }, { fetchPolicy: "no-cache", errorPolicy: "all" }).pipe(untilDestroyed(this))
        .subscribe((res) => {
          this.cargandoService.close(loading)
          console.log(res);
          if (res.errors == null) {
            obs.next(res.data["data"]);
            if (res.data["data"] != null) {
              this.notificacionService.success("Item encontrada");
            }
          } else {
            this.notificacionService.open('Ups!! Algo salió mal', TipoNotificacion.DANGER, 2)
          }
        });
    });
  }

  async onDelete(id, showDialog?: boolean): Promise<Observable<any>> {
    return await this.genericService.onDelete(this.deleteCaja, id, showDialog);
  }

  onImprimirBalance(id) {
    return this.imprimirBalance
      .fetch(
        {
          id,
          printerName: environment['printers']['ticket'],
          cajaName: environment['local']
        },
        {
          fetchPolicy: "no-cache",
          errorPolicy: "all",
        }
      ).pipe(untilDestroyed(this))
      .subscribe((res) => {
      });
  }

  // async onAbrirCaja(cajaInput, conteoInput, conteoMonedaInputList): Promise<Observable<any>> {
  //   return await this.genericService.onCustomSave(this.abrirCaja, { input: cajaInput, conteoInput: conteoInput, conteoMonedaInputList: conteoMonedaInputList });
  // }

}
