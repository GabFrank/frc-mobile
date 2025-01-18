import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { DeleteNotaRecepcionGQL } from './graphql/deleteNotaRecepcion';
import { NotaRecepcionPorIdGQL } from './graphql/getNotaRecepcionPorId';
import { NotaRecepcionPorPedidoIdGQL } from './graphql/notaRecepcionPorPedidoId';
import { SaveNotaRecepcionGQL } from './graphql/saveNotaRecepcion';
import { NotaRecepcion, NotaRecepcionInput } from './nota-recepcion.model';
import { PageInfo } from '../../../../app.component';
import { NotaRecepcionPorIdAndNumeroGQL } from './graphql/getNotaRecepcionPorIdAndNumero';
import { CountNotaRecepcionPorPedidoIdGQL } from './graphql/countNotaRecepcionPorPedido';
import { GenericCrudService } from 'src/app/generic/generic-crud.service';

@Injectable({
  providedIn: 'root'
})
export class NotaRecepcionService {
  constructor(
    private genericService: GenericCrudService,
    private getNotaRecepcion: NotaRecepcionPorIdGQL,
    private getnotaRecepcionPorPedidoId: NotaRecepcionPorPedidoIdGQL,
    private saveNotaRecepcion: SaveNotaRecepcionGQL,
    private deleteNotaRecepcion: DeleteNotaRecepcionGQL,
    private notaRecepcionPorPedidoAndNumero: NotaRecepcionPorIdAndNumeroGQL,
    private countNotaRecepcionPorPedido: CountNotaRecepcionPorPedidoIdGQL
  ) {}

  async onGetNotaRecepcion(id): Promise<Observable<NotaRecepcion>> {
    return await this.genericService.onGetById(this.getNotaRecepcion, id);
  }
  async onGetNotaRecepcionPorPedidoId(
    id
  ): Promise<Observable<NotaRecepcion[]>> {
    return await this.genericService.onGetById(
      this.getnotaRecepcionPorPedidoId,
      id
    );
  }
  async onSaveNotaRecepcion(
    input: NotaRecepcionInput
  ): Promise<Observable<NotaRecepcion>> {
    return await this.genericService.onSave(this.saveNotaRecepcion, input);
  }
  async onDeleteNotaRecepcion(id): Promise<Observable<boolean>> {
    return await this.genericService.onDelete(this.deleteNotaRecepcion, id);
  }
  async onGetNotaRecepcionPorPedidoIdAndNumero(
    id,
    numero,
    page,
    size
  ): Promise<Observable<PageInfo<NotaRecepcion>>> {
    return await this.genericService.onCustomGet(
      this.notaRecepcionPorPedidoAndNumero,
      { id, numero, page, size }
    );
  }

  async onCountNotaRecepcionPorPedido(id): Promise<Observable<number>> {
    return await this.genericService.onCustomGet(
      this.countNotaRecepcionPorPedido,
      {
        id
      }
    );
  }
}
