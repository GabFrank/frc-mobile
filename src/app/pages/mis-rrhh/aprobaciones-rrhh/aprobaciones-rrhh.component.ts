import { Component, OnInit } from '@angular/core';
import { AlertController } from '@ionic/angular';
import { MainService } from 'src/app/services/main.service';
import { NotificacionService, TipoNotificacion } from 'src/app/services/notificacion.service';
import { RrhhMobileService } from 'src/app/graphql/rrhh/rrhh-mobile.service';

@Component({
  selector: 'app-aprobaciones-rrhh',
  templateUrl: './aprobaciones-rrhh.component.html',
  styleUrls: ['./aprobaciones-rrhh.component.scss']
})
export class AprobacionesRrhhComponent implements OnInit {

  segmento = 'vacaciones';
  vacacionesPendientes: any[] = [];
  valesPendientes: any[] = [];

  constructor(
    private rrhhService: RrhhMobileService,
    private mainService: MainService,
    private alertController: AlertController,
    private notificacionService: NotificacionService
  ) { }

  ngOnInit() {
    this.cargarVacaciones();
    this.cargarVales();
  }

  onSegmentChange() {
    if (this.segmento === 'vacaciones') { this.cargarVacaciones(); }
    else { this.cargarVales(); }
  }

  async cargarVacaciones() {
    (await this.rrhhService.onGetVacacionesPendientes()).subscribe(res => { this.vacacionesPendientes = res || []; });
  }

  async cargarVales() {
    (await this.rrhhService.onGetValesPendientes()).subscribe(res => { this.valesPendientes = res || []; });
  }

  async aprobar(periodo: any) {
    const alert = await this.alertController.create({
      header: 'Aprobar vacaciones',
      message: '¿Aprobar el período del ' + periodo.fechaDesde + ' al ' + periodo.fechaHasta + '?',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Aprobar',
          handler: async () => {
            (await this.rrhhService.onAprobarVacacion(periodo.id, this.mainService.usuarioActual?.id)).subscribe(res => {
              if (res != null) {
                this.notificacionService.open('Vacaciones aprobadas', TipoNotificacion.SUCCESS, 2);
                this.cargarVacaciones();
              }
            });
          }
        }
      ]
    });
    await alert.present();
  }
}
