import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { PedidoRecepcionProductoDto } from '../nota-recepcion-agrupada/pedido-recepcion-producto-dto.model';
import { Presentacion } from 'src/app/domains/productos/presentacion.model';
import { FormControl } from '@angular/forms';
import { IonInput } from '@ionic/angular';
import { NotificacionService } from 'src/app/services/notificacion.service';
import { UntilDestroy } from '@ngneat/until-destroy';
import { ModalService } from 'src/app/services/modal.service';
import { RecepcionMercaderia } from '../../recepcion-mercaderia/recepcion-mercaderia.model';
import { RecepcionMercaderiaService } from '../../recepcion-mercaderia/recepcion-mercaderia.service';
import { MetodoVerificacion, MotivoRechazoFisico, MotivoRechazoFisicoLabels } from '../../recepcion-mercaderia/recepcion-mercaderia-item.model';
import { MainService } from 'src/app/services/main.service';
import { first } from 'rxjs/operators';
import { NotaRecepcionItem } from '../../recepcion-mercaderia/graphql/notaRecepcionItemListPorNotaRecepcionId';
import { SeleccionarNotaItemRechazoDialogComponent, SeleccionarNotaItemRechazoDialogData } from '../seleccionar-nota-item-rechazo-dialog/seleccionar-nota-item-rechazo-dialog.component';
import { ModalSize } from 'src/app/services/modal.service';

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
  esModoUnidadBase = false;
  cantidadARecibirDisplay = 0;
  cantidadRecibidaDisplay = 0;
  cantidadFaltaDisplay = 0;
  cantidadRechazadaDisplay = 0;
  resumenCompletado = false;
  unidadDisplayLabel = 'presentación';
  presentacionUnidadBase: Presentacion = {
    id: null,
    descripcion: 'UNIDAD BASE',
    cantidad: 1
  } as Presentacion;

  // Para manejar múltiples NotaRecepcionItem del mismo producto
  notaRecepcionItemsDisponibles: NotaRecepcionItem[] = [];
  notaRecepcionItemSeleccionado: NotaRecepcionItem | null = null;

  constructor(
    private notificacionService: NotificacionService,
    private recepcionMercaderiaService: RecepcionMercaderiaService,
    private mainService: MainService,
    private modalService: ModalService
  ) {}

  ngOnInit() {
    if (this.data != null) {
      this.selectedItem = this.data.pedidoRecepcionProducto;
      this.esModoUnidadBase = this.selectedItem?.mostrarEnUnidadBase === true;
      this.selectedPresentacion = this.esModoUnidadBase
        ? this.presentacionUnidadBase
        : (this.data?.presentacion || this.selectedItem?.presentacionInicialSugerida);
      if (this.selectedPresentacion != null) {
        const presentacionEnLista = this.selectedItem?.producto?.presentaciones?.find(
          p => p?.id === this.selectedPresentacion?.id
        );
        this.presentacionControl.setValue(presentacionEnLista ?? this.selectedPresentacion, { emitEvent: false });
      }
      if (this.selectedItem?.cantidadInicialPorPresentacion != null && !this.esModoUnidadBase) {
        this.cantidadControl.setValue(this.selectedItem.cantidadInicialPorPresentacion, { emitEvent: false });
      }
      if (this.selectedItem?.cantidadPendientePorUnidad != null && this.esModoUnidadBase) {
        this.cantidadControl.setValue(this.selectedItem.cantidadPendientePorUnidad, { emitEvent: false });
      }
      this.cantidadPorUnidadControl.setValue(
        (this.cantidadControl.value || 0) * this.getCantidadPresentacionActual(),
        { emitEvent: false }
      );
      this.updateComputedProperties();
      setTimeout(() => {
        this.cantidadInputRef.setFocus();
      }, 100);
    }

    this.cantidadControl.valueChanges.subscribe((value) => {
      this.cantidadPorUnidadControl.setValue(
        (value || 0) * this.getCantidadPresentacionActual()
      );
      this.updateComputedProperties();
    });

    this.presentacionControl.valueChanges.subscribe((value) => {
      this.cantidadPorUnidadControl.setValue(
        this.getCantidadPresentacionActual(value) * (this.cantidadControl.value || 0)
      );
      this.updateComputedProperties();
    });

    this.esRechazoControl.valueChanges.subscribe((value) => {
      if (!value) {
        // Si se desactiva el toggle, limpiar el motivo
        this.motivoRechazoControl.setValue(null);
      }
      this.updateComputedProperties();
    });
  }

  onAdicionarRecepcion() {
    let cantidad = this.cantidadControl.value;
    let cantidadPresentacion = this.getCantidadPresentacionActual();
    
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
      itemRechazo.presentacion = this.esModoUnidadBase ? this.presentacionUnidadBase : this.presentacionControl.value;
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
      this.updateComputedProperties();
    } else {
      // Procesar como recepción normal
      let itemRecepcion = new ItemRecepcion();
      itemRecepcion.cantidad = cantidad;
      itemRecepcion.presentacion = this.esModoUnidadBase ? this.presentacionUnidadBase : this.presentacionControl.value;
      
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
      this.updateComputedProperties();
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
    this.updateComputedProperties();
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
    this.updateComputedProperties();
  }

  calcularCantidadRechazada(): number {
    return this.itemRechazoList
      .reduce((sum, item) => sum + (item.cantidad * item.presentacion.cantidad), 0);
  }

  async onGuardar() {
    try {
      // 1. Calcular cantidades totales
      const cantidadRechazadaTotal = this.calcularCantidadRechazada();
      const cantidadEsperada = this.selectedItem.totalCantidadARecibirPorUnidad;
      const cantidadRecibidaAnterior = this.selectedItem.totalCantidadRecibidaPorUnidad || 0;
      const cantidadRechazadaAnterior = this.selectedItem.totalCantidadRechazadaPorUnidad || 0;
      // Cantidad pendiente para esta sesión = total esperado - ya recibido - ya rechazado
      const cantidadPendienteParaSesion = this.selectedItem.cantidadPendientePorUnidad != null
        ? this.selectedItem.cantidadPendientePorUnidad
        : (cantidadEsperada - cantidadRecibidaAnterior - cantidadRechazadaAnterior);

      // 2. Validación: Si cantidad recibida < pendiente y no hay rechazo, exigir rechazo
      if (this.nuevaCantidadRecibida < cantidadPendienteParaSesion && cantidadRechazadaTotal === 0) {
        this.notificacionService.warn(
          `La cantidad recibida (${this.nuevaCantidadRecibida}) es menor a la pendiente (${cantidadPendienteParaSesion}). ` +
          'Debe agregar un rechazo para la cantidad faltante.'
        );
        return;
      }

      // 3. Validación: La suma de recibido + rechazado no puede exceder lo pendiente
      if (this.nuevaCantidadRecibida + cantidadRechazadaTotal > cantidadPendienteParaSesion) {
        this.notificacionService.warn(
          'La suma de recibido y rechazado no puede exceder la cantidad pendiente'
        );
        return;
      }

      // 4. Si hay rechazos y múltiples notas: mostrar selector para elegir cuál recibe el rechazo
      const hayRechazos = cantidadRechazadaTotal > 0;
      let notaRecepcionItemIdParaRechazo: number | null = null;
      let motivoRechazoFinal: string | null = null;

      if (hayRechazos) {
        const notaRecepcionItemsObs = await this.recepcionMercaderiaService
          .onBuscarNotaRecepcionItemsPorProductoYRecepcion(
            this.data.recepcionMercaderia.id,
            this.selectedItem.producto.id
          );
        const notaRecepcionItems = await notaRecepcionItemsObs.pipe(first()).toPromise();

        if (!notaRecepcionItems || notaRecepcionItems.length === 0) {
          this.notificacionService.warn('No se encontró el item de nota de recepción');
          return;
        }

        if (notaRecepcionItems.length > 1 && !this.notaRecepcionItemSeleccionado) {
          const dialogData: SeleccionarNotaItemRechazoDialogData = {
            notaRecepcionItemsDisponibles: notaRecepcionItems,
            selectedItem: this.selectedItem,
            presentacion: this.presentacionControl.value,
            nuevaCantidadRecibida: this.nuevaCantidadRecibida,
            nuevaCantidadRechazada: cantidadRechazadaTotal
          };
          const modalResult = await this.modalService.openModal(
            SeleccionarNotaItemRechazoDialogComponent,
            dialogData,
            ModalSize.MEDIUM
          );
          const itemSeleccionado = modalResult?.data;
          if (!itemSeleccionado) {
            return;
          }
          this.notaRecepcionItemSeleccionado = itemSeleccionado;
        }

        const notaRecepcionItem = this.notaRecepcionItemSeleccionado || notaRecepcionItems[0];
        notaRecepcionItemIdParaRechazo = notaRecepcionItem.id;
        if (this.itemRechazoList.length > 0) {
          motivoRechazoFinal = this.itemRechazoList[0].motivoRechazo;
        }
      }

      // 5. Llamada única al backend: verificarProductoMobile distribuye entre distribuciones
      try {
        const result = await (await this.recepcionMercaderiaService.onVerificarProductoMobile(
          this.data.recepcionMercaderia.id,
          this.selectedItem.producto.id,
          this.nuevaCantidadRecibida,
          cantidadRechazadaTotal,
          notaRecepcionItemIdParaRechazo,
          motivoRechazoFinal,
          MetodoVerificacion.MANUAL,
          this.mainService.usuarioActual.id
        ))
          .pipe(first())
          .toPromise();

        if (result) {
          this.modalService.closeModal({
            cantidadRecibida: this.nuevaCantidadRecibida,
            cantidadRechazada: cantidadRechazadaTotal
          });
        } else {
          this.notificacionService.warn('Error al guardar la recepción');
        }
      } catch (error) {
        console.error('Error al guardar recepción:', error);
        this.notificacionService.warn('Error al guardar la recepción: ' + (error?.message || 'Error desconocido'));
      }
    } catch (error) {
      console.error('Error al buscar NotaRecepcionItem:', error);
      this.notificacionService.warn('Error al buscar item de nota: ' + (error.message || 'Error desconocido'));
    }
  }

  private getCantidadPresentacionActual(presentacion?: Presentacion): number {
    if (this.esModoUnidadBase) {
      return 1;
    }
    const presentacionActual = presentacion || this.presentacionControl.value;
    const cantidad = presentacionActual?.cantidad;
    return cantidad && cantidad > 0 ? cantidad : 1;
  }

  private updateComputedProperties(): void {
    const cantidadPresentacion = this.getCantidadPresentacionActual();
    const totalARecibir = this.selectedItem?.totalCantidadARecibirPorUnidad || 0;
    const totalRecibida = this.selectedItem?.totalCantidadRecibidaPorUnidad || 0;
    const pendiente = this.selectedItem?.cantidadPendientePorUnidad != null
      ? this.selectedItem.cantidadPendientePorUnidad
      : (totalARecibir - totalRecibida - (this.selectedItem?.totalCantidadRechazadaPorUnidad || 0));

    this.unidadDisplayLabel = this.esModoUnidadBase ? 'unidad base' : 'presentación';
    this.cantidadARecibirDisplay = totalARecibir / cantidadPresentacion;
    this.cantidadRecibidaDisplay = (totalRecibida + this.nuevaCantidadRecibida) / cantidadPresentacion;
    this.cantidadFaltaDisplay = (pendiente - this.nuevaCantidadRecibida - this.nuevaCantidadRechazada) / cantidadPresentacion;
    this.cantidadRechazadaDisplay = this.nuevaCantidadRechazada / cantidadPresentacion;
    this.resumenCompletado = this.nuevaCantidadRechazada === 0 && this.nuevaCantidadRecibida > 0 && this.cantidadFaltaDisplay === 0;
  }

}
