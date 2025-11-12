import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { GenericCrudService } from 'src/app/generic/generic-crud.service';
import { NotasPendientesQuery, NotasPendientesPageQuery, RecepcionesVigentesQuery, RecepcionMercaderiaItemsPorRecepcionQuery, RecepcionMercaderiaItemsPorRecepcionPaginadosQuery, RecepcionMercaderiaPorIdQuery, FindPendienteRecepcionItemPorProductoQuery } from '../graphql/notasPendientes';
import { ObtenerSumarioRecepcionQuery } from '../graphql/obtenerSumarioRecepcion';
import { ProductosAgrupadosPorNotasQuery } from '../graphql/productosAgrupadosPorNotas';
import { IniciarRecepcionMutation, IniciarRecepcionInput } from '../graphql/iniciarRecepcion';
import { FinalizarRecepcionMutation } from '../graphql/finalizarRecepcion';
import { SaveRecepcionMercaderiaItemMutation, RecepcionMercaderiaItemInput } from '../graphql/saveRecepcionMercaderiaItem';
import { CancelarVerificacionMutation } from '../graphql/cancelarVerificacion';
import { ResetearVerificacionMutation } from '../graphql/resetearVerificacion';
import { CancelarRechazoMutation } from '../graphql/cancelarRechazo';
import { GenerarConstanciaRecepcionPDFQuery } from '../graphql/generarConstanciaRecepcionPDF';
import { NotaRecepcion } from '../../../../domains/operaciones/pedido/nota-recepcion.model';
import { ProductoAgrupadoDTO } from '../graphql/productosAgrupadosPorNotas';
import { RecepcionMercaderiaItem, EstadoVerificacion } from '../../../../domains/operaciones/pedido/recepcion-mercaderia-item.model';
import { RecepcionMercaderia } from '../../../../domains/operaciones/pedido/recepcion-mercaderia.model';

@Injectable({
  providedIn: 'root'
})
export class PedidoService {
  constructor(
    private genericService: GenericCrudService,
    private notasPendientesQuery: NotasPendientesQuery,
    private notasPendientesPageQuery: NotasPendientesPageQuery,
    private recepcionesVigentesQuery: RecepcionesVigentesQuery,
    private productosAgrupadosQuery: ProductosAgrupadosPorNotasQuery,
    private iniciarRecepcionMutation: IniciarRecepcionMutation,
    private finalizarRecepcionMutation: FinalizarRecepcionMutation,
    private saveRecepcionMercaderiaItemMutation: SaveRecepcionMercaderiaItemMutation,
    private cancelarVerificacionMutation: CancelarVerificacionMutation,
  private resetearVerificacionMutation: ResetearVerificacionMutation,
    private cancelarRechazoMutation: CancelarRechazoMutation,
    private generarConstanciaRecepcionPDFQuery: GenerarConstanciaRecepcionPDFQuery,
    private recepcionMercaderiaItemsPorRecepcionQuery: RecepcionMercaderiaItemsPorRecepcionQuery,
    private recepcionMercaderiaItemsPorRecepcionPaginadosQuery: RecepcionMercaderiaItemsPorRecepcionPaginadosQuery,
    private recepcionMercaderiaPorIdQuery: RecepcionMercaderiaPorIdQuery,
    private findPendienteRecepcionItemPorProductoQuery: FindPendienteRecepcionItemPorProductoQuery,
    private obtenerSumarioRecepcionQuery: ObtenerSumarioRecepcionQuery
  ) {}

  async getNotasPendientes(sucursalId: number, proveedorId?: number): Promise<Observable<NotaRecepcion[]>> {
    return await this.genericService.onGet(this.notasPendientesQuery, { sucursalId, proveedorId }) as Observable<NotaRecepcion[]>;
  }

  async getNotasPendientesPage(sucursalId: number, proveedorId?: number): Promise<Observable<any>> {
    return await this.genericService.onGet(this.notasPendientesPageQuery, { sucursalId, proveedorId }) as Observable<any>;
  }

  async getRecepcionesVigentes(sucursalId: number, usuarioId: number, estados: string[] = ['PENDIENTE', 'EN_PROCESO']): Promise<Observable<any>> {
    const params = { sucursalId, usuarioId, estados };
    return await this.genericService.onGet(this.recepcionesVigentesQuery, params) as Observable<any>;
  }

  async getProductosAgrupadosPorNotas(notaRecepcionIds: number[]): Promise<Observable<ProductoAgrupadoDTO[]>> {
    return await this.genericService.onGet(this.productosAgrupadosQuery, { notaRecepcionIds }) as Observable<ProductoAgrupadoDTO[]>;
  }

  async getRecepcionItems(recepcionId: number): Promise<Observable<RecepcionMercaderiaItem[]>> {
    try {
      return this.genericService.onGet(this.recepcionMercaderiaItemsPorRecepcionQuery, { recepcionId: recepcionId.toString() });
    } catch (error) {
      console.error('❌ [PedidoService] Error al obtener ítems de recepción:', error);
      throw error;
    }
  }

  async getRecepcionItemsPaginados(
    recepcionId: number, 
    page: number = 0, 
    size: number = 20, 
    filtroTexto?: string,
    estados?: EstadoVerificacion[]
  ): Promise<Observable<any>> {
    try {
      const variables: any = { 
        recepcionId: recepcionId.toString(),
        page: page,
        size: size
      };
      
      if (filtroTexto && filtroTexto.trim()) {
        variables.filtroTexto = filtroTexto.trim();
      }
      
      if (estados && estados.length > 0) {
        variables.estados = estados;
      }
      
      return this.genericService.onGet(this.recepcionMercaderiaItemsPorRecepcionPaginadosQuery, variables);
    } catch (error) {
      console.error('❌ [PedidoService] Error al obtener ítems de recepción paginados:', error);
      throw error;
    }
  }

  async getRecepcionMercaderia(recepcionId: number): Promise<Observable<RecepcionMercaderia>> {
    try {
      return this.genericService.onGet(this.recepcionMercaderiaPorIdQuery, { id: recepcionId.toString() });
    } catch (error) {
      console.error('❌ [PedidoService] Error al obtener datos de la recepción:', error);
      throw error;
    }
  }

  async findPendienteRecepcionItemPorProducto(recepcionId: number, productoId: number): Promise<Observable<RecepcionMercaderiaItem>> {
    try {
      // Validar que los parámetros no sean undefined o null
      if (!recepcionId || !productoId) {
        throw new Error(`Parámetros inválidos: recepcionId=${recepcionId}, productoId=${productoId}`);
      }
      
      return this.genericService.onCustomGet(this.findPendienteRecepcionItemPorProductoQuery, { 
        recepcionId: recepcionId.toString(), 
        productoId: productoId.toString() 
      });
    } catch (error) {
      console.error('❌ [PedidoService] Error al buscar item pendiente por producto:', error);
      throw error;
    }
  }

  async iniciarRecepcion(input: IniciarRecepcionInput) {
    return await this.genericService.onCustomSave(this.iniciarRecepcionMutation, {
      sucursalId: input.sucursalId,
      notaRecepcionIds: input.notaRecepcionIds,
      proveedorId: input.proveedorId,
      monedaId: input.monedaId,
      usuarioId: input.usuarioId,
      cotizacion: input.cotizacion
    });
  }

  async finalizarRecepcion(recepcionMercaderiaId: number) {
    return await this.genericService.onCustomSave(this.finalizarRecepcionMutation, { recepcionMercaderiaId });
  }

  async saveRecepcionMercaderiaItem(input: RecepcionMercaderiaItemInput) {
    return await this.genericService.onCustomSave(this.saveRecepcionMercaderiaItemMutation, { entity: input });
  }

  async cancelarVerificacion(notaRecepcionItemId: number, sucursalId: number) {
    return await this.genericService.onCustomSave(this.cancelarVerificacionMutation, { notaRecepcionItemId, sucursalId });
  }

  async resetearVerificacion(recepcionMercaderiaItemId: number) {
    return await this.genericService.onCustomSave(this.resetearVerificacionMutation, { recepcionMercaderiaItemId });
  }

  async cancelarRechazo(notaRecepcionItemId: number, sucursalId: number) {
    return await this.genericService.onCustomSave(this.cancelarRechazoMutation, { notaRecepcionItemId, sucursalId });
  }

  async generarConstanciaRecepcionPDF(recepcionId: number) {
    return await this.genericService.onGet(this.generarConstanciaRecepcionPDFQuery, { recepcionId: recepcionId.toString() });
  }

  /**
   * Obtiene el sumario de una recepción de mercadería
   */
  async obtenerSumarioRecepcion(recepcionId: number): Promise<Observable<any>> {
    const variables = {
      recepcionId: recepcionId.toString()
    };
    
    return this.genericService.onGet(this.obtenerSumarioRecepcionQuery, variables);
  }
}