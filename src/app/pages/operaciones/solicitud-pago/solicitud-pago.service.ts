import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { GenericCrudService } from 'src/app/generic/generic-crud.service';
import { SolicitudPagoGQL } from './graphql/solicitudPago';
import { SolicitudesPagoPaginatedGQL } from './graphql/solicitudesPagoPaginated';
import { NotaRecepcionDisponibleParaPagoPorNumeroGQL } from './graphql/notaRecepcionDisponibleParaPagoPorNumero';
import { DatosInicialesSolicitudPagoPorRecepcionGQL } from './graphql/datosInicialesSolicitudPagoPorRecepcion';
import { SaveSolicitudPagoGQL } from './graphql/saveSolicitudPago';
import { ImprimirSolicitudPagoPDFGQL } from './graphql/imprimirSolicitudPagoPDF';
import { SolicitudPago, SolicitudPagoInput, SolicitudPagoPage } from './solicitud-pago.model';
import { NotaRecepcion } from 'src/app/pages/operaciones/pedidos/nota-recepcion/nota-recepcion.model';
import { DatosInicialesSolicitudPago } from './graphql/datosInicialesSolicitudPagoPorRecepcion';

@Injectable({
  providedIn: 'root'
})
export class SolicitudPagoService {
  constructor(
    private genericService: GenericCrudService,
    private getSolicitudPago: SolicitudPagoGQL,
    private solicitudesPagoPaginated: SolicitudesPagoPaginatedGQL,
    private notaRecepcionDisponiblePorNumero: NotaRecepcionDisponibleParaPagoPorNumeroGQL,
    private datosInicialesPorRecepcion: DatosInicialesSolicitudPagoPorRecepcionGQL,
    private saveSolicitudPago: SaveSolicitudPagoGQL,
    private imprimirSolicitudPagoPDF: ImprimirSolicitudPagoPDFGQL
  ) {}

  onGetSolicitudPago(id: number): Promise<Observable<SolicitudPago>> {
    return this.genericService.onGetById(this.getSolicitudPago, id);
  }

  onSolicitudesPagoPaginated(
    page: number,
    size: number,
    proveedorId?: number,
    estado?: string
  ): Promise<Observable<SolicitudPagoPage>> {
    return this.genericService.onGet(
      this.solicitudesPagoPaginated,
      { page, size, proveedorId, estado },
      false
    );
  }

  onNotaRecepcionDisponibleParaPagoPorNumero(
    numero: number,
    proveedorId: number
  ): Promise<Observable<NotaRecepcion>> {
    return this.genericService.onCustomGet(
      this.notaRecepcionDisponiblePorNumero,
      { numero, proveedorId },
      true,
      true
    );
  }

  onDatosInicialesSolicitudPagoPorRecepcion(
    recepcionMercaderiaId: number
  ): Promise<Observable<DatosInicialesSolicitudPago>> {
    return this.genericService.onCustomGet(
      this.datosInicialesPorRecepcion,
      { recepcionMercaderiaId },
      true,
      true
    );
  }

  onSaveSolicitudPago(input: SolicitudPagoInput): Promise<Observable<SolicitudPago>> {
    return this.genericService.onSave(this.saveSolicitudPago, input);
  }

  onImprimirSolicitudPagoPDF(solicitudPagoId: number): Promise<Observable<string>> {
    return this.genericService.onCustomSave(this.imprimirSolicitudPagoPDF, { solicitudPagoId });
  }
}
