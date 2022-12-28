import { Injectable } from '@angular/core';
import { FingerprintAIO } from '@ionic-native/fingerprint-aio/ngx';
import { Platform } from '@ionic/angular';

@Injectable({
  providedIn: 'root'
})
export class FingerprintAuthService {

  constructor(private faio: FingerprintAIO, private plf: Platform) { }

  showFingerprintDialog() {
    this.faio.isAvailable().then(() => {
      this.faio.show({}).then((res) => {
        alert(JSON.stringify(res))
      }, (error) => {
        alert(JSON.stringify(error))
      })
    }, (error) => {
      alert(JSON.stringify(error))
    })
  }
}
