import { Injectable } from "@angular/core";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { Observable } from "rxjs";
import { GenericCrudService } from "src/app/generic/generic-crud.service";
import { MainService } from "src/app/services/main.service";
import { NotificacionService } from "src/app/services/notificacion.service";
import { ConteoMonedaInput } from "./conteo-moneda/conteo-moneda.model";
import { ConteoMonedaService } from "./conteo-moneda/conteo-moneda.service";
import { Conteo } from "./conteo.model";
import { DeleteConteoGQL } from "./graphql/deleleConteo";
import { SaveConteoGQL } from "./graphql/saveConteo";

@UntilDestroy()
@Injectable({
  providedIn: "root",
})
export class ConteoService {
  constructor(
    private genericService: GenericCrudService,
    private onSaveConteo: SaveConteoGQL,
    private deleteConteo: DeleteConteoGQL,
    private conteoMonedaService: ConteoMonedaService,
    private notificacionService: NotificacionService,
    private mainService: MainService
  ) { }

  onSave(conteo: Conteo, cajaId, apertura: boolean, sucId): Observable<any> {
    if(conteo.usuario==null){
      conteo.usuario = this.mainService.usuarioActual;
    }
    let conteoMonedaInputList: ConteoMonedaInput[] = []
    conteo.conteoMonedaList.forEach(c => conteoMonedaInputList.push(c.toInput()))
    return new Observable((obs) => {
      this.onSaveConteo.mutate(
        {
        conteo: conteo.toInput(),
        conteoMonedaInputList,
        cajaId,
        apertura,
        sucId
      },
      { fetchPolicy: 'no-cache', errorPolicy: 'all' })
      .pipe(untilDestroyed(this))
      .subscribe(res => {
        if (res.errors == null) {
          obs.next(res.data['data'])
          this.notificacionService.openGuardadoConExito()
        } else {
          this.notificacionService.openAlgoSalioMal()
          obs.next(null);
        }
      })
    });
  }

  // onSaveInput(input): Observable<any> {
  //   return this.genericService.onSave(this.onSaveConteo, input);
  // }

  // onDelete(id): Observable<any> {
  //   return this.genericService.onDelete(this.deleteConteo, id);
  // }
}
