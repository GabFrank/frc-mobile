import { Component, OnInit } from '@angular/core';
import { BarcodeScanner } from '@awesome-cordova-plugins/barcode-scanner/ngx';
import { Platform } from '@ionic/angular';
import { stringToInteger } from 'src/app/generic/utils/numbersUtils';
import { descodificarQr } from 'src/app/generic/utils/qrUtils';
import { VentaCreditoService } from 'src/app/graphql/financiero/venta-credito/venta-credito.service';

@Component({
  selector: 'app-mis-finanzas-dashboard',
  templateUrl: './mis-finanzas-dashboard.component.html',
  styleUrls: ['./mis-finanzas-dashboard.component.scss'],
  providers: [BarcodeScanner]
})
export class MisFinanzasDashboardComponent implements OnInit {

  constructor(
    private barcodeScanner: BarcodeScanner,
    private plt: Platform,
    private ventaCreditoService: VentaCreditoService
  ) { }

  ngOnInit() { }

  async onQrConfirm() {
    if (this.plt.is("mobileweb")) {
    } else if (this.plt.is("android") || this.plt.is("iphone")) {
      this.barcodeScanner.scan().then(async res => {
        let data = descodificarQr(res['text']);
        let timestamp = stringToInteger(data.timestamp);
        (await this.ventaCreditoService.onVentaCreditoQrAuth(data.data, timestamp)).subscribe(res => {
          console.log(res);
        })
      })
    }
  }

}
