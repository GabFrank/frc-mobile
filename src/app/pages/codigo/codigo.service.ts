import { Injectable } from "@angular/core";

import { CodigoPorCodigoGQL } from "./graphql/codigoPorCodigo";
import { CodigosPorPresentacionIdGQL } from "./graphql/codigoPorPresentacionId";
import { DeleteCodigoGQL } from "./graphql/deleteCodigo";
import { SaveCodigoGQL } from "./graphql/saveCodigo";

import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { BehaviorSubject, Observable } from "rxjs";
import { Codigo, CodigoInput } from "src/app/domains/productos/codigo.model";
import { MainService } from "src/app/services/main.service";
import { NotificacionService } from "src/app/services/notificacion.service";
import { DialogoService } from "src/app/services/dialogo.service";
import { GenericCrudService } from "src/app/generic/generic-crud.service";

@UntilDestroy({ checkProperties: true })
@Injectable({
  providedIn: "root",
})
export class CodigoService {
  dataOBs = new BehaviorSubject<Codigo[]>(null);

  constructor(
    public mainService: MainService,
    private saveCodigo: SaveCodigoGQL,
    private getCodigosPorPresentacionId: CodigosPorPresentacionIdGQL,
    private deleteCodigo: DeleteCodigoGQL,
    private notificacionService: NotificacionService,
    private getCodigoPorCodigo: CodigoPorCodigoGQL,
    private dialogoService: DialogoService,
    private genericService: GenericCrudService
  ) {}

  async onGetCodigosPorPresentacionId(id): Promise<Observable<Codigo[]>>{
    return await this.genericService.onGetById(this.getCodigosPorPresentacionId, id);
  }

  async onSaveCodigo(input: CodigoInput): Promise<Observable<Codigo>> {
    input.id == null ? (input.activo = true) : null;
    if(input.principal==false) input.principal = null;
    return await this.genericService.onSave(this.saveCodigo, input);
  }

  async onDeleteCodigo(codigo: Codigo): Promise<Observable<any>> {
    return await this.genericService.onDelete(this.deleteCodigo, codigo.id)
  }

  async onGetCodigoPorCodigo(texto: string): Promise<Observable<Codigo[]>>{
    return await this.genericService.onGetByTexto(this.getCodigoPorCodigo, texto);
  }
}
