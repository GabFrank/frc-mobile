import { Injectable } from '@angular/core';
import { ModalController } from '@ionic/angular';

@Injectable({
  providedIn: 'root'
})
export class ModalService {

  currentModal;

  constructor(private modalController: ModalController) { }

  async openModal(component: any, data?): Promise<any> {
    const modal =  await this.modalController.create({
      component: component,
      cssClass: 'my-custom-class',
      componentProps: {
        data
      }
    });
    await modal.present();
    this.currentModal = modal;
    return await modal.onWillDismiss();
  }

  closeModal(data){
    this.modalController.dismiss(data)
  }
}


