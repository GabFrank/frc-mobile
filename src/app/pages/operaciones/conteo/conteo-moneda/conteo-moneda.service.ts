import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { GenericCrudService } from 'src/app/generic/generic-crud.service';
import { DeleteConteoMonedaGQL } from './graphql/deleleConteoMoneda';
import { SaveConteoMonedaGQL } from './graphql/saveConteoMoneda';

@Injectable({
  providedIn: 'root'
})
export class ConteoMonedaService {

  constructor(
    private genericService: GenericCrudService,
    private onSaveConteoMoneda: SaveConteoMonedaGQL,
    private deleteConteoMoneda: DeleteConteoMonedaGQL
  ) { }

  async onSave(input): Promise<Observable<any>> {
    return await this.genericService.onSave(this.onSaveConteoMoneda, input);
  }

  async onDelete(id): Promise<Observable<any>>{
    return await this.genericService.onDelete(this.deleteConteoMoneda, id);
  }}
