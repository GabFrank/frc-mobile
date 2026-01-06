import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { Chart, registerables } from 'chart.js';
import { VentaService } from 'src/app/graphql/operaciones/venta/venta.service';
import { MainService } from 'src/app/services/main.service';
import { untilDestroyed, UntilDestroy } from '@ngneat/until-destroy';
import * as moment from 'moment';
import { ModalController } from '@ionic/angular';
import { CalendarModal, CalendarModalOptions } from 'ion7-calendar';

Chart.register(...registerables);

@UntilDestroy()
@Component({
  selector: 'app-venta-dia',
  templateUrl: './venta-dia.component.html',
  styleUrls: ['./venta-dia.component.scss'],
})
export class VentaDiaComponent implements OnInit, AfterViewInit {
  @ViewChild('pieChart') pieChartCanvas: ElementRef;

  chart: any;
  loading = true;
  totalVentasGs = 0;
  ventasPorSucursal: any[] = [];
  selectedRange: { fechaInicio: string | null, fechaFin: string | null } = { fechaInicio: null, fechaFin: null };

  constructor(
    private ventaService: VentaService,
    private mainService: MainService,
    private modalCtrl: ModalController
  ) {
    const hoy = moment().format('YYYY-MM-DD');
    this.selectedRange = {
      fechaInicio: hoy,
      fechaFin: hoy
    };
  }

  ngOnInit() { }

  ngAfterViewInit() {
    this.loadData();
  }

  loadData() {
    const usuarioId = this.mainService.usuarioActual?.id;
    if (!usuarioId) return;

    this.loading = true;

    const inicio = this.selectedRange.fechaInicio + ' 00:00';
    const fin = this.selectedRange.fechaFin + ' 23:59';

    this.ventaService.onGetVentasPorSucursalAndUsuario(usuarioId, inicio, fin)
      .pipe(untilDestroyed(this))
      .subscribe(res => {
        this.loading = false;
        if (res) {
          this.ventasPorSucursal = res;
          this.totalVentasGs = res.reduce((acc, curr) => acc + curr.total, 0);
          setTimeout(() => {
            if (this.ventasPorSucursal.length > 0) this.createChart();
          }, 100);
        } else {
          this.ventasPorSucursal = [];
          this.totalVentasGs = 0;
        }
      });
  }

  async openCalendar() {
    const options: CalendarModalOptions = {
      pickMode: 'range',
      title: 'SELECCIONAR FECHA',
      monthFormat: 'MMMM yyyy',
      format: 'YYYY-MM-DD',
      doneLabel: 'LISTO',
      weekdays: ['DOM', 'LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB'],
      canBackwardsSelected: true,
      closeIcon: true,
      weekStart: 1,
      defaultScrollTo: this.selectedRange?.fechaInicio ? new Date(this.selectedRange.fechaInicio + 'T12:00:00') : new Date(),
      defaultDateRange: this.selectedRange?.fechaInicio && this.selectedRange.fechaFin ?
        { from: new Date(this.selectedRange.fechaInicio + 'T12:00:00'), to: new Date(this.selectedRange.fechaFin + 'T12:00:00') } : undefined
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
      this.selectedRange = {
        fechaInicio: date.from.string.split('T')[0],
        fechaFin: date.to.string.split('T')[0]
      };
      this.loadData();
    }
  }

  createChart() {
    if (this.chart) {
      this.chart.destroy();
    }

    const labels = this.ventasPorSucursal.map(v => v.nombre);
    const data = this.ventasPorSucursal.map(v => v.total);
    const colors = [
      '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40', '#FF5733', '#C70039'
    ];

    this.chart = new Chart(this.pieChartCanvas.nativeElement, {
      type: 'pie',
      data: {
        labels: labels,
        datasets: [{
          data: data,
          backgroundColor: colors,
          hoverOffset: 4
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              color: 'white'
            }
          }
        }
      }
    });
  }
}
