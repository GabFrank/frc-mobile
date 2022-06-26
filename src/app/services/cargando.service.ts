import { Injectable } from '@angular/core';
import { LoadingController, LoadingOptions } from '@ionic/angular';
// import { NgxSpinnerService } from 'ngx-spinner';

export interface CargandoData {
  id: any,
  loading: HTMLIonLoadingElement;
}

@Injectable({
  providedIn: 'root'
})
export class CargandoService {

  counter = 0;

  constructor(public loadingController: LoadingController,
  ) { }

  async open(texto?, disable?): Promise<HTMLIonLoadingElement> {
    let loading = await this.loadingController.create(
      {
        id: new Date().getTime() + '',
        message: texto,
        backdropDismiss: true,

      }
    )
    await loading.present()
    console.log('abriendo', loading.message, loading.id)
    return loading;
  }

  close(loading: HTMLIonLoadingElement) {
    setTimeout(() => {
      console.log('cerrando', loading.message, loading.id)
      loading.dismiss()
    }, 500);
  }
}
