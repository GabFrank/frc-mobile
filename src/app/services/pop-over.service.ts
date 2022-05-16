import { PopoverController } from '@ionic/angular';
import { Injectable } from '@angular/core';

export enum PopoverSize {
  SM = 'popover-sm',
  MD = 'popover-md',
  XS = 'popover-xs'
}

@Injectable({
  providedIn: 'root'
})
export class PopOverService {

  currentPopover: HTMLIonPopoverElement

  constructor(private popoverController: PopoverController) { }

  async open(component, data?, size?: PopoverSize, extraStyle?): Promise<any>{
    const popover = await this.popoverController.create({
      component: component,
      cssClass: size,
      translucent: true,
      componentProps: {
        data
      }
    });
    await popover.present();
    this.currentPopover = popover;
    return await popover.onDidDismiss();
  }

  close(data?){
    this.currentPopover.dismiss(data)
  }
}
