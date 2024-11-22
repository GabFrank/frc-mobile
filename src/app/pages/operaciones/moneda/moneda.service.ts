import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { MonedasGetAllGQL } from './graphql/monedasGetAll';
import { Moneda } from './moneda.model';

import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { GenericCrudService } from 'src/app/generic/generic-crud.service';

@UntilDestroy({ checkProperties: true })
@Injectable({
  providedIn: 'root'
})
export class MonedaService {

  monedaList: Moneda[]

  constructor(
    private getAllMonedas: MonedasGetAllGQL,
    private genericService: GenericCrudService
  ) {
  }

  async onGetAll(): Promise<Observable<Moneda[]>> {
    return await this.genericService.onGetAll(this.getAllMonedas);
  }
}
