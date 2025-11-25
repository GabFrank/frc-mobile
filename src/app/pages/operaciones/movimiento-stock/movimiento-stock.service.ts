import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { GenericCrudService } from 'src/app/generic/generic-crud.service';
import { MovimientoStock, MovimientoStockInput } from './movimiento-stock.model';
import { GetStockPorProductoGQL } from './graphql/getStockPorProducto';
import { SaveMovimientoStockGQL } from './graphql/saveMovimientoStock';

@Injectable({
  providedIn: 'root',
})
export class MovimientoStockService {
  constructor(
    private genericService: GenericCrudService,
    private getStockPorProductoGQL: GetStockPorProductoGQL,
    private saveMovimientoStockGQL: SaveMovimientoStockGQL
  ) {}

  async onGetStockPorProducto(productoId: number, sucursalId: number): Promise<Observable<number>> {
    return await this.genericService.onGet(this.getStockPorProductoGQL, { id: productoId, sucId: sucursalId });
  }

  async onSaveMovimientoStock(movimientoStock: MovimientoStockInput): Promise<Observable<MovimientoStock>> {
    return await this.genericService.onCustomSave(this.saveMovimientoStockGQL, { movimientoStock });
  }
}

