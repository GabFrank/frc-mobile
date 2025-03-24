import { Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
import { PedidoRecepcionProductoDto } from '../nota-recepcion-agrupada/pedido-recepcion-producto-dto.model';
import { Producto } from 'src/app/domains/productos/producto.model';
import { Presentacion } from 'src/app/domains/productos/presentacion.model';
import { FormControl } from '@angular/forms';
import { IonInput } from '@ionic/angular';
import { NotificacionService } from 'src/app/services/notificacion.service';
import { UntilDestroy } from '@ngneat/until-destroy';
import { Location } from '@angular/common';
import { ModalService } from 'src/app/services/modal.service';
import { NotaRecepcionAgrupada } from '../nota-recepcion-agrupada/nota-recepcion-agrupada.model';
import { NotaRecepcionAgrupadaService } from '../nota-recepcion-agrupada/nota-recepcion-agrupada.service';

export class RecepcionProductoVerificacionDialogData {
  notaRecepcionAgrupada: NotaRecepcionAgrupada;
  pedidoRecepcionProducto: PedidoRecepcionProductoDto;
  presentacion?: Presentacion;
}

class ItemRecepcion {
  cantidad: number;
  presentacion: Presentacion;
}

@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'app-recepcion-producto-verificacion-dialog',
  templateUrl: './recepcion-producto-verificacion-dialog.component.html',
  styleUrls: ['./recepcion-producto-verificacion-dialog.component.scss']
})
export class RecepcionProductoVerificacionDialogComponent implements OnInit {
  @ViewChild('cantidadInput', { read: IonInput })
  cantidadInputRef: IonInput;

  @Input()
  data: RecepcionProductoVerificacionDialogData;

  cantidadControl = new FormControl();
  cantidadPorUnidadControl = new FormControl();
  presentacionControl = new FormControl();
  selectedItem: PedidoRecepcionProductoDto;
  selectedPresentacion: Presentacion;
  itemRecepcionList: ItemRecepcion[] = [];
  isEditMode = false;
  selectedItemToEdit: ItemRecepcion;
  selectedItemIndexToEdit: number;
  nuevaCantidadRecibida: number = 0;

  constructor(
    private notificacionService: NotificacionService,
    private notaRecepcionAgrupadaService: NotaRecepcionAgrupadaService,
    private _location: Location,
    private modalService: ModalService
  ) {}

  ngOnInit() {
    if (this.data != null) {
      this.selectedItem = this.data.pedidoRecepcionProducto;
      this.selectedPresentacion = this.data?.presentacion;
      if (this.selectedPresentacion != null) {
        this.presentacionControl.setValue(this.selectedPresentacion);
      }
      setTimeout(() => {
        this.cantidadInputRef.setFocus();
      }, 100);
    }

    this.cantidadControl.valueChanges.subscribe((value) => {
      this.cantidadPorUnidadControl.setValue(
        value * this.presentacionControl.value?.cantidad
      );
    });

    this.presentacionControl.valueChanges.subscribe((value) => {
      this.cantidadPorUnidadControl.setValue(
        value?.cantidad * this.cantidadControl.value
      );
    });
  }

  onAdicionarRecepcion() {
    let cantidad = this.cantidadControl.value;
    let cantidadPresentacion = this.presentacionControl.value?.cantidad;
    let cantidadPorUnidad = cantidad * cantidadPresentacion;
    let itemRecepcion = new ItemRecepcion();
    itemRecepcion.cantidad = cantidad;
    itemRecepcion.presentacion = this.presentacionControl.value;
    if (this.isEditMode) {
      this.onDelete(this.selectedItemToEdit);
    }
    if (
      cantidadPorUnidad <=
      this.selectedItem.totalCantidadARecibirPorUnidad -
        this.selectedItem.totalCantidadRecibidaPorUnidad
    ) {
      this.nuevaCantidadRecibida = cantidadPorUnidad;
      this.cantidadControl.setValue(null);
      if (this.isEditMode) {
        this.itemRecepcionList[this.selectedItemIndexToEdit] = itemRecepcion;
      } else {
        this.itemRecepcionList.push(itemRecepcion);
      }
    } else {
      this.notificacionService.warn('Cantidad es mayor al faltante');
      this.cantidadInputRef.setFocus();
    }
    this.isEditMode = false;
  }

  onSelectCantidadInput() {}

  onBack() {
    this.modalService.closeModal(this.selectedItem);
  }

  onEdit(itemRecepcion: any): void {
    // Load item info into the form
    this.presentacionControl.setValue(itemRecepcion.presentacion);
    this.cantidadControl.setValue(itemRecepcion.cantidad);
    this.isEditMode = true;
    this.selectedItemToEdit = itemRecepcion;
    this.selectedItemIndexToEdit = this.itemRecepcionList.indexOf(itemRecepcion);
  }

  onDelete(itemRecepcion: any): void {
    // Remove the item from the list
    const index = this.itemRecepcionList.indexOf(itemRecepcion);
    if (index > -1) {
      this.itemRecepcionList.splice(index, 1);
    }

    // Update nuevaCantidadRecibida instead of totalCantidadRecibidaPorUnidad
    this.nuevaCantidadRecibida -= itemRecepcion.cantidad * itemRecepcion.presentacion.cantidad;
  }

  async onGuardar() {
    (await this.notaRecepcionAgrupadaService.onRecepcionProductoNotaRecepcionAgrupada(this.data.notaRecepcionAgrupada.id, this.selectedItem.producto.id, this.data.notaRecepcionAgrupada.sucursal.id, this.nuevaCantidadRecibida)).subscribe(res => {
      if (res) {
        this.modalService.closeModal(this.nuevaCantidadRecibida);
      } else {
        this.notificacionService.warn('Error al guardar la recepción');
      }
    });
  }
}
