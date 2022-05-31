import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { GenericCrudService } from 'src/app/generic/generic-crud.service';
import { PreRegistroFuncionario } from './funcionario.model';
import { DeletePreRegistroFuncionarioGQL } from './graphql/deletePreRegistroFuncionario';
import { PreRegistroFuncionarioByIdGQL } from './graphql/preRegistroFuncionarioById';
import { PreRegistroFuncionarioesGQL } from './graphql/preRegistroFuncionariosQuery';
import { SavePreRegistroFuncionarioGQL } from './graphql/savePreRegistroFuncionario';

@Injectable({
  providedIn: 'root'
})
export class FuncionarioService {

  constructor(
    private genericCrud: GenericCrudService,
    private getPreRegistroFuncionario: PreRegistroFuncionarioByIdGQL,
    private getPreRegistroFuncionarioes: PreRegistroFuncionarioesGQL,
    private savePreRegistroFuncionario: SavePreRegistroFuncionarioGQL,
    private deletePreRegistroFuncionario: DeletePreRegistroFuncionarioGQL
    ) { }

  onGetPreRegistroFuncionario(id): Observable<PreRegistroFuncionario>{
    return this.genericCrud.onGetById(this.getPreRegistroFuncionario, id);
  }

  onGetPreRegistroFuncionarioes(sucursalId: number): Observable<PreRegistroFuncionario[]>{
    return this.genericCrud.onGetById(this.getPreRegistroFuncionarioes, sucursalId);
  }

  onSavePreRegistroFuncionario(input): Observable<PreRegistroFuncionario>{
    return this.genericCrud.onSave(this.savePreRegistroFuncionario, input);
  }

  onDeletePreRegistroFuncionario(id): Observable<boolean>{
    return this.genericCrud.onDelete(this.deletePreRegistroFuncionario, id)
  }}
