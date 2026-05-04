import { Component, OnInit } from '@angular/core';
import { SolicitudGastosService } from '../../services/solicitud-gastos.service';
import { PreGasto } from '../../models/pre-gasto.model';
import { CalendarModal, CalendarModalOptions } from 'ion7-calendar';
import { ModalController, NavController } from '@ionic/angular';
import { PopOverService, PopoverSize } from '../../../../../services/pop-over.service';
import { QrGeneratorComponent } from '../../../../../components/qr-generator/qr-generator.component';

@Component({
  selector: 'app-list-solicitud-gastos',
  templateUrl: './list-solicitud-gastos.component.html',
  styleUrls: ['./list-solicitud-gastos.component.scss'],
})
export class ListSolicitudGastosComponent implements OnInit {

  solicitudes: PreGasto[] = [];
  cargando = false;
  pagina = 0;
  hayMas = false;
  
  fechaInicio: string = new Date().toISOString().split('T')[0];
  fechaFin: string = new Date().toISOString().split('T')[0];

  constructor(
    private solicitudService: SolicitudGastosService,
    private modalCtrl: ModalController,
    private navCtrl: NavController,
    private popoverService: PopOverService
  ) { }

  ngOnInit() {
    this.cargarSolicitudes();
  }

  async cargarSolicitudes(reset = true) {
    if (reset) {
      this.pagina = 0;
      this.solicitudes = [];
    }
    this.cargando = true;
    try {
      // Ajustamos las fechas para cubrir todo el día (00:00:00 a 23:59:59)
      const inicio = `${this.fechaInicio}T00:00:00`;
      const fin = `${this.fechaFin}T23:59:59`;
      
      const respuesta = await this.solicitudService.getMisSolicitudes(this.pagina, 15, inicio, fin);
      const nuevosItems = respuesta?.getContent ?? [];
      this.solicitudes = [...this.solicitudes, ...nuevosItems];
      this.hayMas = respuesta?.hasNext === true;
    } catch (error) {
      console.error('Error al cargar solicitudes', error);
    } finally {
      this.cargando = false;
    }
  }

  onRefresh(event: any) {
    this.cargarSolicitudes(true).then(() => {
      event.target.complete();
    });
  }

  onLoadMore(event: any) {
    if (this.hayMas) {
      this.pagina++;
      this.cargarSolicitudes(false).then(() => {
        event.target.complete();
      });
    } else {
      event.target.complete();
    }
  }

  onDateChange() {
    this.cargarSolicitudes(true);
  }

  onBack() {
    this.navCtrl.back();
  }

  async openCalendar() {
    const options: CalendarModalOptions = {
      pickMode: 'range',
      title: 'SELECCIONAR FECHA',
      monthFormat: 'MMMM yyyy',
      format: 'YYYY-MM-DD',
      doneLabel: 'LISTO',
      weekdays: ['LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB', 'DOM'],
      canBackwardsSelected: true,
      closeIcon: true,
      weekStart: 1,
      defaultScrollTo: this.fechaInicio ? new Date(this.fechaInicio) : new Date(),
      defaultDateRange: this.fechaInicio && this.fechaFin ? 
                        { from: new Date(this.fechaInicio), to: new Date(this.fechaFin) } : undefined
    };

    const myCalendar = await this.modalCtrl.create({
      component: CalendarModal,
      backdropDismiss: false,
      cssClass: 'myCalendar-class',
      componentProps: { options }
    });

    myCalendar.present();

    const event: any = await myCalendar.onDidDismiss();
    const date = event.data;
    if (date && date.from && date.to) {
      this.fechaInicio = date.from.string.split('T')[0];
      this.fechaFin = date.to.string.split('T')[0];
      this.cargarSolicitudes(true);
    }
  }

  getBadgeColor(estado: string): string {
    switch (estado) {
      case 'PENDIENTE': return 'warning';
      case 'AUTORIZADO': return 'success';
      case 'RECHAZADO': return 'danger';
      case 'COMPLETADO': return 'secondary';
      case 'TRAMITE': return 'primary';
      default: return 'medium';
    }
  }

  async onShowQR(id: number) {
    await this.popoverService.open(QrGeneratorComponent, id.toString(), PopoverSize.SM);
  }

}
