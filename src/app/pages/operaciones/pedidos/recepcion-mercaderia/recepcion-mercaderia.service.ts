import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { PageInfo } from 'src/app/app.component';
import { GenericCrudService } from 'src/app/generic/generic-crud.service';
import { RecepcionMercaderiaConFiltrosGQL } from './graphql/recepcionMercaderiaConFiltros';
import { RecepcionMercaderia } from './recepcion-mercaderia.model';

@Injectable({
  providedIn: 'root',
})
export class RecepcionMercaderiaService {
  constructor(
    private genericService: GenericCrudService,
    private getRecepcionMercaderiaConFiltros: RecepcionMercaderiaConFiltrosGQL
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
}
