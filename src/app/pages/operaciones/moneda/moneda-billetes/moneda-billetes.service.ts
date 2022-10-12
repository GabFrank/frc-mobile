import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { GenericCrudService } from 'src/app/generic/generic-crud.service';
import { MonedaBilletesPorMonedaIdGQL } from './graphql/monedaBilletesPorMonedaId';

@Injectable({
  providedIn: 'root'
})
export class MonedaBilletesService {

  constructor(
    private genericService: GenericCrudService,
    private monedaBilletesPorMonedaId: MonedaBilletesPorMonedaIdGQL
  ) { }

  // onGetAll(): Observable<any> {
  //   return this.genericService.onGetAll(this.getAllMonedaBilletess);
  // }

  async onGetByMonedaId(id): Promise<Observable<any>>{
    return await this.genericService.onGetById(this.monedaBilletesPorMonedaId, id);
  }
}
