import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { RecepcionMercaderia } from '../../../../../domains/operaciones/pedido/recepcion-mercaderia.model';
import { Sucursal } from '../../../../../domains/empresarial/sucursal/sucursal.model';
import { NotaRecepcion } from '../../../../../domains/operaciones/pedido/nota-recepcion.model';
import { PedidoService } from '../../services/pedido.service';
import { ItemsPaginacionService } from '../../services/items-paginacion.service';
import { NotificacionService, TipoNotificacion } from '../../../../../services/notificacion.service';
import { CargandoService } from '../../../../../services/cargando.service';

@Component({
  selector: 'app-constancia-recepcion',
  templateUrl: './constancia-recepcion.page.html',
  styleUrls: ['./constancia-recepcion.page.scss']
})
export class ConstanciaRecepcionPage implements OnInit {

  recepcionId: number;
  sucursal: Sucursal;
  notas: NotaRecepcion[];
  fechaFinalizacion: Date;
  constancia: any = null;
  isLoading = false;
  fechaRecepcion = new Date();
  fechaFormateada: string;
  totalNotas: number;
  totalProductos: number;

  constructor(
    private router: Router,
    private pedidoService: PedidoService,
    private itemsPaginacionService: ItemsPaginacionService,
    private notificacionService: NotificacionService,
    private cargandoService: CargandoService
  ) {}

  ngOnInit() {
    // Obtener datos del estado de navegación
    const navigation = this.router.getCurrentNavigation();
    if (navigation?.extras?.state) {
      const state = navigation.extras.state as any;
      this.recepcionId = state.recepcionId;
      this.sucursal = state.sucursal;
      this.notas = state.notas;
      this.fechaFinalizacion = state.fechaFinalizacion || new Date();
      
      // Calcular propiedades precomputadas
      this.calcularPropiedades();
      
      // Cargar detalles de la constancia
      this.cargarConstancia();
    } else {
      // Si no hay estado, redirigir a la página anterior
      this.notificacionService.open('Error: No se pudo obtener la información de la constancia', TipoNotificacion.DANGER, 3);
      this.router.navigate(['/operaciones/pedidos/recepcion-mercaderia']);
    }
  }

  private calcularPropiedades() {
    this.fechaFormateada = this.getFechaFormateada();
    this.totalNotas = this.getTotalNotas();
    this.totalProductos = this.getTotalProductos();
  }

  private async cargarConstancia() {
    this.isLoading = true;
    
    try {
      // Usar servicio de paginación para obtener resúmenes sin cargar todos los items
      const notaIds = this.notas.map(n => n.id);
      this.itemsPaginacionService.obtenerResumenItems(notaIds).subscribe({
        next: (resumen) => {
          this.constancia = {
            id: this.recepcionId,
            numero: `CON-${this.recepcionId.toString().padStart(6, '0')}`,
            fecha: this.fechaRecepcion,
            estado: 'EMITIDA',
            totalProductos: resumen.totalItems,
            totalCantidad: resumen.totalCantidad
          };
        },
        error: (error) => {
          console.error('Error al obtener resumen de items:', error);
          // Fallback: crear constancia con datos básicos
          this.constancia = {
            id: this.recepcionId,
            numero: `CON-${this.recepcionId.toString().padStart(6, '0')}`,
            fecha: this.fechaRecepcion,
            estado: 'EMITIDA',
            totalProductos: 0,
            totalCantidad: 0
          };
        }
      });
      
      this.isLoading = false;
    } catch (error) {
      console.error('Error al cargar constancia:', error);
      this.notificacionService.open('Error al cargar la constancia', TipoNotificacion.DANGER, 3);
      this.isLoading = false;
    }
  }

  async onCompartir() {
    try {
      const loading = await this.cargandoService.open('Preparando para compartir...');
      
      // Usar GraphQL para generar PDF
      const result = await this.pedidoService.generarConstanciaRecepcionPDF(this.recepcionId);
      
      result.subscribe({
        next: (response: any) => {
          if (response?.data) {
            const pdfData = response.data;
            
            // Convertir base64 a blob
            const byteCharacters = atob(pdfData.pdfBase64);
            const byteNumbers = new Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++) {
              byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);
            const blob = new Blob([byteArray], { type: 'application/pdf' });
            
            // Crear archivo para compartir
            const file = new File([blob], pdfData.nombreArchivo, { type: 'application/pdf' });
            
            // Verificar si Web Share API está disponible
            if (navigator.share && navigator.canShare({ files: [file] })) {
              navigator.share({
                title: 'Constancia de Recepción',
                text: `Constancia de recepción ${this.constancia?.numero || this.recepcionId}`,
                files: [file]
              }).then(() => {
                this.notificacionService.open('Archivo compartido exitosamente', TipoNotificacion.SUCCESS, 2);
              }).catch(() => {
                // Fallback: copiar enlace al portapapeles
                this.copiarEnlacePortapapeles();
              });
            } else {
              // Fallback: copiar enlace al portapapeles
              this.copiarEnlacePortapapeles();
            }
          } else {
            this.notificacionService.open('Error: No se pudo generar el PDF', TipoNotificacion.DANGER, 3);
          }
          this.cargandoService.close(loading);
        },
        error: (error) => {
          console.error('Error al compartir:', error);
          this.notificacionService.open('Error al compartir', TipoNotificacion.DANGER, 3);
          this.cargandoService.close(loading);
        }
      });
      
    } catch (error) {
      console.error('Error al compartir:', error);
      this.notificacionService.open('Error al compartir', TipoNotificacion.DANGER, 3);
    }
  }

  private async copiarEnlacePortapapeles() {
    try {
      const fechaFormateada = this.fechaFinalizacion ? this.fechaFinalizacion.toLocaleDateString('es-ES') : 'fecha no disponible';
      await navigator.clipboard.writeText(`Constancia de recepción ${this.recepcionId} - Generada el ${fechaFormateada}`);
      this.notificacionService.open('Información copiada al portapapeles', TipoNotificacion.SUCCESS, 2);
    } catch (error) {
      this.notificacionService.open('Error al copiar al portapapeles', TipoNotificacion.DANGER, 3);
    }
  }

  async onImprimir() {
    try {
      const loading = await this.cargandoService.open('Preparando impresión...');
      
      // Usar GraphQL para generar PDF
      const result = await this.pedidoService.generarConstanciaRecepcionPDF(this.recepcionId);
      
      result.subscribe({
        next: (response: any) => {
          if (response?.data) {
            const pdfData = response.data;
            
            // Convertir base64 a blob
            const byteCharacters = atob(pdfData.pdfBase64);
            const byteNumbers = new Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++) {
              byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);
            const blob = new Blob([byteArray], { type: 'application/pdf' });
            
            // Crear URL del blob
            const blobUrl = URL.createObjectURL(blob);
            
            // Abrir en nueva ventana para impresión
            const printWindow = window.open(blobUrl);
            if (printWindow) {
              printWindow.print();
            }
            
            // Limpiar URL del blob
            setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
            
            this.notificacionService.open('Ventana de impresión abierta', TipoNotificacion.SUCCESS, 2);
          } else {
            this.notificacionService.open('Error: No se pudo generar el PDF', TipoNotificacion.DANGER, 3);
          }
          this.cargandoService.close(loading);
        },
        error: (error) => {
          console.error('Error al imprimir:', error);
          this.notificacionService.open('Error al preparar impresión', TipoNotificacion.DANGER, 3);
        }
      });
      
    } catch (error) {
      console.error('Error al imprimir:', error);
      this.notificacionService.open('Error al preparar impresión', TipoNotificacion.DANGER, 3);
    }
  }

  async onDescargarPDF() {
    try {
      const loading = await this.cargandoService.open('Generando PDF...');
      
      // Usar GraphQL para generar PDF
      const result = await this.pedidoService.generarConstanciaRecepcionPDF(this.recepcionId);
      
      result.subscribe({
        next: (response: any) => {
          if (response?.data) {
            const pdfData = response.data;
            
            // Convertir base64 a blob
            const byteCharacters = atob(pdfData.pdfBase64);
            const byteNumbers = new Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++) {
              byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);
            const blob = new Blob([byteArray], { type: 'application/pdf' });
            
            // Crear enlace de descarga
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = pdfData.nombreArchivo;
            link.target = '_blank';
            
            // Simular clic para iniciar descarga
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            // Limpiar URL del blob
            setTimeout(() => URL.revokeObjectURL(link.href), 1000);
            
            this.notificacionService.open('PDF generado exitosamente', TipoNotificacion.SUCCESS, 2);
          } else {
            this.notificacionService.open('Error: No se pudo generar el PDF', TipoNotificacion.DANGER, 3);
          }
          this.cargandoService.close(loading);
        },
        error: (error) => {
          console.error('Error al generar PDF:', error);
          this.notificacionService.open('Error al generar PDF', TipoNotificacion.DANGER, 3);
          this.cargandoService.close(loading);
        }
      });
      
    } catch (error) {
      console.error('Error al descargar PDF:', error);
      this.notificacionService.open('Error al generar PDF', TipoNotificacion.DANGER, 3);
    }
  }

  onNuevaRecepcion() {
    this.router.navigate(['/operaciones/pedidos/recepcion-mercaderia']);
  }

  onVolver() {
    this.router.navigate(['/operaciones']);
  }

  getFechaFormateada(): string {
    return this.fechaRecepcion.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getTotalNotas(): number {
    return this.notas?.length || 0;
  }

  getTotalProductos(): number {
    return this.constancia?.totalProductos || 0;
  }
} 