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
  private cantidadOriginalDelItem: number = 0;
  isEditingFromPreviousInventory = false;
  originalItemId: number;
  tieneVencimiento = false;

  @Input()
  data: InventarioItemData;

  estadosList = Object.values(InventarioProductoEstado)
  selectedInventarioProductoItem: InventarioProductoItem;
  cantidadControl = new UntypedFormControl(null, [Validators.required])
  vencimientoControl = new UntypedFormControl(null)
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
    const v = this.data?.producto?.vencimiento as any;
    this.tieneVencimiento = v !== false && v !== 'false' && v !== 0 && v !== '0';
    if (this.data?.inventarioProductoItem?.vencimiento) {
      this.tieneVencimiento = true;
    }

    if (this.data?.inventarioProductoItem?.id != null) {
      this.cargarDatos(this.data.inventarioProductoItem);
    } else {
      if (this.data?.producto && this.data?.presentacion) {
        if (this.data.producto.stockPorProducto != null && this.data.presentacion.cantidad > 0) {
          const stockTeoricoPresentaciones = this.data.producto.stockPorProducto / this.data.presentacion.cantidad;
          this.cantidadOriginalDelItem = parseFloat(stockTeoricoPresentaciones.toFixed(3));
        } else {
          this.cantidadOriginalDelItem = 0;
        }

        if (this.data?.peso != null) {
          this.cantidadControl.setValue(this.data.peso);
        }
      } else {
        this.cantidadOriginalDelItem = 0;
      }
    }

    this.isEditingFromPreviousInventory = this.data?.fromPreviousInventory || false;
    this.originalItemId = this.data?.inventarioProductoItem?.id;
  }

  async cargarDatos(invProItem: InventarioProductoItem) {
    let loading = await this.cargandoService.open();
    this.selectedInventarioProductoItem = new InventarioProductoItem();
    Object.assign(this.selectedInventarioProductoItem, invProItem);

    if (invProItem.cantidadAnterior != null) {
      this.cantidadOriginalDelItem = invProItem.cantidadAnterior;
    } else if (invProItem.cantidadFisica != null) {
      this.cantidadOriginalDelItem = invProItem.cantidadFisica;
    } else if (this.data?.producto && this.data?.presentacion) {
      if (this.data.producto.stockPorProducto != null && this.data.presentacion.cantidad > 0) {
        const stockTeoricoPresentaciones = this.data.producto.stockPorProducto / this.data.presentacion.cantidad;
        this.cantidadOriginalDelItem = parseFloat(stockTeoricoPresentaciones.toFixed(3));
      } else {
        this.cantidadOriginalDelItem = 0;
      }
    } else {
      this.cantidadOriginalDelItem = 0;
    }

    this.isPesable = this.selectedInventarioProductoItem.presentacion?.producto?.balanza || false;
    this.selectedInventarioProductoItem.inventarioProducto = this.data.inventarioProducto;
    this.cantidadControl.setValue(invProItem?.cantidad);

    if (this.tieneVencimiento && invProItem?.vencimiento) {
      this.vencimientoControl.setValue(invProItem.vencimiento);
    } else {
      this.vencimientoControl.setValue(null);
    }

    let fechaFormato: string = null;
    if (invProItem?.vencimiento) {
      const fecha = invProItem.vencimiento instanceof Date
        ? invProItem.vencimiento
        : new Date(invProItem.vencimiento);
      fechaFormato = formatDate(fecha, 'yyyy-MM-dd', 'en-US');
    }
    this.vencimientoControl.setValue(fechaFormato);

    this.estadoControl.setValue(invProItem?.estado);
    this.cargandoService.close(loading);
  }

  onAceptar() {
    const fechaValue = this.vencimientoControl.value;
    const fechaDate = (this.tieneVencimiento && fechaValue) ? new Date(fechaValue + 'T00:00:00') : null;

    if (this.selectedInventarioProductoItem == null) {
      this.selectedInventarioProductoItem = new InventarioProductoItem();
      this.selectedInventarioProductoItem.cantidadFisica = this.cantidadOriginalDelItem;
      this.selectedInventarioProductoItem.cantidadAnterior = this.cantidadOriginalDelItem;
      // In case of new item, take the IDs from data
      this.selectedInventarioProductoItem.inventarioProducto = this.data.inventarioProducto;
      this.selectedInventarioProductoItem.presentacion = this.data.presentacion;
      this.selectedInventarioProductoItem.zona = this.data.inventarioProducto?.zona;
    }

    // Ensure metadata is always present
    if (!this.selectedInventarioProductoItem.presentacion && this.data.presentacion) {
      this.selectedInventarioProductoItem.presentacion = this.data.presentacion;
    }
    if (!this.selectedInventarioProductoItem.inventarioProducto && this.data.inventarioProducto) {
      this.selectedInventarioProductoItem.inventarioProducto = this.data.inventarioProducto;
    }

    if (this.cantidadControl.value === this.cantidadOriginalDelItem) {
      this.selectedInventarioProductoItem.verificado = true;
      this.selectedInventarioProductoItem.revisado = false;
    } else {
      this.selectedInventarioProductoItem.verificado = false;
      this.selectedInventarioProductoItem.revisado = true;
    }

    if (this.isEditingFromPreviousInventory) {
      this.selectedInventarioProductoItem.id = null;
      this.selectedInventarioProductoItem.cantidad = this.cantidadControl.value;
      this.selectedInventarioProductoItem.cantidadFisica = this.cantidadOriginalDelItem;
      this.selectedInventarioProductoItem.cantidadAnterior = this.cantidadOriginalDelItem;
      this.selectedInventarioProductoItem.vencimiento = fechaDate;
      this.selectedInventarioProductoItem.estado = this.estadoControl.value;
      this.selectedInventarioProductoItem.zona = this.data.inventarioProducto?.zona;
      this.selectedInventarioProductoItem.copiedFromItemId = this.originalItemId;
    } else {
      // Normal edit: preserve the ID from original record
      if (this.originalItemId != null) {
        this.selectedInventarioProductoItem.id = this.originalItemId;
      }
      this.selectedInventarioProductoItem.cantidadAnterior = this.cantidadOriginalDelItem;
      this.selectedInventarioProductoItem.cantidad = this.cantidadControl.value;
      this.selectedInventarioProductoItem.cantidadFisica = this.cantidadOriginalDelItem;
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