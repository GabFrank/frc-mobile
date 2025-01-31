import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { PageInfo } from "src/app/app.component";
import { GenericCrudService } from "src/app/generic/generic-crud.service";
import { NotaRecepcionAgrupadaPorProveedorIdGQL } from "./graphql/notaRecepcionAgrupadaPorNotaRecepcionId";
import { NotaRecepcionListPorUsuarioIdGQL } from "./graphql/notaRecepcionListPorUsuarioId";
import { SaveNotaRecepcionAgrupadaGQL } from "./graphql/saveNotaRecepcionAgrupada";
import { NotaRecepcionAgrupada, NotaRecepcionAgrupadaInput } from "./nota-recepcion-agrupada.model";
import { NotaRecepcionAgrupadaPorIdGQL } from "./graphql/notaRecepcionAgrupadaPorId";

@Injectable({
  providedIn: 'root',
})
export class NotaRecepcionAgrupadaService {
  constructor(
    private genericService: GenericCrudService,
    private getNotaRecepcionAgrupadaPorNotaRecepcionId: NotaRecepcionAgrupadaPorProveedorIdGQL,
    private getNotaRecepcionAgrupadaListPorUsuarioId: NotaRecepcionListPorUsuarioIdGQL,
    private saveNotaRecepcionAgrupada: SaveNotaRecepcionAgrupadaGQL,
    private notaRecepcionAgrupadaPorId: NotaRecepcionAgrupadaPorIdGQL
  ) {}

  async onGetNotaRecepcionAgrupadaPorNotaRecepcionId(
    id,
    page,
    size
  ): Promise<Observable<PageInfo<NotaRecepcionAgrupada>>> {
    return await this.genericService.onGetById(this.getNotaRecepcionAgrupadaPorNotaRecepcionId, id);
  }

  async onGetNotaRecepcionAgrupadaListPorUsuarioId(
    id,
    page,
    size
  ): Promise<Observable<PageInfo<NotaRecepcionAgrupada>>> {
    return await this.genericService.onCustomGet(
      this.getNotaRecepcionAgrupadaListPorUsuarioId,
      { id, page, size }
    );
  }

  async onSaveNotaRecepcionAgrupada(
    input: NotaRecepcionAgrupadaInput
  ): Promise<Observable<NotaRecepcionAgrupada>> {
    return await this.genericService.onSave(this.saveNotaRecepcionAgrupada, input);
  }

  async onGetNotaRecepcionAgrupadaPorId(id): Promise<Observable<NotaRecepcionAgrupada>>{
    return await this.genericService.onGetById(this.notaRecepcionAgrupadaPorId, id);
  }
}
