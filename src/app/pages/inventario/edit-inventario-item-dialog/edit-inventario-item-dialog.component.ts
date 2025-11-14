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
    let tieneVencimiento = false;
    
    if (this.data?.producto?.vencimiento === true) {
      tieneVencimiento = true;
    }
    else if (typeof this.data?.producto?.vencimiento === 'string' && this.data?.producto?.vencimiento === 'true') {
      tieneVencimiento = true;
      if (this.data?.producto) {
        this.data.producto.vencimiento = true;
      }
    } 
    else if (this.data?.inventarioProductoItem?.vencimiento && this.data?.producto) {
      tieneVencimiento = true;
      this.data.producto.vencimiento = true;
    }
    if (tieneVencimiento) {
      if (!this.vencimientoControl.hasValidator(Validators.required)) {
        this.vencimientoControl.setValidators(Validators.required);
      }
    } else {
      this.vencimientoControl.clearValidators();
      this.vencimientoControl.setValue(null);
    }
    this.vencimientoControl.updateValueAndValidity();

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
      
      // Si el item ya tiene cantidadAnterior, usarla (stock original del sistema)
      // Si no tiene cantidadAnterior pero tiene cantidadFisica, usarla (deberían ser iguales)
      // Si no tiene ninguno, calcular desde stockPorProducto del producto
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
      
      this.isPesable = this.selectedInventarioProductoItem.presentacion.producto.balanza;
      this.selectedInventarioProductoItem.inventarioProducto = this.data.inventarioProducto;
      this.cantidadControl.setValue(invProItem?.cantidad)
      
      const tieneVencimiento = this.data?.producto?.vencimiento === true || 
                             (typeof this.data?.producto?.vencimiento === 'string' && this.data?.producto?.vencimiento === 'true');
      
      if (tieneVencimiento && invProItem?.vencimiento) {
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
      // cantidad = valor ingresado por el usuario
      this.selectedInventarioProductoItem.cantidad = this.cantidadControl.value;
      // cantidadFisica y cantidadAnterior = stock original del sistema (mismo valor)
      this.selectedInventarioProductoItem.cantidadFisica = this.cantidadOriginalDelItem;
      this.selectedInventarioProductoItem.cantidadAnterior = this.cantidadOriginalDelItem;
      this.selectedInventarioProductoItem.revisado = true;
      this.selectedInventarioProductoItem.verificado = false;
      if (this.data?.producto?.vencimiento === true) {
      this.selectedInventarioProductoItem.vencimiento = this.vencimientoControl.value;
      } else {
        this.selectedInventarioProductoItem.vencimiento = null;
      }
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
      // cantidadAnterior = stock original del sistema
      this.selectedInventarioProductoItem.cantidadAnterior = this.cantidadOriginalDelItem;
      // cantidad = valor ingresado por el usuario
      this.selectedInventarioProductoItem.cantidad = this.cantidadControl.value;
      // cantidadFisica = stock original del sistema (igual a cantidadAnterior)
      this.selectedInventarioProductoItem.cantidadFisica = this.cantidadOriginalDelItem;
      
      this.selectedInventarioProductoItem.revisado = true;
      this.selectedInventarioProductoItem.verificado = false;
      
      if (this.data?.producto?.vencimiento === true) {
      this.selectedInventarioProductoItem.vencimiento = this.vencimientoControl.value;
      } else {
        this.selectedInventarioProductoItem.vencimiento = null;
      }
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