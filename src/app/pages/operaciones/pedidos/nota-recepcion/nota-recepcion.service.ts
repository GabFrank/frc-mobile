import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { GenericCrudService } from 'src/app/generic/generic-crud.service';
import { PageInfo } from '../../../../app.component';
import { CountNotaRecepcionPorPedidoIdGQL } from './graphql/countNotaRecepcionPorPedido';
import { DeleteNotaRecepcionGQL } from './graphql/deleteNotaRecepcion';
import { NotaRecepcionPorIdGQL } from './graphql/getNotaRecepcionPorId';
import { NotaRecepcionPorIdAndNumeroGQL } from './graphql/getNotaRecepcionPorIdAndNumero';
import { NotaRecepcionPorProveedorAndNumeroGQL } from './graphql/getNotaRecepcionPorOriveedorAndNumero';
import { NotaRecepcionPorPedidoIdGQL } from './graphql/notaRecepcionPorPedidoId';
import { NotaRecepcionPorNotaRecepcionAgrupadaIdGQL } from './graphql/notaRecepcionPorNotaRecepcionAgrupadaId';
import { NotaRecepcionPorNumeroGQL } from './graphql/getNotaRecepcionPorNumero';
import { SaveNotaRecepcionGQL } from './graphql/saveNotaRecepcion';
import { NotaRecepcion, NotaRecepcionInput } from './nota-recepcion.model';
import { NotasDisponiblesParaRecepcionGQL } from './graphql/getNotasDisponiblesParaRecepcion';

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
    private countNotaRecepcionPorPedido: CountNotaRecepcionPorPedidoIdGQL,
    private getNotaRecepcionPorProveedorAndNumero: NotaRecepcionPorProveedorAndNumeroGQL,
    private notaRecepcionPorNotaRecepcionAgrupadaId: NotaRecepcionPorNotaRecepcionAgrupadaIdGQL,
    private getNotaRecepcionPorNumero: NotaRecepcionPorNumeroGQL,
    private getNotasDisponiblesParaRecepcion: NotasDisponiblesParaRecepcionGQL
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

  async onGetNotaRecepcionPorProveedorAndNumero(
    id,
    numero
  ): Promise<Observable<NotaRecepcion[]>> {
    return await this.genericService.onCustomGet(
      this.getNotaRecepcionPorProveedorAndNumero,
      { id, numero }, true
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

  async onGetNotaRecepcionPorNotaRecepcionAgrupadaId(
    id
  ): Promise<Observable<NotaRecepcion[]>> {
    return await this.genericService.onGetById(
      this.notaRecepcionPorNotaRecepcionAgrupadaId,
      id
    );
  }

  async onGetNotaRecepcionPorNumero(
    numero
  ): Promise<Observable<NotaRecepcion[]>> {
    return await this.genericService.onCustomGet(
      this.getNotaRecepcionPorNumero,
      { numero }, true
    );
  }

  async onGetNotasDisponiblesParaRecepcion(
    numero?: number,
    proveedorId?: number,
    sucursalId?: number
  ): Promise<Observable<NotaRecepcion[]>> {
    return await this.genericService.onCustomGet(
      this.getNotasDisponiblesParaRecepcion,
      { numero, proveedorId, sucursalId }, true
    );
  }
}
