import { Injectable } from '@angular/core';
import { ModalController } from '@ionic/angular';

@Injectable({
  providedIn: 'root'
})
export class ModalService {
  currentModal;

  constructor(private modalController: ModalController) { }

  async openModal(component: any, data?, modalSize?: ModalSize): Promise<any> {
    let modalClass = 'my-custom-class';
    switch (modalSize) {
      case ModalSize.AUTO:
        modalClass = 'custom-modal';
        break;
      case ModalSize.LARGE:
        modalClass = 'custom-modal-large';
        break;
      case ModalSize.MEDIUM:
        modalClass = 'custom-modal-medium';
        break;
      case ModalSize.BIOMETRIC:
        modalClass = 'biometric-modal';
        break;
      default:
        break;
    }
    const modalOptions: any = {
      component: component,
      cssClass: modalClass,
      componentProps: {
        data
      }
    };

    if (modalSize === ModalSize.BIOMETRIC) {
      modalOptions.initialBreakpoint = 0.35;
      modalOptions.breakpoints = [0, 0.35];
      modalOptions.handle = false;
    }

    const modal = await this.modalController.create(modalOptions);
    await modal.present();
    this.currentModal = modal;
    return await modal.onWillDismiss();
  }

  closeModal(data) {
    this.modalController.dismiss(data);
  }
}

export enum ModalSize {
  LARGE,
  MEDIUM,
  AUTO,
  BIOMETRIC
}
