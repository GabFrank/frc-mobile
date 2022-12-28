import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { VentaCredito } from 'src/app/domains/venta-credito/venta-credito.model';
import { GenericCrudService } from 'src/app/generic/generic-crud.service';
import { CountVentaCreditoByClienteAndEstadoGQL } from './count-by-cliente-id copy';
import { VentaCreditoPorClienteGQL } from './venta-credito-por-cliente-id';
import { VentaCreditoQrAuthGQL } from './venta-credito-qr-auth';

@Injectable({
  providedIn: 'root'
})
export class VentaCreditoService {

  constructor(
    private genericService: GenericCrudService,
    private ventaCreditoPorCliente: VentaCreditoPorClienteGQL,
    private countByClienteAndEstado: CountVentaCreditoByClienteAndEstadoGQL,
    private ventaCreditoQrAuth: VentaCreditoQrAuthGQL
  ) { }

  async onGetPorClienteId(id, estado, page, size): Promise<Observable<VentaCredito[]>> {
    return this.genericService.onCustomGet(this.ventaCreditoPorCliente, { id, estado, page, size });
  }

  async countPorClienteIdAndEstado(id, estado): Promise<Observable<number>> {
    return this.genericService.onCustomGet(this.countByClienteAndEstado, { id, estado });
  }

  async onVentaCreditoQrAuth(id: number, timestamp:string): Promise<Observable<number>> {
    return this.genericService.onCustomGet(this.ventaCreditoQrAuth, { id, timestamp });
  }
}
