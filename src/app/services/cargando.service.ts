import { Injectable } from '@angular/core';
import { LoadingController } from '@ionic/angular';

@Injectable({
  providedIn: 'root'
})
export class CargandoService {

  loading: HTMLIonLoadingElement;
  counter = 0;

  constructor(public loadingController: LoadingController) { }

  async open(texto?: string, dissmis?: boolean): Promise<HTMLIonLoadingElement> {
    if (this.loading != null) {
      await this.loading.dismiss().then(async ()=>{
        this.loading = await this.loadingController.create({
          cssClass: 'my-custom-class',
          message: texto,
          backdropDismiss: true
        });
        await this.loading.present();
      })
    } else {
      this.loading = await this.loadingController.create({
        cssClass: 'my-custom-class',
        message: texto,
        backdropDismiss: true
      });
      await this.loading.present();
    }

    return await this.loading;
  }

  async close() {
    setTimeout(async () => {
      if(this.loading!=undefined)
      await this.loading.dismiss();
    }, 500);
  }
}
