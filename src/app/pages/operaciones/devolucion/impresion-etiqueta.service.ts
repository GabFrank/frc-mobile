import { Injectable } from '@angular/core';
import { first } from 'rxjs/operators';
import { DialogoService } from 'src/app/services/dialogo.service';
import { NotificacionService } from 'src/app/services/notificacion.service';
import { PdfViewerService } from 'src/app/services/pdf-viewer.service';
import { DevolucionService } from './devolucion.service';

/**
 * Impresion de etiquetas de identificacion tras separar una devolucion.
 * Reutiliza el PDF A4 (base64) que ya genera el backend y lo abre con el visor
 * del SO (que permite imprimir), igual que el boton imprimir de transferencias.
 */
@Injectable({
  providedIn: 'root',
})
export class ImpresionEtiquetaService {
  constructor(
    private devolucionService: DevolucionService,
    private dialogoService: DialogoService,
    private pdfViewerService: PdfViewerService,
    private notificacionService: NotificacionService
  ) {}

  /** Pregunta si imprimir y, si acepta, baja el PDF de etiquetas y lo abre. */
  async preguntarEImprimir(devolucionId: number): Promise<void> {
    if (devolucionId == null) return;
    const res = await this.dialogoService.open(
      'Imprimir etiquetas',
      '¿Imprimir el PDF de etiquetas de identificación?',
      true
    );
    if (res?.role !== 'aceptar') return;
    (await this.devolucionService.onGetEtiquetasSeparadoPdf(devolucionId))
      .pipe(first())
      .subscribe(async (base64) => {
        if (base64) {
          await this.pdfViewerService.openPdfFromBase64(
            base64,
            `etiquetas_devolucion_${devolucionId}.pdf`
          );
        } else {
          this.notificacionService.warn('No se pudo generar el PDF de etiquetas');
        }
      });
  }
}
