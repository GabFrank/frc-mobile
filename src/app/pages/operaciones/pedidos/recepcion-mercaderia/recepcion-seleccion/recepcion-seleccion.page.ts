import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ModalController, AlertController } from '@ionic/angular';
import { ValidacionUbicacionComponent } from '../components/validacion-ubicacion/validacion-ubicacion.component';
import { MainService } from '../../../../../services/main.service';
import { PedidoService } from '../../services/pedido.service';
import { NotificacionService, TipoNotificacion } from '../../../../../services/notificacion.service';

@Component({
  selector: 'app-recepcion-seleccion',
  templateUrl: './recepcion-seleccion.page.html',
  styleUrls: ['./recepcion-seleccion.page.scss'],
})
export class RecepcionSeleccionPage implements OnInit {
  ubicacionValidada = false;
  sucursalValidada: any = null;
  cargando = false;
  recepcionesVigentes: any[] = [];
  tieneRecepcionesVigentes = false;

  constructor(
    private router: Router,
    private modalController: ModalController,
    private mainService: MainService,
    private pedidoService: PedidoService,
    private notificacionService: NotificacionService,
    private alertController: AlertController
  ) {}

  ngOnInit() {
    this.onValidarUbicacion();
  }

  async onValidarUbicacion() {
    const modal = await this.modalController.create({
      component: ValidacionUbicacionComponent,
      componentProps: {},
      backdropDismiss: false
    });

    modal.onDidDismiss().then(async (result) => {
      if (result.data) {
        this.sucursalValidada = result.data;
        this.ubicacionValidada = true;
        this.verificarRecepcionesVigentes();
        
        this.notificacionService.open(
          `Ubicación validada: ${this.sucursalValidada.nombre}`,
          TipoNotificacion.SUCCESS,
          2
        );
      }
    });

    return await modal.present();
  }

  private async verificarRecepcionesVigentes() {
    if (!this.sucursalValidada || !this.mainService.usuarioActual?.id) {
      return;
    }

    try {
      this.cargando = true;
      const resultObservable = await this.pedidoService.getRecepcionesVigentes(
        this.sucursalValidada.id,
        this.mainService.usuarioActual.id
      );
      
      resultObservable.subscribe({
        next: (result) => {
          if (result?.getContent && result.getContent.length > 0) {
            this.recepcionesVigentes = result.getContent;
            this.tieneRecepcionesVigentes = true;
          } else {
            this.recepcionesVigentes = [];
            this.tieneRecepcionesVigentes = false;
          }
          this.cargando = false;
        },
        error: (error) => {
          this.notificacionService.open(
            'Error al obtener recepciones vigentes',
            TipoNotificacion.DANGER,
            5
          );
          this.cargando = false;
        }
      });
    } catch (error) {
      this.notificacionService.open(
        'Error al verificar recepciones vigentes',
        TipoNotificacion.DANGER,
        5
      );
      this.cargando = false;
    }
  }

  onCrearNuevaRecepcion() {
    this.router.navigate(['/operaciones/pedidos/recepcion-mercaderia'], {
      state: {
        sucursal: this.sucursalValidada,
        esNuevaRecepcion: true
      }
    });
  }

  onVerHistorialRecepciones() {
    this.notificacionService.open(
      'Funcionalidad de historial completo en desarrollo',
      TipoNotificacion.NEUTRAL,
      3
    );
  }

  continuarRecepcionVigente(recepcion: any) {
    this.router.navigate(['/operaciones/pedidos/recepcion-agrupada'], {
      state: {
        recepcionId: recepcion.id,
        sucursal: this.sucursalValidada,
        esContinuacion: true
      }
    });
  }
}
