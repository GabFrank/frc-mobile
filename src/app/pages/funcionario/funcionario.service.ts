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

  onGetPreRegistroFuncionario(id): Observable<PreRegistroFuncionario> {
    return this.genericCrud.onGetById(this.getPreRegistroFuncionario, id);
  }

  onGetPreRegistroFuncionarioes(sucursalId: number): Observable<PreRegistroFuncionario[]> {
    return this.genericCrud.onGetById(this.getPreRegistroFuncionarioes, sucursalId);
  }

  onSavePreRegistroFuncionario(input): Observable<boolean> {
    this.cargandoService.open()
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
        this.cargandoService.close()
        if(res?.id!=null){
          obs.next(true)
          this.notificacionService.openGuardadoConExito()
        } else {
          obs.next(false)
        }
      })
    })
  }

  onDeletePreRegistroFuncionario(id): Observable<boolean> {
    return this.genericCrud.onDelete(this.deletePreRegistroFuncionario, id)
  }
}
