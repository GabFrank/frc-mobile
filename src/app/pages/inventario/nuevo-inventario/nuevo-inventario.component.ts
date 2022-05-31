import { NotificacionService } from 'src/app/services/notificacion.service';
import { Inventario } from './../inventario.model';
import { untilDestroyed } from '@ngneat/until-destroy';
import { descodificarQr, QrData } from './../../../generic/utils/qrUtils';
import { ModalService } from './../../../services/modal.service';
import { BarcodeScanner } from '@awesome-cordova-plugins/barcode-scanner/ngx';
import { InventarioService } from './../inventario.service';
import { Component, OnInit } from '@angular/core';
import { Location } from '@angular/common';

@Component({
  selector: 'app-nuevo-inventario',
  templateUrl: './nuevo-inventario.component.html',
  styleUrls: ['./nuevo-inventario.component.scss'],
  providers: [
    BarcodeScanner
  ]
})
export class NuevoInventarioComponent implements OnInit {

  selectedInventario: Inventario;

  constructor(
    private inventarioService: InventarioService,
    private barcodeScanner: BarcodeScanner,
    private modalService: ModalService,
    private notificacionService: NotificacionService
  ) { }

  ngOnInit() {

  }

  onScanQr() {
    this.barcodeScanner.scan().then(barcodeData => {
      if (barcodeData.text != null) {
        let qrData: QrData;
        qrData = descodificarQr(barcodeData.text)
        this.inventarioService.onGetInventarioAbiertoPorSucursal(qrData.sucursalId)
          .pipe(untilDestroyed(this))
          .subscribe(res => {
            if (res.length > 0) {
              this.selectedInventario = res[0];
              // this.notificacionService.
            }
          })
      } else {

      }
    })
  }

  onBack() {
    this.modalService.closeModal(null)
  }


}
