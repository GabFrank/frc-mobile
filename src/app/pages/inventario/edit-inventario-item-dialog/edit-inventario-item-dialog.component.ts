import { CargandoService } from './../../../services/cargando.service';
import { ModalService } from './../../../services/modal.service';
import { FormControl, Validators, FormGroup } from '@angular/forms';
import { InventarioProducto, InventarioProductoEstado, InventarioProductoItem } from './../inventario.model';
import { Producto } from 'src/app/domains/productos/producto.model';
import { Presentacion } from 'src/app/domains/productos/presentacion.model';
import { Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
import { IonInput } from '@ionic/angular';

export interface InventarioItemData {
  inventarioProducto?: InventarioProducto;
  inventarioProductoItem?: InventarioProductoItem;
  presentacion?: Presentacion;
  producto?: Producto;
  peso?: number;
}

@Component({
  selector: 'app-edit-inventario-item-dialog',
  templateUrl: './edit-inventario-item-dialog.component.html',
  styleUrls: ['./edit-inventario-item-dialog.component.scss'],
})
export class EditInventarioItemDialogComponent implements OnInit {

  isPesable = false;

  @Input()
  data: InventarioItemData;

  estadosList = Object.values(InventarioProductoEstado)
  selectedInventarioProductoItem: InventarioProductoItem;
  cantidadControl = new FormControl(null, [Validators.required, Validators.min(0)])
  vencimientoControl = new FormControl(null, [Validators.required])
  estadoControl = new FormControl(InventarioProductoEstado.BUENO)
  formGroup;

  constructor(
    private modalService: ModalService,
    private cargandoService: CargandoService
  ) {
    this.formGroup = new FormGroup({
      cantidad: this.cantidadControl,
      vencimiento: this.vencimientoControl,
      estado: this.estadoControl
    })
  }

  ngOnInit() {

    if (this.data?.inventarioProductoItem?.id != null) {
      this.cargarDatos(this.data?.inventarioProductoItem)
    } else if(this.data?.peso != null){
      this.cantidadControl.setValue(this.data.peso)
    }

  }

  async cargarDatos(invProItem: InventarioProductoItem) {
    let loading = await this.cargandoService.open()
    setTimeout(() => {
      this.selectedInventarioProductoItem = new InventarioProductoItem;
      Object.assign(this.selectedInventarioProductoItem, invProItem)
      this.isPesable = this.selectedInventarioProductoItem.presentacion.producto.balanza;
      this.selectedInventarioProductoItem.inventarioProducto = this.data.inventarioProducto;
      this.cantidadControl.setValue(invProItem?.cantidad)
      this.vencimientoControl.setValue(invProItem?.vencimiento)
      this.estadoControl.setValue(invProItem?.estado)
      this.cargandoService.close(loading)
    }, 1000);
  }

  onAceptar() {
    if (this.selectedInventarioProductoItem == null) {
      this.selectedInventarioProductoItem = new InventarioProductoItem()
      this.selectedInventarioProductoItem.cantidad = this.cantidadControl.value;
      this.selectedInventarioProductoItem.vencimiento = this.vencimientoControl.value;
      this.selectedInventarioProductoItem.inventarioProducto = this.data.inventarioProducto;
      this.selectedInventarioProductoItem.presentacion = this.data.presentacion;
      this.selectedInventarioProductoItem.estado = this.estadoControl.value;
      this.selectedInventarioProductoItem.zona = this.data.inventarioProducto.zona;
    } else {
      this.selectedInventarioProductoItem.cantidad = this.cantidadControl.value;
      this.selectedInventarioProductoItem.vencimiento = this.vencimientoControl.value;
      this.selectedInventarioProductoItem.estado = this.estadoControl.value;
    }
    console.log(this.selectedInventarioProductoItem.toInput());
    this.modalService.closeModal(this.selectedInventarioProductoItem.toInput())
  }

  onCancel() {
    this.modalService.closeModal(null)
  }

}
