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
import { RecepcionMercaderiaItemInput, MetodoVerificacion, MotivoRechazoFisico, MotivoRechazoFisicoLabels } from '../../recepcion-mercaderia/recepcion-mercaderia-item.model';
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

class ItemRechazo {
  cantidad: number;
  presentacion: Presentacion;
  motivoRechazo: MotivoRechazoFisico;
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
  esRechazoControl = new FormControl(false);
  motivoRechazoControl = new FormControl();
  selectedItem: PedidoRecepcionProductoDto;
  selectedPresentacion: Presentacion;
  itemRecepcionList: ItemRecepcion[] = [];
  itemRechazoList: ItemRechazo[] = [];
  isEditMode = false;
  isEditRechazoMode = false;
  selectedItemToEdit: ItemRecepcion;
  selectedItemRechazoToEdit: ItemRechazo;
  selectedItemIndexToEdit: number;
  selectedItemRechazoIndexToEdit: number;
  nuevaCantidadRecibida: number = 0;
  nuevaCantidadRechazada: number = 0;
  motivoRechazoFisicoOptions = Object.values(MotivoRechazoFisico);
  motivoRechazoFisicoLabels = MotivoRechazoFisicoLabels;

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

    this.esRechazoControl.valueChanges.subscribe((value) => {
      if (!value) {
        // Si se desactiva el toggle, limpiar el motivo
        this.motivoRechazoControl.setValue(null);
      }
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

    const esRechazo = this.esRechazoControl.value === true;
    
    if (esRechazo && !this.motivoRechazoControl.value) {
      this.notificacionService.warn('Debe seleccionar un motivo de rechazo');
      return;
    }
    
    let cantidadPorUnidad = cantidad * cantidadPresentacion;
    
    // Calcular cantidades ya agregadas (excluyendo el item que se está editando)
    let cantidadRecibidaYaAgregada = 0;
    let cantidadRechazadaYaAgregada = 0;
    
    if (this.isEditMode) {
      cantidadRecibidaYaAgregada = this.itemRecepcionList
        .filter((item, index) => index !== this.selectedItemIndexToEdit)
        .reduce((sum, item) => sum + (item.cantidad * item.presentacion.cantidad), 0);
    } else {
      cantidadRecibidaYaAgregada = this.itemRecepcionList
        .reduce((sum, item) => sum + (item.cantidad * item.presentacion.cantidad), 0);
    }
    
    if (this.isEditRechazoMode) {
      cantidadRechazadaYaAgregada = this.itemRechazoList
        .filter((item, index) => index !== this.selectedItemRechazoIndexToEdit)
        .reduce((sum, item) => sum + (item.cantidad * item.presentacion.cantidad), 0);
    } else {
      cantidadRechazadaYaAgregada = this.itemRechazoList
        .reduce((sum, item) => sum + (item.cantidad * item.presentacion.cantidad), 0);
    }
    
    // Calcular cantidad faltante (considerando recibido y rechazado)
    let cantidadFaltante = this.selectedItem.totalCantidadARecibirPorUnidad - 
                          (this.selectedItem.totalCantidadRecibidaPorUnidad || 0) - 
                          cantidadRecibidaYaAgregada - 
                          cantidadRechazadaYaAgregada;
    
    if (cantidadPorUnidad > cantidadFaltante) {
      this.notificacionService.warn('La suma de recibido y rechazado no puede exceder la cantidad esperada');
      this.cantidadInputRef.setFocus();
      return;
    }
    
    if (esRechazo) {
      // Procesar como rechazo
      let itemRechazo = new ItemRechazo();
      itemRechazo.cantidad = cantidad;
      itemRechazo.presentacion = this.presentacionControl.value;
      itemRechazo.motivoRechazo = this.motivoRechazoControl.value;
      
      if (this.isEditRechazoMode) {
        this.onDeleteRechazo(this.selectedItemRechazoToEdit);
      }
      
      this.nuevaCantidadRechazada = cantidadRechazadaYaAgregada + cantidadPorUnidad;
      
      this.cantidadControl.setValue(null);
      this.motivoRechazoControl.setValue(null);
      this.esRechazoControl.setValue(false);
      
      if (this.isEditRechazoMode) {
        this.itemRechazoList[this.selectedItemRechazoIndexToEdit] = itemRechazo;
      } else {
        this.itemRechazoList.push(itemRechazo);
      }
      this.isEditRechazoMode = false;
    } else {
      // Procesar como recepción normal
      let itemRecepcion = new ItemRecepcion();
      itemRecepcion.cantidad = cantidad;
      itemRecepcion.presentacion = this.presentacionControl.value;
      
      if (this.isEditMode) {
        this.onDelete(this.selectedItemToEdit);
      }
      
      this.nuevaCantidadRecibida = cantidadRecibidaYaAgregada + cantidadPorUnidad;
      
      this.cantidadControl.setValue(null);
      
      if (this.isEditMode) {
        this.itemRecepcionList[this.selectedItemIndexToEdit] = itemRecepcion;
      } else {
        this.itemRecepcionList.push(itemRecepcion);
      }
      this.isEditMode = false;
    }
  }

  onSelectCantidadInput() {}

  onBack() {
    this.modalService.closeModal(this.selectedItem);
  }

  onEdit(itemRecepcion: any): void {
    // Load item info into the form
    this.presentacionControl.setValue(itemRecepcion.presentacion);
    this.cantidadControl.setValue(itemRecepcion.cantidad);
    this.esRechazoControl.setValue(false);
    this.motivoRechazoControl.setValue(null);
    this.isEditMode = true;
    this.isEditRechazoMode = false;
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

  onEditRechazo(itemRechazo: ItemRechazo): void {
    // Load item rechazo info into the form
    this.presentacionControl.setValue(itemRechazo.presentacion);
    this.cantidadControl.setValue(itemRechazo.cantidad);
    this.esRechazoControl.setValue(true);
    this.motivoRechazoControl.setValue(itemRechazo.motivoRechazo);
    this.isEditMode = false;
    this.isEditRechazoMode = true;
    this.selectedItemRechazoToEdit = itemRechazo;
    this.selectedItemRechazoIndexToEdit = this.itemRechazoList.indexOf(itemRechazo);
  }

  onDeleteRechazo(itemRechazo: ItemRechazo): void {
    // Remove the item from the list
    const index = this.itemRechazoList.indexOf(itemRechazo);
    if (index > -1) {
      this.itemRechazoList.splice(index, 1);
    }

    // Recalcular nuevaCantidadRechazada sumando todos los items restantes
    this.nuevaCantidadRechazada = this.itemRechazoList
      .reduce((sum, item) => sum + (item.cantidad * item.presentacion.cantidad), 0);
  }

  calcularCantidadRechazada(): number {
    return this.itemRechazoList
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

      // 2. Calcular cantidad rechazada total
      const cantidadRechazadaTotal = this.calcularCantidadRechazada();
      
      // 3. Determinar motivo de rechazo (usar el primero si hay múltiples)
      let motivoRechazoFinal: string = null;
      if (cantidadRechazadaTotal > 0 && this.itemRechazoList.length > 0) {
        motivoRechazoFinal = this.itemRechazoList[0].motivoRechazo;
      }

      // 4. Construir RecepcionMercaderiaItemInput completo
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
        cantidadRechazada: cantidadRechazadaTotal,
        vencimientoRecibido: null,
        lote: null,
        esBonificacion: false,
        motivoRechazo: motivoRechazoFinal,
        observaciones: null,
        metodoVerificacion: MetodoVerificacion.MANUAL,
        motivoVerificacionManual: null,
        estadoVerificacion: null,
        variaciones: []
      };

      // 5. Llamar saveRecepcionMercaderiaItem
      (await this.recepcionMercaderiaService.onSaveRecepcionMercaderiaItem(input)).subscribe(
        res => {
          if (res) {
            // Retornar objeto con ambos valores para que el componente padre pueda actualizar correctamente
            this.modalService.closeModal({
              cantidadRecibida: this.nuevaCantidadRecibida,
              cantidadRechazada: cantidadRechazadaTotal
            });
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
