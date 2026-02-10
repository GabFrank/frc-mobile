import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { first, map } from 'rxjs/operators';
import { PageInfo } from 'src/app/app.component';
import { GenericCrudService } from 'src/app/generic/generic-crud.service';
import { RecepcionMercaderiaConFiltrosGQL } from './graphql/recepcionMercaderiaConFiltros';
import { RecepcionMercaderia } from './recepcion-mercaderia.model';
import { RecepcionMercaderiaPorIdGQL } from './graphql/recepcionMercaderiaPorId';
import { PedidoRecepcionProductoPorRecepcionMercaderiaGQL } from './graphql/pedidoRecepcionProductoPorRecepcionMercaderia';
import { PedidoRecepcionProductoPorRecepcionMercaderiaAndProductoGQL } from './graphql/pedidoRecepcionProductoPorRecepcionMercaderiaAndProducto';
import { PedidoRecepcionProductoDto, PedidoRecepcionProductoEstado } from '../nota-recepcion/nota-recepcion-agrupada/pedido-recepcion-producto-dto.model';
import { SaveRecepcionMercaderiaItemGQL } from './graphql/saveRecepcionMercaderiaItem';
import { RecepcionMercaderiaItemInput } from './recepcion-mercaderia-item.model';
import { RecepcionMercaderiaItem } from './recepcion-mercaderia-item.model';
import { FinalizarRecepcionMercaderiaGQL } from './graphql/finalizarRecepcionMercaderia';
import { ReabrirRecepcionMercaderiaGQL } from './graphql/reabrirRecepcionMercaderia';
import { IniciarRecepcionGQL } from './graphql/iniciarRecepcion';
import { NotaRecepcionItemListPorNotaRecepcionIdGQL, NotaRecepcionItem } from './graphql/notaRecepcionItemListPorNotaRecepcionId';
import { VerificarRecepcionActivaPorNotaYSucursalGQL } from './graphql/verificarRecepcionActivaPorNotaYSucursal';
import { DeshacerVerificacionPorProductoGQL } from './graphql/deshacerVerificacionPorProducto';
import { MainService } from 'src/app/services/main.service';

@Injectable({
  providedIn: 'root',
})
export class RecepcionMercaderiaService {
  constructor(
    private genericService: GenericCrudService,
    private getRecepcionMercaderiaConFiltros: RecepcionMercaderiaConFiltrosGQL,
    private getRecepcionMercaderiaPorId: RecepcionMercaderiaPorIdGQL,
    private getPedidoRecepcionProductoPorRecepcionMercaderia: PedidoRecepcionProductoPorRecepcionMercaderiaGQL,
    private getPedidoRecepcionProductoPorRecepcionMercaderiaAndProducto: PedidoRecepcionProductoPorRecepcionMercaderiaAndProductoGQL,
    private saveRecepcionMercaderiaItem: SaveRecepcionMercaderiaItemGQL,
    private finalizarRecepcionMercaderia: FinalizarRecepcionMercaderiaGQL,
    private reabrirRecepcionMercaderia: ReabrirRecepcionMercaderiaGQL,
    private iniciarRecepcion: IniciarRecepcionGQL,
    private getNotaRecepcionItemListPorNotaRecepcionId: NotaRecepcionItemListPorNotaRecepcionIdGQL,
    private verificarRecepcionActivaPorNotaYSucursal: VerificarRecepcionActivaPorNotaYSucursalGQL,
    private deshacerVerificacionPorProducto: DeshacerVerificacionPorProductoGQL,
    private mainService: MainService
  ) {}

  async onGetRecepcionMercaderiaListPorUsuarioId(
    id: number,
    page: number,
    size: number
  ): Promise<Observable<PageInfo<RecepcionMercaderia>>> {
    return await this.genericService.onCustomGet(
      this.getRecepcionMercaderiaConFiltros,
      { usuarioId: id, page, size }
    );
  }

  async onGetRecepcionMercaderiaPorId(
    id: number
  ): Promise<Observable<RecepcionMercaderia>> {
    return await this.genericService.onGetById(this.getRecepcionMercaderiaPorId, id);
  }

  async onGetPedidoRecepcionProductoPorRecepcionMercaderia(
    recepcionId: number,
    estado: PedidoRecepcionProductoEstado,
    page: number,
    size: number
  ): Promise<Observable<PageInfo<PedidoRecepcionProductoDto>>> {
    return await this.genericService.onCustomGet(
      this.getPedidoRecepcionProductoPorRecepcionMercaderia,
      { recepcionMercaderiaId: recepcionId, estado, page, size }
    );
  }

  async onGetPedidoRecepcionProductoPorRecepcionMercaderiaAndProducto(
    recepcionId: number,
    productoId: number,
    estado: PedidoRecepcionProductoEstado
  ): Promise<Observable<PedidoRecepcionProductoDto>> {
    return await this.genericService.onCustomGet(
      this.getPedidoRecepcionProductoPorRecepcionMercaderiaAndProducto,
      { recepcionMercaderiaId: recepcionId, productoId, estado }
    );
  }

  async onSaveRecepcionMercaderiaItem(
    input: RecepcionMercaderiaItemInput
  ): Promise<Observable<RecepcionMercaderiaItem>> {
    return await this.genericService.onCustomSave(
      this.saveRecepcionMercaderiaItem,
      { entity: input }
    );
  }

  async onFinalizarRecepcionMercaderia(
    id: number
  ): Promise<Observable<RecepcionMercaderia>> {
    return await this.genericService.onCustomSave(
      this.finalizarRecepcionMercaderia,
      { recepcionId: id }
    );
  }

  async onReabrirRecepcionMercaderia(
    id: number
  ): Promise<Observable<RecepcionMercaderia>> {
    return await this.genericService.onCustomSave(
      this.reabrirRecepcionMercaderia,
      { recepcionId: id }
    );
  }

  async onIniciarRecepcion(
    sucursalId: number,
    notaRecepcionIds: number[],
    proveedorId: number,
    monedaId: number,
    usuarioId: number,
    cotizacion?: number
  ): Promise<Observable<RecepcionMercaderia>> {
    return await this.genericService.onCustomSave(
      this.iniciarRecepcion,
      {
        sucursalId,
        notaRecepcionIds,
        proveedorId,
        monedaId,
        usuarioId,
        cotizacion: cotizacion || 1.0
      }
    );
  }

  /**
   * Helper: Busca NotaRecepcionItem por productoId y recepcionMercaderiaId
   * Obtiene todas las notas asociadas a la recepción y busca el item por productoId
   * RETORNA SOLO EL PRIMER ITEM ENCONTRADO (para compatibilidad con código existente)
   * @deprecated Use onBuscarNotaRecepcionItemsPorProductoYRecepcion para obtener todos los items
   */
  async onBuscarNotaRecepcionItemPorProductoYRecepcion(
    recepcionMercaderiaId: number,
    productoId: number
  ): Promise<Observable<NotaRecepcionItem>> {
    return new Observable((obs) => {
      this.onBuscarNotaRecepcionItemsPorProductoYRecepcion(recepcionMercaderiaId, productoId).then((itemsObs) => {
        itemsObs
          .pipe(first())
          .subscribe(
            (items) => {
              if (items && items.length > 0) {
                obs.next(items[0]); // Retornar solo el primero para compatibilidad
                obs.complete();
              } else {
                obs.error(new Error('NotaRecepcionItem no encontrado para el producto especificado'));
              }
            },
            (error) => {
              obs.error(error);
            }
          );
      });
    });
  }

  /**
   * Helper: Busca TODOS los NotaRecepcionItem por productoId y recepcionMercaderiaId
   * Obtiene todas las notas asociadas a la recepción y busca todos los items del mismo producto
   * Esto es necesario cuando múltiples notas tienen el mismo producto para mantener trazabilidad
   */
  async onBuscarNotaRecepcionItemsPorProductoYRecepcion(
    recepcionMercaderiaId: number,
    productoId: number
  ): Promise<Observable<NotaRecepcionItem[]>> {
    return new Observable((obs) => {
      // 1. Obtener recepcion con notas
      this.onGetRecepcionMercaderiaPorId(recepcionMercaderiaId).then((recepcionObs) => {
        recepcionObs
          .pipe(first())
          .subscribe(
            async (recepcion) => {
              if (!recepcion || !recepcion.notas || recepcion.notas.length === 0) {
                obs.error(new Error('No se encontraron notas asociadas a la recepción'));
                return;
              }

              const itemsEncontrados: NotaRecepcionItem[] = [];

              // 2. Para cada nota, obtener items
              for (const nota of recepcion.notas) {
                try {
                  const itemsObs = await this.genericService.onCustomGet(
                    this.getNotaRecepcionItemListPorNotaRecepcionId,
                    { id: nota.id }
                  );
                  const items = await itemsObs
                    .pipe(
                      first(),
                      map((response: any) => response || [])
                    )
                    .toPromise();

                  // 3. Filtrar items por productoId y agregar a la lista
                  const itemsProducto = items.filter((i: NotaRecepcionItem) => i.producto?.id === productoId);
                  itemsEncontrados.push(...itemsProducto);
                } catch (error) {
                  console.error('Error al obtener items de nota:', error);
                }
              }

              if (itemsEncontrados.length === 0) {
                obs.error(new Error('NotaRecepcionItem no encontrado para el producto especificado'));
              } else {
                obs.next(itemsEncontrados);
                obs.complete();
              }
            },
            (error) => {
              obs.error(error);
            }
          );
      });
    });
  }

  /**
   * Verifica si existe una recepción activa para una nota en una sucursal específica
   */
  async onVerificarRecepcionActivaPorNotaYSucursal(
    notaRecepcionId: number,
    sucursalRecepcionId: number
  ): Promise<Observable<RecepcionMercaderia>> {
    return await this.genericService.onCustomGet(
      this.verificarRecepcionActivaPorNotaYSucursal,
      { notaRecepcionId, sucursalRecepcionId }
    );
  }

  /**
   * Deshace la verificación de todos los items de un producto en una recepción
   * Útil cuando el producto proviene de múltiples notas (distribución automática)
   */
  async onDeshacerVerificacionPorProducto(
    recepcionMercaderiaId: number,
    productoId: number
  ): Promise<Observable<boolean>> {
    return await this.genericService.onCustomSave(
      this.deshacerVerificacionPorProducto,
      { recepcionMercaderiaId, productoId }
    );
  }
}
