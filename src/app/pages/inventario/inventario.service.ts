import { CancelarInventarioGQL } from './graphql/cancelar-inventario';
import { FinalizarInventarioGQL } from './graphql/finalizar-inventario';
import { MainService } from 'src/app/services/main.service';
import { UntilDestroy } from '@ngneat/until-destroy';
import { NotificacionService, TipoNotificacion } from 'src/app/services/notificacion.service';
import { CargandoService } from './../../services/cargando.service';
import { Inventario, InventarioProducto, InventarioProductoItem } from './inventario.model';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { GenericCrudService } from 'src/app/generic/generic-crud.service';
import { DeleteInventarioGQL } from './graphql/deleteInventario';
import { DeleteInventarioProductoGQL } from './graphql/deleteInventarioProducto';
import { DeleteInventarioProductoItemGQL } from './graphql/deleteInventarioProductoItem';
import { GetInventarioGQL } from './graphql/getInventario';
import { GetInventarioPorFechaGQL } from './graphql/getInventarioPorFecha';
import { SaveInventarioGQL } from './graphql/saveInventario';
import { SaveInventarioProductoGQL } from './graphql/saveInventarioProducto';
import { SaveInventarioProductoItemGQL } from './graphql/saveInventarioProductoItem';
import { untilDestroyed } from '@ngneat/until-destroy';
import { GetInventarioPorUsuarioGQL } from './graphql/getInventarioPorUsuario';
import { GetInventarioAbiertoPorSucursalGQL } from './graphql/getInventarioAbiertoPorSucursal';

@UntilDestroy()
@Injectable({
  providedIn: 'root'
})
export class InventarioService {

  constructor(
    private genericCrudService: GenericCrudService,
    private getInventario: GetInventarioGQL,
    private saveInventario: SaveInventarioGQL,
    private deleteInventario: DeleteInventarioGQL,
    private saveInventarioProducto: SaveInventarioProductoGQL,
    private deleteInventarioProducto: DeleteInventarioProductoGQL,
    private saveInventarioProductoItem: SaveInventarioProductoItemGQL,
    private deleteInventarioProductoItem: DeleteInventarioProductoItemGQL,
    private getInventariosPorFecha: GetInventarioPorFechaGQL,
    private cargandoService: CargandoService,
    private notificacionService: NotificacionService,
    private inventarioPorUsuario: GetInventarioPorUsuarioGQL,
    private mainService: MainService,
    private finalizarInventario: FinalizarInventarioGQL,
    private cancelarInventrio: CancelarInventarioGQL,
    private inventarioAbiertoPorSucursal: GetInventarioAbiertoPorSucursalGQL

  ) { }

  async onGetInventarioUsuario(): Promise<Observable<Inventario[]>> {
    return this.genericCrudService.onGetById(this.inventarioPorUsuario, this.mainService.usuarioActual.id);
  }

  async onGetTrasferenciasPorFecha(inicio, fin) {
    return this.genericCrudService.onGetByFecha(this.getInventariosPorFecha, inicio, fin);
  }

  async onGetInventarioAbiertoPorSucursal(id): Promise<Observable<Inventario[]>> {
    return this.genericCrudService.onGetById(this.inventarioAbiertoPorSucursal, id);
  }

  async onGetInventario(id): Promise<Observable<Inventario>> {
    return this.genericCrudService.onGetById(this.getInventario, id);
  }

  async onSaveInventario(input): Promise<Observable<Inventario>> {
    return this.genericCrudService.onSave(this.saveInventario, input);
  }

  async onDeleteInventario(id): Promise<Observable<boolean>> {
    return this.genericCrudService.onDelete(this.deleteInventario, id, 'Realmente  desea eliminar esta inventario?')
  }

  async onSaveInventarioProducto(input): Promise<Observable<InventarioProducto>> {
    let loading = await this.cargandoService.open(null, false)
    if (input.usuarioId == null) {
      input.usuarioId = +localStorage.getItem("usuarioId");
    }
    return new Observable((obs) => {
      this.saveInventarioProducto
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
            obs.next()
            if (res.errors[0].message.includes('inventario_producto_un')) {
              this.notificacionService.open('Esta zona ya esta siendo inventariada.', TipoNotificacion.WARN, 2)
            } else if (res.errors[0].message.includes('Ya tenes una zona abierta')) {
              this.notificacionService.open('Ya tenes una zona abierta. Despues de concluirla podrás iniciar el inventario de otra', TipoNotificacion.WARN, 3)
            }
          }
        });
    });
  }

  async onDeleteInventarioProducto(id): Promise<Observable<boolean>> {
    return await this.genericCrudService.onDelete(this.deleteInventarioProducto, id, 'Realmente  desea eliminar este item')
  }

  async onSaveInventarioProductoItem(input): Promise<Observable<InventarioProductoItem>> {
    return await this.genericCrudService.onSave(this.saveInventarioProductoItem, input);
  }

  async onDeleteInventarioProductoItem(id): Promise<Observable<boolean>> {
    return await this.genericCrudService.onDelete(this.deleteInventarioProductoItem, id, 'Realmente  desea eliminar este item')
  }

  onFinalizarInventario(id): Observable<Inventario>{
    return new Observable(obs => {
      this.finalizarInventario.mutate(
        {
          id,
        },
        { errorPolicy: "all" }
      ).pipe(untilDestroyed(this))
        .subscribe(res => {
          if (res?.errors?.length > 0) { //si hay error
            this.notificacionService.openAlgoSalioMal()
          } else { //si no
            obs.next(res.data['data']) // data
            this.notificacionService.openGuardadoConExito()
          }
        })
    })
  }

  onCancelarInventario(id): Observable<boolean> {
    return new Observable(obs => {
      this.cancelarInventrio.mutate(
        {
          id,
        },
        { errorPolicy: "all" }
      ).pipe(untilDestroyed(this))
        .subscribe(res => {
          if (res?.errors?.length > 0) {
            this.notificacionService.openAlgoSalioMal()
            obs.next(false)
          } else {
            obs.next(true)
            this.notificacionService.openGuardadoConExito()
          }
        })
    })
  }
}
