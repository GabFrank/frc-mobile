import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { GenericCrudService } from 'src/app/generic/generic-crud.service';
import { SolicitudPagoGQL } from './graphql/solicitudPago';
import { SolicitudPagoPorUsuarioIdGQL } from './graphql/solicitudPagoPorUsuarioId';
import { SaveSolicitudPagoGQL } from './graphql/saveSolicitudPago';
import { SolicitudPago, SolicitudPagoInput } from './solicitud-pago.model';

@Injectable({
  providedIn: 'root'
})
export class SolicitudPagoService {
  constructor(
    private genericService: GenericCrudService,
    private getSolicitudPago: SolicitudPagoGQL,
    private getSolicitudPagoPorUsuarioId: SolicitudPagoPorUsuarioIdGQL,
    private saveSolicitudPago: SaveSolicitudPagoGQL
  ) {}

  async onGetSolicitudPago(id): Promise<Observable<SolicitudPago>> {
    return await this.genericService.onGetById(this.getSolicitudPago, id);
  }

  async onGetSolicitudPagoPorUsuarioId(
    id
  ): Promise<Observable<SolicitudPago[]>> {
    return await this.genericService.onGetById(
      this.getSolicitudPagoPorUsuarioId,
      id
    );
  }

  async onSaveSolicitudPago(
    input: SolicitudPagoInput
  ): Promise<Observable<SolicitudPago>> {
    return await this.genericService.onSave(this.saveSolicitudPago, input);
  }
} 