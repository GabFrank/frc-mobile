import { Injectable } from '@angular/core';
import { LoadingController } from '@ionic/angular';

@Injectable({
  providedIn: 'root'
})
export class CargandoService {

  loading: HTMLIonLoadingElement;

  constructor(public loadingController: LoadingController) { }

  async open(texto?: string, dissmis?: boolean): Promise<HTMLIonLoadingElement> {
    if (this.loading != null) {
      this.loading.dismiss()
    }
    this.loading = await this.loadingController.create({
      cssClass: 'my-custom-class',
      message: texto,
      backdropDismiss: dissmis
    });
    await this.loading.present();
    return this.loading;
  }

  async close() {
    setTimeout(async () => {
      await this.loading.dismiss();
    }, 500);
  }
}
