import { Injectable } from '@angular/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { FileOpener } from '@capacitor-community/file-opener';
import { NotificacionService, TipoNotificacion } from './notificacion.service';
import { CargandoService } from './cargando.service';

@Injectable({
    providedIn: 'root'
})
export class PdfViewerService {

    constructor(
        private notificacionService: NotificacionService,
        private cargandoService: CargandoService
    ) { }

    /**
     * Abre un PDF desde una cadena Base64 usando el visor nativo del dispositivo.
     * @param base64Data - El contenido del PDF en formato Base64 (sin el prefijo data:application/pdf;base64,)
     * @param fileName - Nombre del archivo para guardar (ej: 'reporte.pdf')
     */
    async openPdfFromBase64(base64Data: string, fileName: string): Promise<void> {
        const loading = await this.cargandoService.open('Generando y descargando el reporte, por favor espere...');

        try {
            // Guardar el archivo PDF en el directorio de caché
            const result = await Filesystem.writeFile({
                path: fileName,
                data: base64Data,
                directory: Directory.Cache,
            });

            // Obtener la ruta completa del archivo
            const filePath = result.uri;

            // Abrir el archivo con el visor nativo
            await FileOpener.open({
                filePath: filePath,
                contentType: 'application/pdf',
            });

            this.cargandoService.close(loading);
        } catch (error) {
            this.cargandoService.close(loading);
            console.error('Error al abrir el PDF:', error);

            // Intentar abrir en navegador como fallback
            try {
                const dataUrl = 'data:application/pdf;base64,' + base64Data;
                window.open(dataUrl, '_system');
                this.notificacionService.open('PDF abierto en navegador externo', TipoNotificacion.NEUTRAL, 2);
            } catch (fallbackError) {
                this.notificacionService.open('No se pudo abrir el PDF. Intente instalar un visor de PDF.', TipoNotificacion.DANGER, 3);
            }
        }
    }
}
