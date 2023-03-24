import { Component, OnInit } from '@angular/core';
import { BarcodeScanner } from '@awesome-cordova-plugins/barcode-scanner/ngx';
import { Platform } from '@ionic/angular';
import { stringToInteger } from 'src/app/generic/utils/numbersUtils';
import { descodificarQr } from 'src/app/generic/utils/qrUtils';
import { VentaCreditoService } from 'src/app/graphql/financiero/venta-credito/venta-credito.service';
import { MainService } from 'src/app/services/main.service';

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
    private ventaCreditoService: VentaCreditoService,
    private mainService: MainService
  ) { }

  ngOnInit() { }

  async onQrConfirm() {
    if (this.plt.is("mobileweb")) {
    } else if (this.plt.is("android") || this.plt.is("iphone")) {
      this.barcodeScanner.scan().then(async res => {
        let data = descodificarQr(res['text']);
        let idCliente = data.idOrigen
        let timestamp = stringToInteger(data.timestamp);
        let sucursalId = data.sucursalId;
        let secretKey = data.data
        console.log(idCliente,
          timestamp,
          sucursalId,
          secretKey);
        // (await this.ventaCreditoService.onVentaCreditoQrAuth(this.mainService.usuarioActual?.persona?.id, timestamp, sucursalId, data?.data['secretKey'])).subscribe(res => {
        //   console.log(res);
        // })
      })
    }
  }
}


