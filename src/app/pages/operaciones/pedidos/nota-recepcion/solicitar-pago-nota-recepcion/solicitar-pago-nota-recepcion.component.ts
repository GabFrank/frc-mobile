import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';
import { LoadingController, ToastController } from '@ionic/angular';
import { NotaRecepcionAgrupada } from '../nota-recepcion-agrupada/nota-recepcion-agrupada.model';
import { NotaRecepcionAgrupadaService } from '../nota-recepcion-agrupada/nota-recepcion-agrupada.service';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { NotaRecepcion } from '../nota-recepcion.model';
import { NotaRecepcionService } from '../nota-recepcion.service';

@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'app-solicitar-pago-nota-recepcion',
  templateUrl: './solicitar-pago-nota-recepcion.component.html',
  styleUrls: ['./solicitar-pago-nota-recepcion.component.scss']
})
export class SolicitarPagoNotaRecepcionComponent implements OnInit {
  notaRecepcionAgrupadaId: number;
  loading = false;
  selectedNotaRecepcionAgrupada: NotaRecepcionAgrupada;
  notaRecepcionList: NotaRecepcion[];

  constructor(
    private _route: ActivatedRoute,
    private _location: Location,
    private _loadingController: LoadingController,
    private _toastController: ToastController,
    private notaRecepcionAgrupadaService: NotaRecepcionAgrupadaService,
    private notaRecepcionService: NotaRecepcionService
  ) { }

  ngOnInit() {
    this.notaRecepcionAgrupadaId = +this._route.snapshot.paramMap.get('id');
    this.loadData();
  }

  async loadData() {
    if (!this.notaRecepcionAgrupadaId) {
      await this.showToast('ID de nota de recepción no proporcionado', 'danger');
      this.onBack();
      return;
    }

    this.loading = true;
    try {
      // Load nota recepcion agrupada details
      (await this.notaRecepcionAgrupadaService.onGetNotaRecepcionAgrupadaPorId(this.notaRecepcionAgrupadaId))
        .pipe(untilDestroyed(this))
        .subscribe(res => {
          this.selectedNotaRecepcionAgrupada = res;
          if (this.selectedNotaRecepcionAgrupada) {
            // Load related nota recepciones
            this.loadNotaRecepciones();
          } else {
            this.showToast('No se encontró la nota de recepción agrupada', 'warning');
          }
        }, error => {
          console.error('Error loading nota recepcion agrupada:', error);
          this.showToast('Error al cargar los datos', 'danger');
          this.loading = false;
        });
    } catch (error) {
      console.error('Error in loadData:', error);
      await this.showToast('Error al cargar los datos', 'danger');
      this.loading = false;
    }
  }

  async loadNotaRecepciones() {
    try {
      (await this.notaRecepcionService.onGetNotaRecepcionPorNotaRecepcionAgrupadaId(this.notaRecepcionAgrupadaId))
        .pipe(untilDestroyed(this))
        .subscribe(res => {
          this.notaRecepcionList = res;
          this.loading = false;
        }, error => {
          console.error('Error loading nota recepciones:', error);
          this.showToast('Error al cargar las notas de recepción', 'danger');
          this.loading = false;
        });
    } catch (error) {
      console.error('Error in loadNotaRecepciones:', error);
      await this.showToast('Error al cargar las notas de recepción', 'danger');
      this.loading = false;
    }
  }

  async showToast(message: string, color: string = 'primary') {
    const toast = await this._toastController.create({
      message,
      duration: 3000,
      color
    });
    toast.present();
  }

  onBack() {
    this._location.back();
  }

  async solicitarPago() {
    (await this.notaRecepcionAgrupadaService.onSolicitarPagoNotaRecepcionAgrupada(this.notaRecepcionAgrupadaId))
      .pipe(untilDestroyed(this))
      .subscribe(res => {
        this.showToast('Pago solicitado correctamente', 'success');
      });
  }
} 

//quede en el boton de solicitar pago, ahora tengo que crear la logica en el backend para gestionar la solicitud de pago