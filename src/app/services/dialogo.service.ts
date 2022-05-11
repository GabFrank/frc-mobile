import { Observable } from 'rxjs';
import { Injectable } from '@angular/core';
import { AlertController } from '@ionic/angular';

@Injectable({
  providedIn: 'root'
})
export class DialogoService {

  constructor(private alertController: AlertController) { }

  async open(titulo: string, texto: string, siNo?: boolean) : Promise<any>{
    let res = false;
    const alert = await this.alertController.create({
      header: titulo,
      message: texto,
      buttons: siNo == false ? [
        {
          text: 'Aceptar',
          role: 'aceptar',
          id: 'aceptar-button',
          handler: () => {
            return true;
          }
        }
      ] : [
        {
          text: 'No',
          role: 'cancelar',
          id: 'cancelar-button',
          handler: () => {
            return true;
          }
        },
        {
          text: 'Si',
          role: 'aceptar',
          id: 'aceptar-button',
          handler: () => {
            return true;
          }
        }
      ]
    });

    await alert.present();

    return alert.onDidDismiss()
  }
}
