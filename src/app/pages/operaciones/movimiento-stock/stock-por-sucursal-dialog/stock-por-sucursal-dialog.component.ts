import { Location } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Sucursal } from 'src/app/domains/empresarial/sucursal/sucursal.model';
import { SucursalService } from 'src/app/domains/empresarial/sucursal/sucursal.service';
import { Producto } from 'src/app/domains/productos/producto.model';
import { ProductoService } from 'src/app/pages/producto/producto.service';
import { ModalService } from 'src/app/services/modal.service';

export interface StockPorSucursalDialogData {
  producto: Producto;
}

class StockPorSucursal {
  sucursal: Sucursal;
  stock: number;

  constructor(sucursal) {
    this.sucursal = sucursal;
  }
}

@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'app-stock-por-sucursal-dialog',
  templateUrl: './stock-por-sucursal-dialog.component.html',
  styleUrls: ['./stock-por-sucursal-dialog.component.scss'],
})
export class StockPorSucursalDialogComponent implements OnInit {

  @Input()
  data: StockPorSucursalDialogData;

  sucursalList: Sucursal[];
  stockPorSucursalList: StockPorSucursal[];
  selectedProducto: Producto;

  constructor(
    private modalService: ModalService,
    private sucursalService: SucursalService,
    private productoService: ProductoService,
    private _location: Location
  ) {
  }

  async ngOnInit() {
    console.log(this.data);

    if (this.data?.producto != null) this.selectedProducto = this.data.producto;

    (await this.sucursalService.onGetAllSucursales()).subscribe(res => {
      this.stockPorSucursalList = [];
      this.sucursalList = res;
      this.sucursalList.forEach(s => {
        if (s.id != 0) {
          this.stockPorSucursalList.push(new StockPorSucursal(s));
        }
      }
      )
    })
  }

  async onVerStock(sucursal: Sucursal) {
    let index = this.stockPorSucursalList.findIndex(s => s.sucursal.id == sucursal.id);
    if (index != -1 && this.stockPorSucursalList[index].stock == null) {
      (await this.productoService.onGetStockPorSucursal(this.selectedProducto.id, sucursal.id)).pipe(untilDestroyed(this)).subscribe(res => {
        if (res != null) {
          this.stockPorSucursalList[index].stock = res;
        }
      })
    }
  }

  onBack() {
    if (this.modalService?.currentModal != null) {
      this.modalService.closeModal(null)
    } else {
      this._location.back()
    }
  }

}
