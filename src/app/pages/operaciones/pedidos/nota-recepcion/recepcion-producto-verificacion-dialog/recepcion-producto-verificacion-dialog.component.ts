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
import { NotaRecepcionItem } from '../../recepcion-mercaderia/graphql/notaRecepcionItemListPorNotaRecepcionId';

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
  
  // Para manejar múltiples NotaRecepcionItem del mismo producto
  notaRecepcionItemsDisponibles: NotaRecepcionItem[] = [];
  notaRecepcionItemSeleccionado: NotaRecepcionItem | null = null;
  notaRecepcionItemControl = new FormControl();
  mostrarSelectorNotaItem = false;

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

  /**
   * Distribuye cantidad recibida y rechazada entre notas cuando hay rechazos en una nota específica.
   * El rechazo se asigna íntegramente a la nota seleccionada; lo recibido se reparte entre todas.
   *
   * @param notaRecepcionItems Lista de NotaRecepcionItem del mismo producto
   * @param cantidadRecibidaTotal Cantidad total recibida en esta sesión
   * @param cantidadRechazadaTotal Cantidad total rechazada (va toda a la nota seleccionada)
   * @param notaRecepcionItemConRechazo Nota donde se registra el rechazo
   * @param motivoRechazo Motivo del rechazo
   * @returns Lista con notaRecepcionItemId, cantidadRecibida, cantidadRechazada y motivoRechazo
   */
  distribuirCantidadConRechazo(
    notaRecepcionItems: NotaRecepcionItem[],
    cantidadRecibidaTotal: number,
    cantidadRechazadaTotal: number,
    notaRecepcionItemConRechazo: NotaRecepcionItem,
    motivoRechazo: string | null
  ): Array<{
    notaRecepcionItemId: number;
    cantidadRecibida: number;
    cantidadRechazada: number;
    motivoRechazo: string | null;
  }> {
    const cantidadPendiente = (item: NotaRecepcionItem) =>
      Math.max(0, (item.cantidadEnNota || 0) - (item.cantidadRecibida || 0) - (item.cantidadRechazada || 0));

    const pendienteSelected = cantidadPendiente(notaRecepcionItemConRechazo);
    if (pendienteSelected < cantidadRechazadaTotal) {
      return [];
    }

    const resultado: Array<{
      notaRecepcionItemId: number;
      cantidadRecibida: number;
      cantidadRechazada: number;
      motivoRechazo: string | null;
    }> = [];

    const otrasNotas = notaRecepcionItems.filter(n => n.id !== notaRecepcionItemConRechazo.id);

    const capacidadRecibidoSelected = pendienteSelected - cantidadRechazadaTotal;
    const cantidadRecibidaSelected = Math.min(capacidadRecibidoSelected, cantidadRecibidaTotal);
    const cantidadRecibidaRestante = cantidadRecibidaTotal - cantidadRecibidaSelected;

    resultado.push({
      notaRecepcionItemId: notaRecepcionItemConRechazo.id,
      cantidadRecibida: cantidadRecibidaSelected,
      cantidadRechazada: cantidadRechazadaTotal,
      motivoRechazo
    });

    if (cantidadRecibidaRestante > 0 && otrasNotas.length > 0) {
      const distribucionOtras = this.distribuirCantidadEntreItems(otrasNotas, cantidadRecibidaRestante);
      for (const d of distribucionOtras) {
        resultado.push({
          notaRecepcionItemId: d.notaRecepcionItemId,
          cantidadRecibida: d.cantidadRecibida,
          cantidadRechazada: 0,
          motivoRechazo: null
        });
      }
    }

    return resultado;
  }

  /**
   * Distribuye la cantidad recibida proporcionalmente entre todos los NotaRecepcionItem pendientes
   * @param notaRecepcionItems Lista de todos los NotaRecepcionItem del mismo producto
   * @param cantidadTotalRecibida Cantidad total recibida a distribuir
   * @returns Lista de objetos con notaRecepcionItemId y cantidadRecibida para cada item
   */
  distribuirCantidadEntreItems(
    notaRecepcionItems: NotaRecepcionItem[],
    cantidadTotalRecibida: number
  ): Array<{ notaRecepcionItemId: number; cantidadRecibida: number }> {
    // Calcular cantidad pendiente por item
    const itemsConPendiente = notaRecepcionItems.map(item => {
      const cantidadRecibidaActual = item.cantidadRecibida || 0;
      const cantidadEnNota = item.cantidadEnNota || 0;
      const cantidadPendiente = cantidadEnNota - cantidadRecibidaActual;
      return {
        item,
        cantidadPendiente: Math.max(0, cantidadPendiente)
      };
    }).filter(item => item.cantidadPendiente > 0); // Solo items con cantidad pendiente

    if (itemsConPendiente.length === 0) {
      return [];
    }

    // Calcular total de cantidad pendiente
    const totalPendiente = itemsConPendiente.reduce(
      (sum, item) => sum + item.cantidadPendiente,
      0
    );

    if (totalPendiente === 0) {
      return [];
    }

    // Distribuir proporcionalmente
    const distribucion: Array<{ notaRecepcionItemId: number; cantidadRecibida: number }> = [];
    let cantidadDistribuida = 0;

    for (let i = 0; i < itemsConPendiente.length; i++) {
      const { item, cantidadPendiente } = itemsConPendiente[i];
      
      let cantidadParaEsteItem: number;
      
      if (i === itemsConPendiente.length - 1) {
        // Último item: asignar el resto para evitar errores de redondeo
        cantidadParaEsteItem = cantidadTotalRecibida - cantidadDistribuida;
      } else {
        // Distribución proporcional
        cantidadParaEsteItem = (cantidadPendiente / totalPendiente) * cantidadTotalRecibida;
        // Redondear a 2 decimales
        cantidadParaEsteItem = Math.round(cantidadParaEsteItem * 100) / 100;
      }

      // Asegurar que no exceda la cantidad pendiente del item
      cantidadParaEsteItem = Math.min(cantidadParaEsteItem, cantidadPendiente);
      
      // Asegurar que no exceda la cantidad total disponible
      cantidadParaEsteItem = Math.min(
        cantidadParaEsteItem,
        cantidadTotalRecibida - cantidadDistribuida
      );

      distribucion.push({
        notaRecepcionItemId: item.id,
        cantidadRecibida: cantidadParaEsteItem
      });

      cantidadDistribuida += cantidadParaEsteItem;
    }

    return distribucion;
  }

  async onGuardar() {
    try {
      // 1. Calcular cantidades totales
      const cantidadRechazadaTotal = this.calcularCantidadRechazada();
      const cantidadEsperada = this.selectedItem.totalCantidadARecibirPorUnidad;
      const cantidadRecibidaAnterior = this.selectedItem.totalCantidadRecibidaPorUnidad || 0;
      const cantidadRechazadaAnterior = this.selectedItem.totalCantidadRechazadaPorUnidad || 0;
      // Cantidad pendiente para esta sesión = total esperado - ya recibido - ya rechazado
      const cantidadPendienteParaSesion = cantidadEsperada - cantidadRecibidaAnterior - cantidadRechazadaAnterior;

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

      // 4. Buscar TODOS los NotaRecepcionItem por productoId y recepcionMercaderiaId
      const notaRecepcionItemsObs = await this.recepcionMercaderiaService
        .onBuscarNotaRecepcionItemsPorProductoYRecepcion(
          this.data.recepcionMercaderia.id,
          this.selectedItem.producto.id
        );
      
      const notaRecepcionItems = await notaRecepcionItemsObs
        .pipe(first())
        .toPromise();

      if (!notaRecepcionItems || notaRecepcionItems.length === 0) {
        this.notificacionService.warn('No se encontró el item de nota de recepción');
        return;
      }

      // 5. Determinar si hay rechazos
      const hayRechazos = cantidadRechazadaTotal > 0;
      const cantidadCompleta = this.nuevaCantidadRecibida + cantidadRechazadaTotal === cantidadPendienteParaSesion;

      // 6. Lógica de distribución automática vs selector
      if (hayRechazos) {
        // CASO: Hay rechazos - mostrar selector para elegir qué nota tiene el rechazo
        if (notaRecepcionItems.length > 1 && !this.notaRecepcionItemSeleccionado) {
          this.notaRecepcionItemsDisponibles = notaRecepcionItems;
          this.mostrarSelectorNotaItem = true;
          this.notificacionService.warn(
            `Hay ${notaRecepcionItems.length} items de nota para este producto. ` +
            'Por favor seleccione cuál recibirá el rechazo para mantener la trazabilidad.'
          );
          return;
        }

        // Determinar qué item usar para el rechazo
        let notaRecepcionItem: NotaRecepcionItem;
        if (this.notaRecepcionItemSeleccionado) {
          notaRecepcionItem = this.notaRecepcionItemSeleccionado;
        } else if (notaRecepcionItems.length === 1) {
          notaRecepcionItem = notaRecepcionItems[0];
        } else {
          // Si hay múltiples pero no se seleccionó, usar el primero
          notaRecepcionItem = notaRecepcionItems[0];
          this.notificacionService.warn(
            'Se usará el primer item de nota encontrado. Para mantener trazabilidad, seleccione el item correcto.'
          );
        }

        // Determinar motivo de rechazo
        let motivoRechazoFinal: string = null;
        if (this.itemRechazoList.length > 0) {
          motivoRechazoFinal = this.itemRechazoList[0].motivoRechazo;
        }

        // Distribuir recibido y rechazado por nota (rechazo solo en la nota seleccionada)
        const distribucionConRechazo = this.distribuirCantidadConRechazo(
          notaRecepcionItems,
          this.nuevaCantidadRecibida,
          cantidadRechazadaTotal,
          notaRecepcionItem,
          motivoRechazoFinal
        );

        if (distribucionConRechazo.length === 0) {
          this.notificacionService.warn(
            'La nota seleccionada no tiene cantidad pendiente suficiente para el rechazo indicado. ' +
            'Seleccione otra nota o verifique las cantidades.'
          );
          return;
        }

        let itemsGuardados = 0;
        let errores = 0;

        for (const itemDistribucion of distribucionConRechazo) {
          const input: RecepcionMercaderiaItemInput = {
            id: null,
            recepcionMercaderiaId: this.data.recepcionMercaderia.id,
            notaRecepcionItemId: itemDistribucion.notaRecepcionItemId,
            notaRecepcionItemDistribucionId: null,
            productoId: this.selectedItem.producto.id,
            presentacionRecibidaId: this.selectedPresentacion?.id,
            sucursalEntregaId: this.data.recepcionMercaderia.sucursalRecepcion.id,
            usuarioId: this.mainService.usuarioActual.id,
            cantidadRecibida: itemDistribucion.cantidadRecibida,
            cantidadRechazada: itemDistribucion.cantidadRechazada,
            vencimientoRecibido: null,
            lote: null,
            esBonificacion: false,
            motivoRechazo: itemDistribucion.motivoRechazo,
            observaciones: null,
            metodoVerificacion: MetodoVerificacion.MANUAL,
            motivoVerificacionManual: null,
            estadoVerificacion: null,
            variaciones: []
          };

          try {
            const result = await (await this.recepcionMercaderiaService.onSaveRecepcionMercaderiaItem(input))
              .pipe(first())
              .toPromise();
            if (result) {
              itemsGuardados++;
            } else {
              errores++;
            }
          } catch (error) {
            console.error('Error al guardar recepción:', error);
            errores++;
          }
        }

        if (errores === 0) {
          this.notificacionService.success(
            itemsGuardados > 1
              ? `Se distribuyó la recepción entre ${itemsGuardados} nota(s) con trazabilidad de rechazo`
              : 'Recepción guardada correctamente'
          );
          this.modalService.closeModal({
            cantidadRecibida: this.nuevaCantidadRecibida,
            cantidadRechazada: cantidadRechazadaTotal
          });
        } else {
          this.notificacionService.warn(
            `Se guardaron ${itemsGuardados} item(s), pero hubo ${errores} error(es)`
          );
        }
      } else if (cantidadCompleta && !hayRechazos) {
        // CASO: Sin rechazos y cantidad completa - distribución automática
        if (notaRecepcionItems.length === 1) {
          // Solo un item: guardar directamente
          const notaRecepcionItem = notaRecepcionItems[0];
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

          (await this.recepcionMercaderiaService.onSaveRecepcionMercaderiaItem(input)).subscribe(
            res => {
              if (res) {
                this.modalService.closeModal({
                  cantidadRecibida: this.nuevaCantidadRecibida,
                  cantidadRechazada: 0
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
        } else {
          // Múltiples items: distribuir automáticamente
          const distribucion = this.distribuirCantidadEntreItems(
            notaRecepcionItems,
            this.nuevaCantidadRecibida
          );

          if (distribucion.length === 0) {
            this.notificacionService.warn('No hay items pendientes para distribuir la cantidad recibida');
            return;
          }

          // Guardar cada item en secuencia
          let itemsGuardados = 0;
          let errores = 0;

          for (const itemDistribucion of distribucion) {
            const input: RecepcionMercaderiaItemInput = {
              id: null,
              recepcionMercaderiaId: this.data.recepcionMercaderia.id,
              notaRecepcionItemId: itemDistribucion.notaRecepcionItemId,
              notaRecepcionItemDistribucionId: null,
              productoId: this.selectedItem.producto.id,
              presentacionRecibidaId: this.selectedPresentacion?.id,
              sucursalEntregaId: this.data.recepcionMercaderia.sucursalRecepcion.id,
              usuarioId: this.mainService.usuarioActual.id,
              cantidadRecibida: itemDistribucion.cantidadRecibida,
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

            try {
              const result = await (await this.recepcionMercaderiaService.onSaveRecepcionMercaderiaItem(input))
                .pipe(first())
                .toPromise();
              
              if (result) {
                itemsGuardados++;
              } else {
                errores++;
              }
            } catch (error) {
              console.error('Error al guardar item de recepción:', error);
              errores++;
            }
          }

          if (errores === 0) {
            this.notificacionService.success(
              `Se distribuyó automáticamente la recepción entre ${itemsGuardados} nota(s)`
            );
            this.modalService.closeModal({
              cantidadRecibida: this.nuevaCantidadRecibida,
              cantidadRechazada: 0
            });
          } else {
            this.notificacionService.warn(
              `Se guardaron ${itemsGuardados} items, pero hubo ${errores} error(es)`
            );
          }
        }
      } else {
        // CASO: Cantidad incompleta sin rechazo (no debería llegar aquí por la validación anterior)
        this.notificacionService.warn(
          'La cantidad recibida no coincide con la esperada. Debe agregar un rechazo para la cantidad faltante.'
        );
      }
    } catch (error) {
      console.error('Error al buscar NotaRecepcionItem:', error);
      this.notificacionService.warn('Error al buscar item de nota: ' + (error.message || 'Error desconocido'));
    }
  }

  onSeleccionarNotaRecepcionItem() {
    const itemSeleccionado = this.notaRecepcionItemControl.value;
    if (itemSeleccionado) {
      this.notaRecepcionItemSeleccionado = itemSeleccionado;
      this.mostrarSelectorNotaItem = false;
      // Continuar con el guardado
      this.onGuardar();
    }
  }

  onCancelarSeleccionNotaItem() {
    this.mostrarSelectorNotaItem = false;
    this.notaRecepcionItemSeleccionado = null;
    this.notaRecepcionItemControl.setValue(null);
  }

  getDisplayTextForNotaItem(item: NotaRecepcionItem): string {
    if (!item) return '';
    const notaNumero = item.notaRecepcion?.numero || item.notaRecepcion?.id || 'N/A';
    const cantidad = item.cantidadEnNota || 0;
    return `Nota ${notaNumero} - ${cantidad} unidades`;
  }
}
