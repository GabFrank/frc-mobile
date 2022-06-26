import { CargandoService } from './../../services/cargando.service';
import { NotificacionService } from './../../services/notificacion.service';
import { untilDestroyed, UntilDestroy } from '@ngneat/until-destroy';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { GenericCrudService } from 'src/app/generic/generic-crud.service';
import { serverAdress } from 'src/environments/environment';
import { PreRegistroFuncionario } from './funcionario.model';
import { DeletePreRegistroFuncionarioGQL } from './graphql/deletePreRegistroFuncionario';
import { PreRegistroFuncionarioByIdGQL } from './graphql/preRegistroFuncionarioById';
import { PreRegistroFuncionarioesGQL } from './graphql/preRegistroFuncionariosQuery';
import { SavePreRegistroFuncionarioGQL } from './graphql/savePreRegistroFuncionario';

@UntilDestroy()
@Injectable({
  providedIn: 'root'
})
export class FuncionarioService {

  constructor(
    private genericCrud: GenericCrudService,
    private getPreRegistroFuncionario: PreRegistroFuncionarioByIdGQL,
    private getPreRegistroFuncionarioes: PreRegistroFuncionarioesGQL,
    private savePreRegistroFuncionario: SavePreRegistroFuncionarioGQL,
    private deletePreRegistroFuncionario: DeletePreRegistroFuncionarioGQL,
    private http: HttpClient,
    private notificacionService: NotificacionService,
    private cargandoService: CargandoService
  ) { }

  async onGetPreRegistroFuncionario(id): Promise<Observable<PreRegistroFuncionario>> {
    return await this.genericCrud.onGetById(this.getPreRegistroFuncionario, id);
  }

  async onGetPreRegistroFuncionarioes(sucursalId: number): Promise<Observable<PreRegistroFuncionario[]>> {
    return await this.genericCrud.onGetById(this.getPreRegistroFuncionarioes, sucursalId);
  }

  async onSavePreRegistroFuncionario(input): Promise<Observable<boolean>> {
    let loading = await this.cargandoService.open()
    console.log(input)
    let httpOptions = {
      headers: new HttpHeaders({
        Accept: "application/json",
        "Content-Type": "application/json",
      }),
    };

    return new Observable(obs => {
      this.http.post<PreRegistroFuncionario>(
        `http://${serverAdress.serverIp}:${serverAdress.serverPort}/config/pre-registro`,
        input,
        httpOptions
      ).pipe(untilDestroyed(this)).subscribe(res => {
        this.cargandoService.close(loading)
        if(res?.id!=null){
          obs.next(true)
          this.notificacionService.openGuardadoConExito()
        } else {
          obs.next(false)
        }
      })
    })
  }

  async onDeletePreRegistroFuncionario(id): Promise<Observable<boolean>> {
    return await this.genericCrud.onDelete(this.deletePreRegistroFuncionario, id)
  }
}
