import { Injectable } from '@angular/core';
import { ToastController } from '@ionic/angular';

export enum TipoNotificacion {
  SUCCESS = 'success',
  WARN = 'warning',
  DANGER = 'danger',
  NEUTRAL = 'light'
}

@Injectable({
  providedIn: 'root'
})
export class NotificacionService {

  constructor(public toastController: ToastController) { }

  async open(msg: string, tipoNotificacion: TipoNotificacion, duracion: number) {
    const toast = await this.toastController.create({
      message: msg,
      duration: duracion!=null ? duracion * 1000 : 2000,
      color: tipoNotificacion!=null ? tipoNotificacion : TipoNotificacion.NEUTRAL
    });
    toast.present();
  }

  openGuardadoConExito(){
    this.open('Guardado con éxito', TipoNotificacion.SUCCESS, 1)
  }

  openAlgoSalioMal(err?){
    this.open('Ups!! Algo salió mal: '+err, TipoNotificacion.DANGER, 2)
  }

  openItemNoEncontrado(){
    this.open('Item no encontrado', TipoNotificacion.WARN, 2)
  }

  openEliminadoConExito(){
    this.open('Eliminado con éxito', TipoNotificacion.SUCCESS, 2)
  }

  toast(text){
    this.open(text, TipoNotificacion.NEUTRAL, 2)
  }

  success(text){
    this.open(text, TipoNotificacion.SUCCESS, 2)
  }

  danger(text){
    this.open(text, TipoNotificacion.DANGER, 3)
  }

  warn(text){
    this.open(text, TipoNotificacion.WARN, 3)
  }





  // async presentToastWithOptions() {
  //   const toast = await this.toastController.create({
  //     header: 'Toast header',
  //     message: 'Click to Close',
  //     icon: 'information-circle',
  //     position: 'top',
  //     buttons: [
  //       {
  //         side: 'start',
  //         icon: 'star',
  //         text: 'Favorite',
  //         handler: () => {
  //           console.log('Favorite clicked');
  //         }
  //       }, {
  //         text: 'Done',
  //         role: 'cancel',
  //         handler: () => {
  //           console.log('Cancel clicked');
  //         }
  //       }
  //     ]
  //   });
  //   await toast.present();

  //   const { role } = await toast.onDidDismiss();
  //   console.log('onDidDismiss resolved with role', role);
  // }
}
