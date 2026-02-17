import { Component, Input, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { ModalController } from '@ionic/angular';
import { NotaRecepcionItem } from '../../recepcion-mercaderia/graphql/notaRecepcionItemListPorNotaRecepcionId';
import { PedidoRecepcionProductoDto } from '../nota-recepcion-agrupada/pedido-recepcion-producto-dto.model';
import { Presentacion } from 'src/app/domains/productos/presentacion.model';

export interface SeleccionarNotaItemRechazoDialogData {
  notaRecepcionItemsDisponibles: NotaRecepcionItem[];
  selectedItem: PedidoRecepcionProductoDto;
  presentacion: Presentacion;
  nuevaCantidadRecibida: number;
  nuevaCantidadRechazada: number;
}

@Component({
  selector: 'app-seleccionar-nota-item-rechazo-dialog',
  templateUrl: './seleccionar-nota-item-rechazo-dialog.component.html',
  styleUrls: ['./seleccionar-nota-item-rechazo-dialog.component.scss']
})
export class SeleccionarNotaItemRechazoDialogComponent implements OnInit {
  @Input()
  data: SeleccionarNotaItemRechazoDialogData;

  notaRecepcionItemControl = new FormControl();

  cantidadPorPresentacionRecibir = 0;
  cantidadPorPresentacionRecibida = 0;
  cantidadPorPresentacionFalta = 0;
  cantidadPorPresentacionRechazar = 0;

  notaItemsConDisplayText: { item: NotaRecepcionItem; displayText: string }[] = [];

  constructor(private modalCtrl: ModalController) {}

  ngOnInit() {
    this.updateComputedProperties();
  }

  private updateComputedProperties() {
    const item = this.data?.selectedItem;
    const pres = this.data?.presentacion;
    if (!item || !pres?.cantidad) {
      return;
    }
    this.cantidadPorPresentacionRecibir = (item.totalCantidadARecibirPorUnidad || 0) / pres.cantidad;
    const totalRecibido = (item.totalCantidadRecibidaPorUnidad || 0) + (this.data?.nuevaCantidadRecibida || 0);
    this.cantidadPorPresentacionRecibida = totalRecibido / pres.cantidad;
    const pendiente = (item.totalCantidadARecibirPorUnidad || 0) -
      (item.totalCantidadRecibidaPorUnidad || 0) -
      (this.data?.nuevaCantidadRecibida || 0) -
      (this.data?.nuevaCantidadRechazada || 0);
    this.cantidadPorPresentacionFalta = Math.max(0, pendiente) / pres.cantidad;
    this.cantidadPorPresentacionRechazar = (this.data?.nuevaCantidadRechazada || 0) / pres.cantidad;

    this.notaItemsConDisplayText = (this.data?.notaRecepcionItemsDisponibles || []).map(item => ({
      item,
      displayText: this.buildDisplayTextForNotaItem(item)
    }));
  }

  private buildDisplayTextForNotaItem(item: NotaRecepcionItem): string {
    if (!item) return '';
    const notaNumero = item.notaRecepcion?.numero || item.notaRecepcion?.id || 'N/A';
    const cantidad = item.cantidadEnNota || 0;
    return `Nota ${notaNumero} - ${cantidad} unidades`;
  }

  onCancelar() {
    this.modalCtrl.dismiss(null);
  }

  onContinuar() {
    const itemSeleccionado = this.notaRecepcionItemControl.value;
    if (itemSeleccionado) {
      this.modalCtrl.dismiss(itemSeleccionado);
    }
  }
}
