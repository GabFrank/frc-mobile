import { Component, Input, OnInit } from '@angular/core';
import { UntilDestroy } from '@ngneat/until-destroy';
import { Presentacion } from 'src/app/domains/productos/presentacion.model';
import { Producto } from 'src/app/domains/productos/producto.model';
import { ModalService } from 'src/app/services/modal.service';
import { NotificacionService } from 'src/app/services/notificacion.service';
import { DevolucionItemDraft, MotivoAveria } from '../devolucion.model';

export interface DevolucionItemDialogData {
  producto: Producto;
  presentacion: Presentacion;
  motivosAveria: MotivoAveria[];
}

@UntilDestroy()
@Component({
  selector: 'app-devolucion-item-dialog',
  templateUrl: './devolucion-item-dialog.component.html',
  styleUrls: ['./devolucion-item-dialog.component.scss'],
})
export class DevolucionItemDialogComponent implements OnInit {
  @Input()
  data: DevolucionItemDialogData;

  producto: Producto;
  presentaciones: Presentacion[] = [];
  motivosAveria: MotivoAveria[] = [];

  selectedPresentacionId: number;
  selectedMotivoAveriaId: number;
  cantidad: number = 1;
  lote: string;
  vencimiento: string;
  motivo: string;

  constructor(
    private modalService: ModalService,
    private notificacionService: NotificacionService
  ) {}

  ngOnInit() {
    this.producto = this.data?.producto;
    this.motivosAveria = this.data?.motivosAveria || [];
    this.presentaciones = this.producto?.presentaciones || [];
    if (this.data?.presentacion != null) {
      this.presentaciones = this.mergePresentacion(this.presentaciones, this.data.presentacion);
      this.selectedPresentacionId = this.data.presentacion.id;
    } else if (this.presentaciones.length > 0) {
      this.selectedPresentacionId = this.presentaciones[0].id;
    }
  }

  private mergePresentacion(list: Presentacion[], presentacion: Presentacion): Presentacion[] {
    const existe = list?.some((p) => p.id === presentacion.id);
    return existe ? list : [presentacion, ...(list || [])];
  }

  onGuardar() {
    if (this.selectedPresentacionId == null) {
      this.notificacionService.warn('Seleccione una presentación');
      return;
    }
    if (this.cantidad == null || this.cantidad <= 0) {
      this.notificacionService.warn('Ingrese una cantidad válida');
      return;
    }
    if (this.selectedMotivoAveriaId == null) {
      this.notificacionService.warn('Seleccione un motivo de avería');
      return;
    }

    const presentacion = this.presentaciones.find((p) => p.id === this.selectedPresentacionId);
    const motivoAveria = this.motivosAveria.find((m) => m.id === this.selectedMotivoAveriaId);

    const draft: DevolucionItemDraft = {
      producto: this.producto,
      presentacion,
      motivoAveria,
      cantidad: +this.cantidad,
      lote: this.lote ? this.lote.toUpperCase() : null,
      vencimiento: this.vencimiento || null,
      motivo: this.motivo ? this.motivo.toUpperCase() : null,
    };

    this.modalService.closeModal(draft);
  }

  onCancel() {
    this.modalService.closeModal(null);
  }
}
