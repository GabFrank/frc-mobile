import { Component, OnInit } from '@angular/core';
import { MisConfiguracionesNotificacionQueryService } from '../graphql/mis-configuraciones-notificacion-query.service';
import { ActualizarPreferenciaNotificacionMutationService } from '../graphql/actualizar-preferencia-notificacion-mutation.service';
import { ConfiguracionNotificacion } from '../models/notificacion.model';
import { ToastController, LoadingController } from '@ionic/angular';

@Component({
  selector: 'app-preferencias',
  templateUrl: './preferencias.component.html',
  styleUrls: ['./preferencias.component.scss'],
})
export class PreferenciasComponent implements OnInit {

  configuraciones: ConfiguracionNotificacion[] = [];
  loading = false;

  constructor(
    private misConfiguracionesQuery: MisConfiguracionesNotificacionQueryService,
    private actualizarMutation: ActualizarPreferenciaNotificacionMutationService,
    private toastController: ToastController,
    private loadingController: LoadingController
  ) { }

  ngOnInit() {
    this.cargarConfiguraciones();
  }

  cargarConfiguraciones() {
    this.loading = true;
    this.misConfiguracionesQuery.watch().valueChanges.subscribe(result => {
      this.configuraciones = result.data.misConfiguracionesNotificacion;
      this.loading = false;
    }, err => {
      this.loading = false;
      console.error(err);
    });
  }

  async onToggleChange(event: any, config: ConfiguracionNotificacion) {
    if (config.esObligatorio) {
      event.target.checked = true;
      return;
    }

    const nuevoEstado = event.detail.checked;

    this.actualizarMutation.mutate({
      tipoNotificacion: config.tipo,
      habilitado: nuevoEstado
    }).subscribe(async res => {
      if (res.data?.actualizarPreferenciaNotificacion) {
        config.habilitado = nuevoEstado;
      } else {
        event.target.checked = !nuevoEstado;
        const toast = await this.toastController.create({
          message: 'No se pudo actualizar la preferencia',
          duration: 2000,
          color: 'danger'
        });
        toast.present();
      }
    }, async err => {
      event.target.checked = !nuevoEstado;
      console.error(err);
      const toast = await this.toastController.create({
        message: 'Error de conexión',
        duration: 2000,
        color: 'danger'
      });
      toast.present();
    });
  }

}
