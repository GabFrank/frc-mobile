import { Component, Input, OnInit } from '@angular/core';
import { UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { formatDate } from '@angular/common';
import { Presentacion } from 'src/app/domains/productos/presentacion.model';
import { Producto } from 'src/app/domains/productos/producto.model';
import { CargandoService } from './../../../services/cargando.service';
import { ModalService } from './../../../services/modal.service';
import { InventarioProducto, InventarioProductoEstado, InventarioProductoItem } from './../inventario.model';

export interface InventarioItemData {
  inventarioProducto?: InventarioProducto;
  inventarioProductoItem?: InventarioProductoItem;
  presentacion?: Presentacion;
  producto?: Producto;
  peso?: number;
  fromPreviousInventory?: boolean;
}

@Component({
  selector: 'app-edit-inventario-item-dialog',
  templateUrl: './edit-inventario-item-dialog.component.html',
  styleUrls: ['./edit-inventario-item-dialog.component.scss'],
})
export class EditInventarioItemDialogComponent implements OnInit {

  isPesable = false;
  isEditingFromPreviousInventory = false;
  originalItemId: number;

  @Input()
  data: InventarioItemData;

  estadosList = Object.values(InventarioProductoEstado)
  selectedInventarioProductoItem: InventarioProductoItem;
  cantidadControl = new UntypedFormControl(null, [Validators.required, Validators.min(0)])
  vencimientoControl = new UntypedFormControl(null, [Validators.required])
  estadoControl = new UntypedFormControl(InventarioProductoEstado.BUENO)
  formGroup;

  constructor(
    private modalService: ModalService,
    private cargandoService: CargandoService
  ) {
    this.formGroup = new UntypedFormGroup({
      cantidad: this.cantidadControl,
      vencimiento: this.vencimientoControl,
      estado: this.estadoControl
    })
  }

  ngOnInit() {
    if (this.data?.inventarioProductoItem?.id != null) {
      this.cargarDatos(this.data?.inventarioProductoItem)
    } else if (this.data?.peso != null) {
      this.cantidadControl.setValue(this.data.peso)
    }
    this.isEditingFromPreviousInventory = this.data?.fromPreviousInventory || false;
    this.originalItemId = this.data?.inventarioProductoItem?.id;
  }

  async cargarDatos(invProItem: InventarioProductoItem) {
    let loading = await this.cargandoService.open()
    setTimeout(() => {
      this.selectedInventarioProductoItem = new InventarioProductoItem;
      Object.assign(this.selectedInventarioProductoItem, invProItem)
      this.isPesable = this.selectedInventarioProductoItem.presentacion.producto.balanza;
      this.selectedInventarioProductoItem.inventarioProducto = this.data.inventarioProducto;
      this.cantidadControl.setValue(invProItem?.cantidad)

      let fechaFormato: string = null;
      if (invProItem?.vencimiento) {
        const fecha = invProItem.vencimiento instanceof Date
          ? invProItem.vencimiento
          : new Date(invProItem.vencimiento);
        fechaFormato = formatDate(fecha, 'yyyy-MM-dd', 'en-US');
      }
      this.vencimientoControl.setValue(fechaFormato)

      this.estadoControl.setValue(invProItem?.estado)
      this.cargandoService.close(loading)
    }, 1000);
  }

  onAceptar() {
    const fechaValue = this.vencimientoControl.value;
    const fechaDate = fechaValue ? new Date(fechaValue + 'T00:00:00') : null;

    if (this.selectedInventarioProductoItem == null) {
      this.selectedInventarioProductoItem = new InventarioProductoItem()
    }
    if (this.isEditingFromPreviousInventory) {
      this.selectedInventarioProductoItem.id = null;
      this.selectedInventarioProductoItem.cantidad = this.cantidadControl.value;
      this.selectedInventarioProductoItem.vencimiento = fechaDate;
      this.selectedInventarioProductoItem.inventarioProducto = this.data.inventarioProducto;
      this.selectedInventarioProductoItem.presentacion = this.data.presentacion;
      this.selectedInventarioProductoItem.estado = this.estadoControl.value;
      this.selectedInventarioProductoItem.zona = this.data.inventarioProducto?.zona;
      this.selectedInventarioProductoItem.copiedFromItemId = this.originalItemId;
    } else {
      this.selectedInventarioProductoItem.cantidad = this.cantidadControl.value;
      this.selectedInventarioProductoItem.vencimiento = fechaDate;
      this.selectedInventarioProductoItem.estado = this.estadoControl.value;
    }

    console.log('Guardando item:', this.selectedInventarioProductoItem.toInput());
    const result = {
      ...this.selectedInventarioProductoItem.toInput(),
      isFromPreviousInventory: this.isEditingFromPreviousInventory,
      originalItemId: this.originalItemId
    };

    this.modalService.closeModal(result);
  }

  onCancel() {
    this.modalService.closeModal(null)
  }
}