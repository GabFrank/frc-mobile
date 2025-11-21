import { CancelarInventarioGQL } from './graphql/cancelar-inventario';
import { FinalizarInventarioGQL } from './graphql/finalizar-inventario';
import { MainService } from 'src/app/services/main.service';
import { UntilDestroy } from '@ngneat/until-destroy';
import { NotificacionService, TipoNotificacion } from 'src/app/services/notificacion.service';
import { CargandoService } from './../../services/cargando.service';
import { Inventario, InventarioProducto, InventarioProductoItem, ProductoSaldoDto } from './inventario.model';
import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
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
import { GetInventarioItemPorInvetarioProductoGQL } from './graphql/getInventarioProductoItemPorInventarioProducto copy';
import { GetInventarioItemsPorInvProYPresentacionGQL } from './graphql/getInventarioItemsPorInvProYPresentacion';
import { GetInventarioItemsDeInventariosAnterioresGQL } from './graphql/getInventarioItemsDeInventariosAnteriores';
import { ReabrirInventarioGQL } from './graphql/reabrir-inventario copy';
import { GetInventarioPorUsuarioPaginadoGQL } from './graphql/getInventarioPorUsuarioPaginadoGQL';
import { GetInventarioItemsParaRevisarGQL } from './graphql/getInventarioItemsParaRevisar';
import { GetProductosConCantidadPositivaGQL } from './graphql/getProductosConCantidadPositivaGQL';
import { GetProductosConCantidadNegativaGQL } from './graphql/getProductosConCantidadNegativaGQL';
import { GetProductosFaltantesGQL } from './graphql/getProductosFaltantesGQL';
import { PageInfo } from 'src/app/app.component';

@UntilDestroy()
@Injectable({
  providedIn: 'root'
})
export class InventarioService {
  public inventarioItemSaved$ = new Subject<{ item: InventarioProductoItem; inventarioProductoId: number }>();

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
    private reabrirInventrio: ReabrirInventarioGQL,
    private inventarioAbiertoPorSucursal: GetInventarioAbiertoPorSucursalGQL,
    private getInventarioProItem: GetInventarioItemPorInvetarioProductoGQL,
    private getInventarioPorUsuarioPaginadoGQL: GetInventarioPorUsuarioPaginadoGQL,
    private getInventarioItemsParaRevisar: GetInventarioItemsParaRevisarGQL,
    private getProductosConCantidadPositiva: GetProductosConCantidadPositivaGQL,
    private getProductosConCantidadNegativa: GetProductosConCantidadNegativaGQL,
    private getProductosFaltantes: GetProductosFaltantesGQL,
    private getInventarioItemsPorInvProYPresentacion: GetInventarioItemsPorInvProYPresentacionGQL,
    private getInventarioItemsDeInventariosAnteriores: GetInventarioItemsDeInventariosAnterioresGQL

  ) { }

  async onGetInventarioUsuario(): Promise<Observable<Inventario[]>> {
    return this.genericCrudService.onGetById(this.inventarioPorUsuario, this.mainService.usuarioActual.id);
  }

  async onGetInventarioUsuarioPaginado(
    usuarioId: number,
    page: number, 
    size: number,
    sortOrder?: string | null
  ): Promise<Observable<PageInfo<Inventario>>> {
    return await this.genericCrudService.onCustomGet(
      this.getInventarioPorUsuarioPaginadoGQL,
      { usuarioId, page, size, sortOrder }
    );
  }

  async onGetInventarioItemsParaRevisar(
    inventarioId: string,
    filtro: string | null,
    page: number,
    size: number
  ): Promise<Observable<PageInfo<InventarioProductoItem>>> {
    let loading = await this.cargandoService.open(null, false);
    return new Observable((obs) => {
      this.getInventarioItemsParaRevisar
        .fetch({ inventarioId, filtro, page, size }, { fetchPolicy: 'no-cache', errorPolicy: 'all' })
        .pipe(untilDestroyed(this))
        .subscribe((res) => {
          this.cargandoService.close(loading);
          if (res.errors == null) {
            const responseData = res.data?.getInventarioItemsParaRevisar;
            
            if (responseData) {
              obs.next(responseData);
            } else {
              obs.next(null);
            }
          } else {
            this.notificacionService.danger('Ups!! Algo salió mal');
            obs.next(null);
          }
        });
    });
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

  async onGetInventarioProItem(id, page): Promise<Observable<InventarioProductoItem[]>> {
    return this.genericCrudService.onGetById(this.getInventarioProItem, id, page, 5);
  }

  async onGetItemsPorInvProYPresentacion(invProId: number, presentacionId: number, page = 0, size = 10): Promise<Observable<InventarioProductoItem[]>> {
    return this.genericCrudService.onGetCustom(this.getInventarioItemsPorInvProYPresentacion, {
      invProId,
      presentacionId,
      page,
      size
    });
  }

  async onGetItemsDeInventariosAnteriores(invProId: number, presentacionId: number, page = 0, size = 10): Promise<Observable<InventarioProductoItem[]>> {
    return this.genericCrudService.onGetCustom(this.getInventarioItemsDeInventariosAnteriores, {
      invProId,
      presentacionId,
      page,
      size
    });
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
    // Manejo específico para duplicado en inventario (bloqueado por backend) en el frontend
    let loading = await this.cargandoService.open(null, false)
    if (input.usuarioId == null) {
      input.usuarioId = +localStorage.getItem('usuarioId');
    }
    return new Observable((obs) => {
      this.saveInventarioProductoItem
        .mutate(
          { entity: input },
          { fetchPolicy: 'no-cache', errorPolicy: 'all' }
        )
        .pipe(untilDestroyed(this))
        .subscribe((res) => {
          this.cargandoService.close(loading)
          if (res.errors == null) {
            obs.next(res.data['data'])
            this.notificacionService.open('Guardado con éxito', TipoNotificacion.SUCCESS, 2)
          } else {
            console.log(res.errors)
            obs.next(null)
            const msg = res.errors[0]?.message || ''
            if (msg.includes('ya fue registrado en este inventario')) {
              this.notificacionService.open('Este producto ya fue registrado en este inventario', TipoNotificacion.WARN, 3)
            } else {
              this.notificacionService.open('Ups!! Algo salió mal', TipoNotificacion.DANGER, 2)
            }
          }
        })
    })
    const cleanInput: any = {};
    if (input.id !== undefined && input.id !== null) cleanInput.id = typeof input.id === 'string' ? parseInt(input.id) : input.id;
    if (input.inventarioProductoId !== undefined) cleanInput.inventarioProductoId = typeof input.inventarioProductoId === 'string' ? parseInt(input.inventarioProductoId) : input.inventarioProductoId;
    if (input.zonaId !== undefined && input.zonaId !== null) cleanInput.zonaId = typeof input.zonaId === 'string' ? parseInt(input.zonaId) : input.zonaId;
    if (input.sectorId !== undefined && input.sectorId !== null) cleanInput.sectorId = typeof input.sectorId === 'string' ? parseInt(input.sectorId) : input.sectorId;
    if (input.presentacionId !== undefined) cleanInput.presentacionId = typeof input.presentacionId === 'string' ? parseInt(input.presentacionId) : input.presentacionId;
    if (input.cantidad !== undefined) cleanInput.cantidad = typeof input.cantidad === 'string' ? parseFloat(input.cantidad) : input.cantidad;
    if (input.cantidadFisica !== undefined && input.cantidadFisica !== null) cleanInput.cantidadFisica = typeof input.cantidadFisica === 'string' ? parseFloat(input.cantidadFisica) : input.cantidadFisica;
    if (input.cantidadAnterior !== undefined && input.cantidadAnterior !== null) cleanInput.cantidadAnterior = typeof input.cantidadAnterior === 'string' ? parseFloat(input.cantidadAnterior) : input.cantidadAnterior;
    if (input.fechaVerificado !== undefined && input.fechaVerificado !== null) cleanInput.fechaVerificado = input.fechaVerificado;
    if (input.verificado !== undefined && input.verificado !== null) cleanInput.verificado = input.verificado;
    if (input.revisado !== undefined && input.revisado !== null) cleanInput.revisado = input.revisado;
    if (input.vencimiento !== undefined) cleanInput.vencimiento = input.vencimiento;
    if (input.estado !== undefined) cleanInput.estado = input.estado;
    if (input.usuarioId !== undefined && input.usuarioId !== null) cleanInput.usuarioId = typeof input.usuarioId === 'string' ? parseInt(input.usuarioId) : input.usuarioId;

    console.log('Input limpio para guardar:', cleanInput);
    return await this.genericCrudService.onSave(this.saveInventarioProductoItem, cleanInput);
  }

  async onDeleteInventarioProductoItem(id, item?): Promise<Observable<boolean>> {
    return await this.genericCrudService.onDelete(this.deleteInventarioProductoItem, id, item)
  }

  onFinalizarInventario(id): Observable<Inventario> {
    return new Observable(obs => {
      this.finalizarInventario.mutate(
        {
          id,
        },
        { errorPolicy: "all" }
      ).pipe(untilDestroyed(this))
        .subscribe(res => {
          if (res?.errors?.length > 0) {
            this.notificacionService.openAlgoSalioMal()
          } else {
            obs.next(res.data['data'])
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

  onReabrirInventario(id): Observable<boolean> {
    return new Observable(obs => {
      this.reabrirInventrio.mutate(
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

  async onGetProductosConCantidadPositiva(
    sucursalId: number,
    productoId: number,
    page: number,
    size: number
  ): Promise<Observable<PageInfo<ProductoSaldoDto>>> {
    let loading = await this.cargandoService.open(null, false);
    return new Observable((obs) => {
      this.getProductosConCantidadPositiva
        .fetch({ sucursalId, productoId, page, size }, { fetchPolicy: 'no-cache', errorPolicy: 'all' })
        .pipe(untilDestroyed(this))
        .subscribe((res) => {
          this.cargandoService.close(loading);
          if (res.errors == null) {
            const responseData = res.data?.data;
            
            if (responseData) {
              obs.next(responseData);
            } else {
              obs.next(null);
            }
          } else {
            this.notificacionService.danger('Ups!! Algo salió mal');
            obs.next(null);
          }
        });
    });
  }

  async onGetProductosConCantidadNegativa(
    sucursalId: number,
    productoId: number,
    page: number,
    size: number
  ): Promise<Observable<PageInfo<ProductoSaldoDto>>> {
    let loading = await this.cargandoService.open(null, false);
    return new Observable((obs) => {
      this.getProductosConCantidadNegativa
        .fetch({ sucursalId, productoId, page, size }, { fetchPolicy: 'no-cache', errorPolicy: 'all' })
        .pipe(untilDestroyed(this))
        .subscribe((res) => {
          this.cargandoService.close(loading);
          if (res.errors == null) {
            const responseData = res.data?.data;
            
            if (responseData) {
              obs.next(responseData);
            } else {
              obs.next(null);
            }
          } else {
            this.notificacionService.danger('Ups!! Algo salió mal');
            obs.next(null);
          }
        });
    });
  }

  async onGetProductosFaltantes(
    sucursalId: number,
    productoId: number,
    fechaInicio: string,
    fechaFin: string,
    page: number,
    size: number
  ): Promise<Observable<PageInfo<ProductoSaldoDto>>> {
    let loading = await this.cargandoService.open(null, false);
    return new Observable((obs) => {
      this.getProductosFaltantes
        .fetch({ sucursalId, productoId, fechaInicio, fechaFin, page, size }, { fetchPolicy: 'no-cache', errorPolicy: 'all' })
        .pipe(untilDestroyed(this))
        .subscribe((res) => {
          this.cargandoService.close(loading);
          if (res.errors == null) {
            const responseData = res.data?.data;
            
            if (responseData) {
              obs.next(responseData);
            } else {
              obs.next(null);
            }
          } else {
            this.notificacionService.danger('Ups!! Algo salió mal');
            obs.next(null);
          }
        });
    });
  }
}
