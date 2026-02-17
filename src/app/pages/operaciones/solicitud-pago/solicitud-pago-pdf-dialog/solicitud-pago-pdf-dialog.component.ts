import { Component, Input, OnInit } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ModalService } from 'src/app/services/modal.service';
import { NotificacionService } from 'src/app/services/notificacion.service';
import { Filesystem, Directory } from '@capacitor/filesystem';

export interface SolicitudPagoPdfDialogData {
  pdfBase64: string;
  nombreArchivo: string;
}

@Component({
  selector: 'app-solicitud-pago-pdf-dialog',
  templateUrl: './solicitud-pago-pdf-dialog.component.html',
  styleUrls: ['./solicitud-pago-pdf-dialog.component.scss']
})
export class SolicitudPagoPdfDialogComponent implements OnInit {
  @Input() data: SolicitudPagoPdfDialogData;

  pdfUrl: SafeResourceUrl;
  downloading = false;

  constructor(
    private modalService: ModalService,
    private sanitizer: DomSanitizer,
    private notificacionService: NotificacionService
  ) {}

  ngOnInit() {
    if (this.data?.pdfBase64) {
      this.pdfUrl = this.sanitizer.bypassSecurityTrustResourceUrl(
        'data:application/pdf;base64,' + this.data.pdfBase64
      );
    }
  }

  onCerrar() {
    this.modalService.closeModal(null);
  }

  async onDescargar() {
    if (!this.data?.pdfBase64 || !this.data?.nombreArchivo) {
      this.notificacionService.danger('No hay PDF para descargar');
      return;
    }
    this.downloading = true;
    try {
      const base64Data = this.data.pdfBase64;
      const fileName = this.data.nombreArchivo || 'solicitud-pago.pdf';
      await Filesystem.writeFile({
        path: fileName,
        data: base64Data,
        directory: Directory.Documents,
        recursive: true
      });
      this.notificacionService.success('PDF guardado en Documentos');
    } catch (e) {
      console.error('Error al guardar PDF', e);
      this.notificacionService.danger('No se pudo guardar el archivo. ' + (e?.message || ''));
    } finally {
      this.downloading = false;
    }
  }
}
