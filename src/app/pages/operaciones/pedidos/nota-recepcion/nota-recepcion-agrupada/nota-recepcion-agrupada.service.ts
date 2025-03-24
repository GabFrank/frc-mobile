import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { PageInfo } from "src/app/app.component";
import { GenericCrudService } from "src/app/generic/generic-crud.service";
import { NotaRecepcionAgrupadaPorProveedorIdGQL } from "./graphql/notaRecepcionAgrupadaPorNotaRecepcionId";
import { NotaRecepcionListPorUsuarioIdGQL } from "./graphql/notaRecepcionListPorUsuarioId";
import { SaveNotaRecepcionAgrupadaGQL } from "./graphql/saveNotaRecepcionAgrupada";
import { NotaRecepcionAgrupada, NotaRecepcionAgrupadaInput } from "./nota-recepcion-agrupada.model";
import { NotaRecepcionAgrupadaPorIdGQL } from "./graphql/notaRecepcionAgrupadaPorId";
import { PedidoRecepcionProductoPorNotaRecepcionAgrupadaGQL } from "./graphql/pedido-recepcion-producto-por-nota-recepcion-agrupada";
import { PedidoRecepcionProductoPorNotaRecepcionAgrupadaAndProductoGQL } from "./graphql/pedido-recepcion-producto-por-nota-recepcion-agrupada-and-producto";
import { PedidoRecepcionProductoDto } from "./pedido-recepcion-producto-dto.model";
import { RecepcionProductoNotaRecepcionAgrupadaGQL } from "./graphql/recepcion-producto-nota-recepcion-agrupada";
import { PedidoRecepcionProductoEstado } from "./pedido-recepcion-producto-dto.model";
import { FinalizarRecepcionGQL } from "./graphql/finalizarRecepcion";
import { ReabrirRecepcionGQL } from "./graphql/reabrirRecepcion";
import { SolicitarPagoNotaRecepcionAgrupadaGQL } from "./graphql/solicitarPagoNotaRecepcionAgrupada";
import { SolicitudPago } from 'src/app/pages/operaciones/solicitud-pago/solicitud-pago.model';

@Injectable({
  providedIn: 'root',
})
export class NotaRecepcionAgrupadaService {
  constructor(
    private genericService: GenericCrudService,
    private getNotaRecepcionAgrupadaPorNotaRecepcionId: NotaRecepcionAgrupadaPorProveedorIdGQL,
    private getNotaRecepcionAgrupadaListPorUsuarioId: NotaRecepcionListPorUsuarioIdGQL,
    private saveNotaRecepcionAgrupada: SaveNotaRecepcionAgrupadaGQL,
    private notaRecepcionAgrupadaPorId: NotaRecepcionAgrupadaPorIdGQL,
    private getPedidoRecepcionProductoPorNotaRecepcionAgrupada: PedidoRecepcionProductoPorNotaRecepcionAgrupadaGQL,
    private getPedidoRecepcionProductoPorNotaRecepcionAgrupadaAndProducto: PedidoRecepcionProductoPorNotaRecepcionAgrupadaAndProductoGQL,
    private recepcionProductoNotaRecepcionAgrupada: RecepcionProductoNotaRecepcionAgrupadaGQL,
    private finalizarRecepcion: FinalizarRecepcionGQL,
    private reabrirRecepcion: ReabrirRecepcionGQL,
    private solicitarPagoNotaRecepcionAgrupada: SolicitarPagoNotaRecepcionAgrupadaGQL
  ) {}

  async onGetNotaRecepcionAgrupadaPorNotaRecepcionId(
    id,
    page,
    size
  ): Promise<Observable<PageInfo<NotaRecepcionAgrupada>>> {
    return await this.genericService.onGetById(this.getNotaRecepcionAgrupadaPorNotaRecepcionId, id);
  }

  async onGetNotaRecepcionAgrupadaListPorUsuarioId(
    id,
    page,
    size
  ): Promise<Observable<PageInfo<NotaRecepcionAgrupada>>> {
    return await this.genericService.onCustomGet(
      this.getNotaRecepcionAgrupadaListPorUsuarioId,
      { id, page, size }
    );
  }

  async onSaveNotaRecepcionAgrupada(
    input: NotaRecepcionAgrupadaInput
  ): Promise<Observable<NotaRecepcionAgrupada>> {
    return await this.genericService.onSave(this.saveNotaRecepcionAgrupada, input);
  }

  async onGetNotaRecepcionAgrupadaPorId(id): Promise<Observable<NotaRecepcionAgrupada>>{
    return await this.genericService.onGetById(this.notaRecepcionAgrupadaPorId, id);
  }

  async onGetPedidoRecepcionProductoPorNotaRecepcionAgrupada(
    id: number,
    estado?: PedidoRecepcionProductoEstado,
    page: number = 0,
    size: number = 10
  ): Promise<Observable<PageInfo<PedidoRecepcionProductoDto>>> {
    return await this.genericService.onCustomGet(
      this.getPedidoRecepcionProductoPorNotaRecepcionAgrupada,
      { id, estado, page, size }
    );
  }

  async onGetPedidoRecepcionProductoPorNotaRecepcionAgrupadaAndProducto(
    notaRecepcionAgrupadaId: number,
    productoId: number,
    estado?: PedidoRecepcionProductoEstado
  ): Promise<Observable<PedidoRecepcionProductoDto>> {
    return await this.genericService.onCustomGet(
      this.getPedidoRecepcionProductoPorNotaRecepcionAgrupadaAndProducto,
      { notaRecepcionAgrupadaId, productoId, estado }
    );
  }

   onRecepcionProductoNotaRecepcionAgrupada(
    notaRecepcionAgrupadaId: number,
    productoId: number,
    sucursalId: number,
    cantidad: number
  ): Promise<Observable<boolean>> {
    return this.genericService.onCustomSave(
      this.recepcionProductoNotaRecepcionAgrupada,
      { notaRecepcionAgrupadaId, productoId, sucursalId, cantidad }
    );
  }

  async onFinalizarRecepcion(id: number): Promise<Observable<NotaRecepcionAgrupada>> {
    return await this.genericService.onCustomSave(
      this.finalizarRecepcion,
      { id }
    );
  }

  async onReabrirRecepcion(id: number): Promise<Observable<NotaRecepcionAgrupada>> {
    return await this.genericService.onCustomSave(
      this.reabrirRecepcion,
      { id }
    );
  }

  async onSolicitarPagoNotaRecepcionAgrupada(id: number): Promise<Observable<SolicitudPago>> {
    return await this.genericService.onCustomSave(
      this.solicitarPagoNotaRecepcionAgrupada,
      { id }
    );
  }
}
