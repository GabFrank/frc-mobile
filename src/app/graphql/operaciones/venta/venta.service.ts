import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { CancelarVentaGQL } from "./graphql/cancelarVenta";
import { ReimprimirVentaGQL } from "./graphql/reimprimirVenta";
import { SaveVentaGQL } from "./graphql/saveVenta";
import { VentaPorIdGQL } from "./graphql/ventaPorId";
import { VentaPorCajaIdGQL } from "./graphql/ventasPorCajaId";
import { VentaPorPeriodoGQL } from "./graphql/ventaPorPeriodo";

import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { environment } from "../../../../environments/environment";
import { DeleteVentaGQL } from "./graphql/deleteVenta";
import { ImprimirPagareGQL } from "./graphql/imprimirPagare";
import { CountVentaGQL } from "./graphql/count-venta";
import { SaveVentaItemGQL } from "./graphql/saveVentaItem";
import { SaveCobroDetalleGQL } from "./graphql/saveCobroDetalle";
import { GenericCrudService } from "src/app/generic/generic-crud.service";
import { MainService } from "src/app/services/main.service";
import { NotificacionService } from "src/app/services/notificacion.service";
import { Venta, VentaEstado } from "src/app/domains/venta/venta.model";
import { Cobro } from "src/app/domains/cobro/cobro.model";

@UntilDestroy({ checkProperties: true })
@Injectable({
  providedIn: "root",
})
export class VentaService {
  constructor(
    private genericService: GenericCrudService,
    private saveVenta: SaveVentaGQL,
    private mainService: MainService,
    private cancelarVenta: CancelarVentaGQL,
    private reimprimirVenta: ReimprimirVentaGQL,
    private ventasPorCajaId: VentaPorCajaIdGQL,
    private ventaPorId: VentaPorIdGQL,
    private ventaPorPeriodo: VentaPorPeriodoGQL,
    private notificacionBar: NotificacionService,
    private deleteVenta: DeleteVentaGQL,
    private imprimirPagare: ImprimirPagareGQL,
    private countVenta: CountVentaGQL,
    private saveVentaItemQuery: SaveVentaItemGQL,
    private saveCobroDetalleQuery: SaveCobroDetalleGQL
  ) { }

  // $venta:VentaInput!, $venteItemList: [VentaItemInput], $cobro: CobroInput, $cobroDetalleList: [CobroDetalleInput]

  // onSaveVenta(venta: Venta, cobro: Cobro, ticket, ventaCreditoInput?, ventaCreditoCuotaInputList?): Observable<any> {
  //   let ventaItemInputList: VentaItemInput[] = [];
  //   let cobroDetalleInputList: CobroDetalleInput[] = [];
  //   let ventaInput: VentaInput = venta.toInput();
  //   let cobroInput: CobroInput = cobro.toInput();
  //   ventaInput.estado = VentaEstado.CONCLUIDA;
  //   ventaInput.usuarioId = this.mainService?.usuarioActual?.id;
  //   cobroInput.usuarioId = this.mainService?.usuarioActual?.id;

  //   venta.ventaItemList.forEach((e) => {
  //     ventaItemInputList.push(e.toInput());
  //   });
  //   cobro.cobroDetalleList.forEach((e) => {
  //     cobroDetalleInputList.push(e.toInput());
  //   });
  //   return new Observable((obs) => {
  //     this.saveVenta
  //       .mutate(
  //         {
  //           ventaInput: ventaInput,
  //           ventaItemList: ventaItemInputList,
  //           cobro: cobroInput,
  //           cobroDetalleList: cobroDetalleInputList,
  //           ticket,
  //           printerName: environment['printers']['ticket'],
  //           local: environment['local'],
  //           pdvId: environment['pdvId'],
  //           ventaCreditoInput,
  //           ventaCreditoCuotaInputList
  //         },
  //         {
  //           errorPolicy: "all",
  //           fetchPolicy: "no-cache",
  //         }
  //       ).pipe(untilDestroyed(this))
  //       .subscribe((res) => {
  //         obs.next(res.data["data"]);
  //       });
  //   });
  // }

  // onDeleteVenta(id): Observable<boolean> {
  //   return this.genericService.onDelete(this.deleteVenta, id, null, null, false, false);
  // }

  // onReimprimirVenta(id): Observable<boolean> {
  //   return new Observable((obs) => {
  //     this.reimprimirVenta
  //       .mutate(
  //         {
  //           id,
  //           printerName: environment['printers']['ticket'],
  //           local: environment['local']
  //         },
  //         {
  //           fetchPolicy: "no-cache",
  //           errorPolicy: "all",
  //         }
  //       ).pipe(untilDestroyed(this))
  //       .subscribe((res) => {
  //         if (res.errors == null) {
  //           obs.next(res.data.data);
  //         } else {
  //           obs.next(null);
  //         }
  //       });
  //   });
  // }

  // onImprimirPagare(id, itens): Observable<boolean> {
  //   return new Observable((obs) => {
  //     this.imprimirPagare
  //       .mutate(
  //         {
  //           id,
  //           itens,
  //           printerName: environment['printers']['ticket'],
  //           local: environment['local']
  //         },
  //         {
  //           fetchPolicy: "no-cache",
  //           errorPolicy: "all",
  //         }
  //       ).pipe(untilDestroyed(this))
  //       .subscribe((res) => {
  //         if (res.errors == null) {
  //           obs.next(res.data.data);
  //         } else {
  //           obs.next(null);
  //         }
  //       });
  //   });
  // }

  // onCancelarVenta(id, sucId): Observable<boolean> {
  //   return new Observable((obs) => {
  //     this.cancelarVenta
  //       .mutate(
  //         {
  //           id,
  //           sucId
  //         },
  //         {
  //           fetchPolicy: "no-cache",
  //           errorPolicy: "all",
  //         }
  //       ).pipe(untilDestroyed(this))
  //       .subscribe((res) => {
  //         if (res.errors == null) {
  //           obs.next(res.data.data);
  //         } else {
  //           obs.next(null);
  //         }
  //       });
  //   });
  // }

  // onSearch(id, page?, size?, asc?, sucId?, formaPago?, estado?): Observable<Venta[]> {
  //   this.genericService.isLoading = true;
  //   if (page == null) page = 0;
  //   if (size == null) size = 20;
  //   if (asc == null) asc = true;
  //   console.log(id, page, size, asc, sucId, formaPago, estado);

  //   return new Observable((obs) => {
  //     this.ventasPorCajaId
  //       .fetch(
  //         {
  //           id,
  //           page,
  //           size,
  //           asc,
  //           sucId,
  //           formaPago,
  //           estado
  //         },
  //         {
  //           fetchPolicy: "no-cache",
  //           errorPolicy: "all",
  //         }
  //       ).pipe(untilDestroyed(this))
  //       .subscribe((res) => {
  //         this.genericService.isLoading = false;
  //         if (res.errors == null) {
  //           obs.next(res.data.data);
  //         } else {
  //           obs.next(null);
  //         }
  //       });
  //   });
  // }

  onGetPorId(id, sucId?): Promise<Observable<Venta>> {
    return this.genericService.onGetById(this.ventaPorId, id, null, null, sucId);
  }

  // onGetVentasPorPeriodo(inicio: string, fin: string, sucId?): Observable<any> {
  //   return new Observable((obs) => {
  //     this.ventaPorPeriodo.fetch({ inicio, fin, sucId }, {
  //       fetchPolicy: "no-cache",
  //       errorPolicy: "all",
  //     }).pipe(untilDestroyed(this)).subscribe(res => {
  //       if (res.errors == null) {
  //         obs.next(res.data.data)
  //       } else {
  //         obs.next(null)
  //         this.notificacionBar.notification$.next({
  //           texto: 'Ocurrio algún problema: ',
  //           color: NotificacionColor.warn,
  //           duracion: 2
  //         })
  //       }
  //     })
  //   });
  // }

  // onCountVenta(): Observable<number> {
  //   return this.genericService.onCustomQuery(this.countVenta, null);
  // }

  // onSaveVentaItem(ventaItemInput: VentaItemInput): Observable<any> {
  //   return this.genericService.onSave(this.saveVentaItemQuery, ventaItemInput);
  // }

  // onSaveCobroDetalle(cobroDetalleInput: CobroDetalleInput): Observable<CobroDetalle> {
  //   return this.genericService.onSave(this.saveCobroDetalleQuery, cobroDetalleInput);
  // }
}
