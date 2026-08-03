import { Component, OnInit } from '@angular/core';
import { AlertController } from '@ionic/angular';
import { MainService } from 'src/app/services/main.service';
import { PdfViewerService } from 'src/app/services/pdf-viewer.service';
import { NotificacionService, TipoNotificacion } from 'src/app/services/notificacion.service';
import { RrhhMobileService } from 'src/app/graphql/rrhh/rrhh-mobile.service';

@Component({
  selector: 'app-mis-rrhh-dashboard',
  templateUrl: './mis-rrhh-dashboard.component.html',
  styleUrls: ['./mis-rrhh-dashboard.component.scss']
})
export class MisRrhhDashboardComponent implements OnInit {

  usuarioId: number = null;
  resumen: any = null;
  segmento = 'recibos';

  recibos: any[] = [];
  vales: any[] = [];
  vacaciones: any[] = [];
  marcaciones: any[] = [];

  constructor(
    private rrhhService: RrhhMobileService,
    private mainService: MainService,
    private pdfViewerService: PdfViewerService,
    private alertController: AlertController,
    private notificacionService: NotificacionService
  ) { }

  ngOnInit() {
    this.usuarioId = this.mainService.usuarioActual?.id;
    if (this.usuarioId == null) { return; }
    this.cargarResumen();
    this.cargarRecibos();
  }

  async cargarResumen() {
    (await this.rrhhService.onGetResumen(this.usuarioId)).subscribe(res => { this.resumen = res; });
  }

  onSegmentChange() {
    if (this.segmento === 'recibos') { this.cargarRecibos(); }
    else if (this.segmento === 'vales') { this.cargarVales(); }
    else if (this.segmento === 'vacaciones') { this.cargarVacaciones(); }
    else if (this.segmento === 'marcaciones') { this.cargarMarcaciones(); }
  }

  async cargarMarcaciones() {
    (await this.rrhhService.onGetMarcaciones(this.usuarioId)).subscribe(res => { this.marcaciones = res || []; });
  }

  async cargarRecibos() {
    (await this.rrhhService.onGetRecibos(this.usuarioId)).subscribe(res => { this.recibos = res || []; });
  }

  async cargarVales() {
    (await this.rrhhService.onGetVales(this.usuarioId)).subscribe(res => { this.vales = res || []; });
  }

  async cargarVacaciones() {
    (await this.rrhhService.onGetVacaciones(this.usuarioId)).subscribe(res => { this.vacaciones = res || []; });
  }

  async verRecibo(recibo: any) {
    (await this.rrhhService.onImprimirRecibo(recibo.id)).subscribe((base64: string) => {
      if (!base64) {
        this.notificacionService.open('No se pudo generar el recibo', TipoNotificacion.DANGER, 3);
        return;
      }
      const limpio = base64.startsWith('data:') ? base64.substring(base64.indexOf(',') + 1) : base64;
      this.pdfViewerService.openPdfFromBase64(limpio, 'recibo-' + recibo.periodo + '.pdf');
    });
  }

  async solicitarVale() {
    const alert = await this.alertController.create({
      header: 'Solicitar vale',
      inputs: [
        { name: 'monto', type: 'number', placeholder: 'Monto' },
        { name: 'esAdelanto', type: 'checkbox', label: 'Es adelanto', value: 'si' }
      ],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Solicitar',
          handler: async (data) => {
            const monto = Number(data.monto);
            if (!monto || monto <= 0) {
              this.notificacionService.open('Ingrese un monto válido', TipoNotificacion.WARN, 2);
              return;
            }
            const esAdelanto = Array.isArray(data.esAdelanto) ? data.esAdelanto.length > 0 : !!data.esAdelanto;
            (await this.rrhhService.onSolicitarVale(this.usuarioId, monto, esAdelanto)).subscribe(res => {
              if (res != null) {
                this.notificacionService.open('Vale solicitado', TipoNotificacion.SUCCESS, 2);
                this.cargarVales(); this.cargarResumen();
              }
            });
          }
        }
      ]
    });
    await alert.present();
  }

  async solicitarVacacion() {
    const alert = await this.alertController.create({
      header: 'Solicitar vacaciones',
      inputs: [
        { name: 'desde', type: 'date', label: 'Desde' },
        { name: 'hasta', type: 'date', label: 'Hasta' }
      ],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Solicitar',
          handler: async (data) => {
            if (!data.desde || !data.hasta) {
              this.notificacionService.open('Ingrese las fechas', TipoNotificacion.WARN, 2);
              return;
            }
            (await this.rrhhService.onSolicitarVacacion(this.usuarioId, data.desde, data.hasta)).subscribe(res => {
              if (res != null) {
                this.notificacionService.open('Vacaciones solicitadas', TipoNotificacion.SUCCESS, 2);
                this.cargarVacaciones(); this.cargarResumen();
              }
            });
          }
        }
      ]
    });
    await alert.present();
  }
}
