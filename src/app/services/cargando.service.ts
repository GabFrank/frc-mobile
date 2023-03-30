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

  async open(texto?, disable?, duration?): Promise<HTMLIonLoadingElement> {
    let loading = await this.loadingController.create(
      {
        id: new Date().getTime() + '',
        message: texto,
        backdropDismiss: disable == null ? true : disable,
        duration: duration
      }
    )
    await loading.present()
    return loading;
  }

  close(loading: HTMLIonLoadingElement) {
    setTimeout(() => {
      loading.dismiss()
    }, 500);
  }
}
