import { Injectable } from '@angular/core';
import { PresentacionPorProductoIdGQL } from './graphql/presentacionPorProductoId';
import { GenericCrudService } from 'src/app/generic/generic-crud.service';
import { Presentacion } from 'src/app/domains/productos/presentacion.model';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PresentacionService {

  constructor(
    private genericService: GenericCrudService,
    private getPresentacionesPorProductoId: PresentacionPorProductoIdGQL,
  ) { }

  async onGetPresentacionesPorProductoId(id): Promise<Observable<Presentacion[]>>{
     return (await this.genericService.onGetById(this.getPresentacionesPorProductoId, id));
  }
}
