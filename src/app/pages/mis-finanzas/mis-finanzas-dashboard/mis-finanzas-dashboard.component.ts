import { Component, OnInit } from '@angular/core';
import { BarcodeScannerService } from 'src/app/services/barcode-scanner.service';
import { Platform } from '@ionic/angular';
import { stringToInteger } from 'src/app/generic/utils/numbersUtils';
import { descodificarQr } from 'src/app/generic/utils/qrUtils';
import { VentaCreditoService } from 'src/app/graphql/financiero/venta-credito/venta-credito.service';
import { MainService } from 'src/app/services/main.service';

@Component({
  selector: 'app-mis-finanzas-dashboard',
  templateUrl: './mis-finanzas-dashboard.component.html',
  styleUrls: ['./mis-finanzas-dashboard.component.scss'],
  providers: []
})
export class MisFinanzasDashboardComponent implements OnInit {

  constructor(
    private barcodeScannerService: BarcodeScannerService,
    private plt: Platform,
    private ventaCreditoService: VentaCreditoService,
    private mainService: MainService
  ) { }

  ngOnInit() { }

  async onQrConfirm() {
    this.barcodeScannerService.scan().subscribe(async res => {
      if (!res.cancelled && res.text) {
        let data = descodificarQr(res.text);
        let idCliente = data.idOrigen
        let timestamp = stringToInteger(data.timestamp);
        let sucursalId = data.sucursalId;
        let secretKey = data.data;
        (await this.ventaCreditoService.onVentaCreditoQrAuth(this.mainService.usuarioActual?.persona?.id, timestamp, sucursalId, secretKey)).subscribe(res => {
          console.log(res);
        })
      }
    });
  }
}


