import { Component, Input, OnInit } from '@angular/core';
import { NotaRecepcion } from '../nota-recepcion.model';
import { ModalService } from 'src/app/services/modal.service';

export class NotaRecepcionInfoDialogData {
  notaRecepcion: NotaRecepcion;
  index?: number;
}

@Component({
  selector: 'app-nota-recepcion-info-dialog',
  templateUrl: './nota-recepcion-info-dialog.component.html',
  styleUrls: ['./nota-recepcion-info-dialog.component.scss']
})
export class NotaRecepcionInfoDialogComponent implements OnInit {
  @Input()
  data: NotaRecepcionInfoDialogData;

  selectedNotaRecepcion: NotaRecepcion;
  isAdded = false;

  constructor(private modalService: ModalService) {}

  ngOnInit() {
    if (this.data?.notaRecepcion != null) {
      this.selectedNotaRecepcion = this.data.notaRecepcion;
    }
    if (this.data?.index != null) {
      this.isAdded = true;
    }
  }

  onCancelar() {
    this.modalService.closeModal(null);
  }
  onAgregar() {
    this.modalService.closeModal({
      agregar: true,
      item: this.selectedNotaRecepcion
    });
  }

  onEliminar() {
    this.modalService.closeModal({
      eliminar: true,
      item: this.selectedNotaRecepcion,
      index: this.data?.index
    });
  }
}
