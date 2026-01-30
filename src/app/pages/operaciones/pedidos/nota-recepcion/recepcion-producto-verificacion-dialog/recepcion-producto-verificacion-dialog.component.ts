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
import { RecepcionMercaderia } from '../../recepcion-mercaderia/recepcion-mercaderia.model';
import { RecepcionMercaderiaService } from '../../recepcion-mercaderia/recepcion-mercaderia.service';
import { RecepcionMercaderiaItemInput, MetodoVerificacion } from '../../recepcion-mercaderia/recepcion-mercaderia-item.model';
import { MainService } from 'src/app/services/main.service';
import { first } from 'rxjs/operators';

export class RecepcionProductoVerificacionDialogData {
  recepcionMercaderia: RecepcionMercaderia;
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
    private recepcionMercaderiaService: RecepcionMercaderiaService,
    private mainService: MainService,
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
    
    if (!cantidad || cantidad <= 0) {
      this.notificacionService.warn('Debe ingresar una cantidad válida');
      return;
    }
    
    if (!cantidadPresentacion || cantidadPresentacion <= 0) {
      this.notificacionService.warn('Debe seleccionar una presentación');
      return;
    }
    
    let cantidadPorUnidad = cantidad * cantidadPresentacion;
    let itemRecepcion = new ItemRecepcion();
    itemRecepcion.cantidad = cantidad;
    itemRecepcion.presentacion = this.presentacionControl.value;
    
    // Calcular cantidad total ya agregada en la lista (excluyendo el item que se está editando)
    let cantidadYaAgregada = 0;
    if (this.isEditMode) {
      // Si está en modo edición, calcular sin el item que se está editando
      cantidadYaAgregada = this.itemRecepcionList
        .filter((item, index) => index !== this.selectedItemIndexToEdit)
        .reduce((sum, item) => sum + (item.cantidad * item.presentacion.cantidad), 0);
    } else {
      // Si no está en modo edición, calcular toda la lista
      cantidadYaAgregada = this.itemRecepcionList
        .reduce((sum, item) => sum + (item.cantidad * item.presentacion.cantidad), 0);
    }
    
    // Calcular cantidad faltante
    let cantidadFaltante = this.selectedItem.totalCantidadARecibirPorUnidad - 
                          (this.selectedItem.totalCantidadRecibidaPorUnidad || 0) - 
                          cantidadYaAgregada;
    
    if (cantidadPorUnidad <= cantidadFaltante) {
      if (this.isEditMode) {
        // Eliminar el item anterior antes de agregar el nuevo
        this.onDelete(this.selectedItemToEdit);
      }
      
      // Actualizar nuevaCantidadRecibida sumando la nueva cantidad
      this.nuevaCantidadRecibida = cantidadYaAgregada + cantidadPorUnidad;
      
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

    // Recalcular nuevaCantidadRecibida sumando todos los items restantes
    this.nuevaCantidadRecibida = this.itemRecepcionList
      .reduce((sum, item) => sum + (item.cantidad * item.presentacion.cantidad), 0);
  }

  async onGuardar() {
    try {
      // 1. Buscar NotaRecepcionItem por productoId y recepcionMercaderiaId
      const notaRecepcionItemObs = await this.recepcionMercaderiaService
        .onBuscarNotaRecepcionItemPorProductoYRecepcion(
          this.data.recepcionMercaderia.id,
          this.selectedItem.producto.id
        );
      
      const notaRecepcionItem = await notaRecepcionItemObs
        .pipe(first())
        .toPromise();

      if (!notaRecepcionItem) {
        this.notificacionService.warn('No se encontró el item de nota de recepción');
        return;
      }

      // 2. Construir RecepcionMercaderiaItemInput completo
      const input: RecepcionMercaderiaItemInput = {
        id: null,
        recepcionMercaderiaId: this.data.recepcionMercaderia.id,
        notaRecepcionItemId: notaRecepcionItem.id,
        notaRecepcionItemDistribucionId: null,
        productoId: this.selectedItem.producto.id,
        presentacionRecibidaId: this.selectedPresentacion?.id,
        sucursalEntregaId: this.data.recepcionMercaderia.sucursalRecepcion.id,
        usuarioId: this.mainService.usuarioActual.id,
        cantidadRecibida: this.nuevaCantidadRecibida,
        cantidadRechazada: 0,
        vencimientoRecibido: null,
        lote: null,
        esBonificacion: false,
        motivoRechazo: null,
        observaciones: null,
        metodoVerificacion: MetodoVerificacion.MANUAL,
        motivoVerificacionManual: null,
        estadoVerificacion: null,
        variaciones: []
      };

      // 3. Llamar saveRecepcionMercaderiaItem
      (await this.recepcionMercaderiaService.onSaveRecepcionMercaderiaItem(input)).subscribe(
        res => {
          if (res) {
            this.modalService.closeModal(this.nuevaCantidadRecibida);
          } else {
            this.notificacionService.warn('Error al guardar la recepción');
          }
        },
        error => {
          console.error('Error al guardar recepción:', error);
          this.notificacionService.warn('Error al guardar la recepción: ' + (error.message || 'Error desconocido'));
        }
      );
    } catch (error) {
      console.error('Error al buscar NotaRecepcionItem:', error);
      this.notificacionService.warn('Error al buscar item de nota: ' + (error.message || 'Error desconocido'));
    }
  }
}
