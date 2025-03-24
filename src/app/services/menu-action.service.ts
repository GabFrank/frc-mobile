import { Injectable } from '@angular/core';
import { ActionSheetButton, ActionSheetController, ActionSheetOptions } from '@ionic/angular';

export interface ActionMenuData {
  texto: string;
  role: string;
  enabled?: boolean;
  class?: string;
}

@Injectable({
  providedIn: 'root'
})
export class MenuActionService {

  constructor(private actionControler: ActionSheetController) { }

  async presentActionSheet(opciones: ActionMenuData[]) {
    let actionButtons: ActionSheetButton[] = []
    opciones.forEach(e => {
      let btn: ActionSheetButton = {
        text: e.texto,
        role: e.role
      }
      if(e.enabled!=false){
        actionButtons.push(btn)
      }
    })
    actionButtons.push({ text: 'Cancelar', role: null, cssClass: 'cancelar-btn' })
    const actionSheet = await this.actionControler.create({
      header: 'Opciones',
      cssClass: 'action-menu',
      buttons: actionButtons,
      backdropDismiss: true,
      mode: "ios"
    });
    await actionSheet.present();
    return actionSheet.onDidDismiss()
  }
}
