import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { GenericCrudService } from 'src/app/generic/generic-crud.service';
import { Devolucion, DevolucionInput, DevolucionItem, DevolucionItemInput, MotivoAveria } from './devolucion.model';
import { EstadoDevolucion } from './devolucion.enums';
import { SaveDevolucionGQL } from './graphql/saveDevolucion';
import { SaveDevolucionItemGQL } from './graphql/saveDevolucionItem';
import { AvanzarEstadoDevolucionGQL } from './graphql/avanzarEstadoDevolucion';
import { MotivosAveriaActivosGQL } from './graphql/motivosAveriaActivos';

@Injectable({
  providedIn: 'root',
})
export class DevolucionService {
  constructor(
    private genericService: GenericCrudService,
    private saveDevolucionGQL: SaveDevolucionGQL,
    private saveDevolucionItemGQL: SaveDevolucionItemGQL,
    private avanzarEstadoDevolucionGQL: AvanzarEstadoDevolucionGQL,
    private motivosAveriaActivosGQL: MotivosAveriaActivosGQL
  ) {}

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
