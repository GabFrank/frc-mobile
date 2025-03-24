import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { GenericCrudService } from 'src/app/generic/generic-crud.service';
import { PagoGQL } from './graphql/pago';
import { SavePagoGQL } from './graphql/savePago';
import { Pago, PagoInput } from './pago.model';

@Injectable({
  providedIn: 'root'
})
export class PagoService {
  constructor(
    private genericService: GenericCrudService,
    private getPago: PagoGQL,
    private savePago: SavePagoGQL
  ) {}

  async onGetPago(id): Promise<Observable<Pago>> {
    return await this.genericService.onGetById(this.getPago, id);
  }

  async onSavePago(
    input: PagoInput
  ): Promise<Observable<Pago>> {
    return await this.genericService.onSave(this.savePago, input);
  }
} 