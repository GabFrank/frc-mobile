import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { GenericCrudService } from 'src/app/generic/generic-crud.service';
import { AllMaletinsGQL } from './graphql/allMaletines';
import { DeleteMaletinGQL } from './graphql/deleteMaletin';
import { MaletinByIdGQL } from './graphql/MaletinById';
import { MaletinPorDescripcionGQL } from './graphql/maletinPorDescripcion';
import { MaletinPorDescripcionPorSucursalGQL } from './graphql/maletinPorDescripcionPorSucursal';
import { SaveMaletinGQL } from './graphql/saveMaletin';
import { MaletinInput } from './maletin.model';

@Injectable({
  providedIn: 'root'
})
export class MaletinService {

  constructor(
    private getAllMaletines: AllMaletinsGQL,
    private getMaletinPorId: MaletinByIdGQL,
    private genericCrud: GenericCrudService,
    private saveMaletin: SaveMaletinGQL,
    private deleteMaletin: DeleteMaletinGQL,
    private getMaletinPorDescripcion: MaletinPorDescripcionPorSucursalGQL
  ) { }

  async onGetAll(): Promise<Observable<any>>{
    return await this.genericCrud.onGetAll(this.getAllMaletines)
  }

  async onGetPorId(id): Promise<Observable<any>>{
    return await this.genericCrud.onGetById(this.getMaletinPorId, id)
  }

  async onGetPorDescripcion(texto): Promise<Observable<any>>{
    return await this.genericCrud.onGetByTexto(this.getMaletinPorDescripcion, texto)
  }

  async onSave(input: MaletinInput): Promise<Observable<any>>{
    return await this.genericCrud.onSave(this.saveMaletin, input)
  }

  async onDelete(id): Promise<Observable<any>>{
    return await this.genericCrud.onDelete(this.deleteMaletin, id, 'Maletin', `Id: ${id}`)
  }

}
