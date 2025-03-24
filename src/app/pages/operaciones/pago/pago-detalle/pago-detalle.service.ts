import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { GenericCrudService } from 'src/app/generic/generic-crud.service';
import { PagoDetalleGQL } from './graphql/pagoDetalle';
import { SavePagoDetalleGQL } from './graphql/savePagoDetalle';
import { PagoDetalle, PagoDetalleInput } from './pago-detalle.model';

@Injectable({
  providedIn: 'root'
})
export class PagoDetalleService {
  constructor(
    private genericService: GenericCrudService,
    private getPagoDetalle: PagoDetalleGQL,
    private savePagoDetalle: SavePagoDetalleGQL
  ) {}

  async onGetPagoDetalle(id): Promise<Observable<PagoDetalle>> {
    return await this.genericService.onGetById(this.getPagoDetalle, id);
  }

  async onSavePagoDetalle(
    input: PagoDetalleInput
  ): Promise<Observable<PagoDetalle>> {
    return await this.genericService.onSave(this.savePagoDetalle, input);
  }
} 