import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { GenericCrudService } from 'src/app/generic/generic-crud.service';
import { Devolucion, DevolucionInput, DevolucionItem, DevolucionItemInput, MotivoAveria } from './devolucion.model';
import { EstadoDevolucion } from './devolucion.enums';
import { SaveDevolucionGQL } from './graphql/saveDevolucion';
import { SaveDevolucionItemGQL } from './graphql/saveDevolucionItem';
import { AvanzarEstadoDevolucionGQL } from './graphql/avanzarEstadoDevolucion';
import { MotivosAveriaActivosGQL } from './graphql/motivosAveriaActivos';
import { DevolucionConFiltrosGQL } from './graphql/devolucionConFiltros';
import { DevolucionByIdGQL } from './graphql/devolucionById';
import { DeleteDevolucionItemGQL } from './graphql/deleteDevolucionItem';
import { EtiquetasSeparadoPdfGQL } from './graphql/etiquetasSeparadoPdf';
import { ColectarDevolucionesEnBloqueGQL } from './graphql/colectarDevolucionesEnBloque';
import { RevertirEstadoDevolucionGQL } from './graphql/revertirEstadoDevolucion';
import { RemitoRetiroProveedorGQL } from './graphql/remitoRetiroProveedor';
import { RetirosDevolucionGQL } from './graphql/retirosDevolucion';
import { ColectasDevolucionGQL } from './graphql/colectasDevolucion';
import { RemitoRetiroGQL } from './graphql/remitoRetiro';
import { RevertirRetiroDevolucionGQL } from './graphql/revertirRetiroDevolucion';
import { RevertirColectaDevolucionGQL } from './graphql/revertirColectaDevolucion';

@Injectable({
  providedIn: 'root',
})
export class DevolucionService {
  constructor(
    private genericService: GenericCrudService,
    private saveDevolucionGQL: SaveDevolucionGQL,
    private saveDevolucionItemGQL: SaveDevolucionItemGQL,
    private avanzarEstadoDevolucionGQL: AvanzarEstadoDevolucionGQL,
    private motivosAveriaActivosGQL: MotivosAveriaActivosGQL,
    private devolucionConFiltrosGQL: DevolucionConFiltrosGQL,
    private devolucionByIdGQL: DevolucionByIdGQL,
    private deleteDevolucionItemGQL: DeleteDevolucionItemGQL,
    private etiquetasSeparadoPdfGQL: EtiquetasSeparadoPdfGQL,
    private colectarDevolucionesEnBloqueGQL: ColectarDevolucionesEnBloqueGQL,
    private revertirEstadoDevolucionGQL: RevertirEstadoDevolucionGQL,
    private remitoRetiroProveedorGQL: RemitoRetiroProveedorGQL,
    private retirosDevolucionGQL: RetirosDevolucionGQL,
    private colectasDevolucionGQL: ColectasDevolucionGQL,
    private remitoRetiroGQL: RemitoRetiroGQL,
    private revertirRetiroDevolucionGQL: RevertirRetiroDevolucionGQL,
    private revertirColectaDevolucionGQL: RevertirColectaDevolucionGQL
  ) {}

  /** Historial de operaciones de retiro (cabeceras) paginado. */
  async onGetRetiros(page = 0, size = 20): Promise<Observable<any>> {
    return await this.genericService.onGetCustom(this.retirosDevolucionGQL, { page, size });
  }

  /** Historial de operaciones de colecta (cabeceras) paginado. */
  async onGetColectas(page = 0, size = 20): Promise<Observable<any>> {
    return await this.genericService.onGetCustom(this.colectasDevolucionGQL, { page, size });
  }

  /** PDF (base64) del comprobante de una operacion de retiro completa. */
  async onGetRemitoRetiro(retiroId: number): Promise<Observable<string>> {
    return await this.genericService.onGetCustom(this.remitoRetiroGQL, { retiroId });
  }

  async onRevertirRetiro(retiroId: number, usuarioId?: number): Promise<Observable<any>> {
    return await this.genericService.onCustomSave(
      this.revertirRetiroDevolucionGQL,
      { retiroId, usuarioId: usuarioId ?? null },
      false
    );
  }

  async onRevertirColecta(colectaId: number, usuarioId?: number): Promise<Observable<any>> {
    return await this.genericService.onCustomSave(
      this.revertirColectaDevolucionGQL,
      { colectaId, usuarioId: usuarioId ?? null },
      false
    );
  }

  /** Revierte la devolucion un estado hacia atras (solo transiciones seguras). */
  async onRevertirEstado(devolucionId: number, usuarioId?: number): Promise<Observable<any>> {
    return await this.genericService.onCustomSave(
      this.revertirEstadoDevolucionGQL,
      { devolucionId, usuarioId: usuarioId ?? null },
      false
    );
  }

  /** PDF (base64) del comprobante de retiro consolidado. */
  async onGetRemito(devolucionIds: number[]): Promise<Observable<string>> {
    return await this.genericService.onGetCustom(this.remitoRetiroProveedorGQL, { devolucionIds });
  }

  async onGetDevolucionById(id: number): Promise<Observable<Devolucion>> {
    return await this.genericService.onGetCustom(this.devolucionByIdGQL, { id });
  }

  async onDeleteDevolucionItem(id: number): Promise<Observable<boolean>> {
    return await this.genericService.onCustomSave(this.deleteDevolucionItemGQL, { id });
  }

  /** PDF A4 (base64) de etiquetas de separado para identificacion. */
  async onGetEtiquetasSeparadoPdf(devolucionId: number): Promise<Observable<string>> {
    return await this.genericService.onGetCustom(this.etiquetasSeparadoPdfGQL, { devolucionId });
  }

  /** Colecta interna en bloque: mueve las devoluciones separadas a un deposito. */
  async onColectarEnBloque(
    devolucionIds: number[],
    sucursalDestinoId: number,
    usuarioId?: number
  ): Promise<Observable<{ resultados: { id: number; ok: boolean; mensaje: string }[] }>> {
    return await this.genericService.onCustomSave(
      this.colectarDevolucionesEnBloqueGQL,
      { devolucionIds, sucursalDestinoId, usuarioId: usuarioId ?? null },
      false
    );
  }

  /** Lista paginada de devoluciones filtrada por usuario/sucursal/estado. */
  async onGetDevolucionesConFiltros(filtros: {
    usuarioId?: number;
    sucursalId?: number;
    estado?: EstadoDevolucion;
    page?: number;
    size?: number;
  }): Promise<Observable<any>> {
    return await this.genericService.onGetCustom(this.devolucionConFiltrosGQL, {
      proveedorId: null,
      sucursalId: filtros.sucursalId ?? null,
      estado: filtros.estado ?? null,
      usuarioId: filtros.usuarioId ?? null,
      page: filtros.page ?? 0,
      size: filtros.size ?? 15,
    });
  }

  async onGetMotivosAveriaActivos(): Promise<Observable<MotivoAveria[]>> {
    return await this.genericService.onGetCustom(this.motivosAveriaActivosGQL, {});
  }

  async onSaveDevolucion(input: DevolucionInput): Promise<Observable<Devolucion>> {
    return await this.genericService.onCustomSave(this.saveDevolucionGQL, { entity: input });
  }

  async onSaveDevolucionItem(input: DevolucionItemInput): Promise<Observable<DevolucionItem>> {
    return await this.genericService.onCustomSave(this.saveDevolucionItemGQL, { entity: input });
  }

  async onAvanzarEstado(
    devolucionId: number,
    estado: EstadoDevolucion,
    usuarioId: number
  ): Promise<Observable<Devolucion>> {
    return await this.genericService.onCustomSave(this.avanzarEstadoDevolucionGQL, {
      devolucionId,
      estado,
      usuarioId,
    });
  }
}
