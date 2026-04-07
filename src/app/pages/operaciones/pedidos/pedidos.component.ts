import { Component, OnInit } from '@angular/core';
import { BarcodeScannerService } from 'src/app/services/barcode-scanner.service';
import { Router, ActivatedRoute } from '@angular/router';
import { descodificarQr, QrData } from 'src/app/generic/utils/qrUtils';
import { TipoEntidad } from 'src/app/domains/enums/tipo-entidad.enum';
import { RecepcionMercaderiaService } from './recepcion-mercaderia/recepcion-mercaderia.service';
import { MainService } from 'src/app/services/main.service';
import { NotificacionService, TipoNotificacion } from 'src/app/services/notificacion.service';
import { CargandoService } from 'src/app/services/cargando.service';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';

@UntilDestroy()
@Component({
  selector: 'app-pedidos',
  templateUrl: './pedidos.component.html',
  styleUrls: ['./pedidos.component.scss'],
  providers: []
})
export class PedidosComponent implements OnInit {

  constructor(
    private barcodeScannerService: BarcodeScannerService,
    private router: Router,
    private route: ActivatedRoute,
    private recepcionMercaderiaService: RecepcionMercaderiaService,
    private mainService: MainService,
    private notificacionService: NotificacionService,
    private cargandoService: CargandoService
  ) { }

  ngOnInit() {}

  async onScanQr() {
    let loading = await this.cargandoService.open('Abriendo cámara...')
    setTimeout(() => {
      this.cargandoService.close(loading)
    }, 1000);
    this.barcodeScannerService.scan().subscribe(async barcodeData => {
      if (!barcodeData.cancelled && barcodeData.text) {
        this.notificacionService.open('Escaneado con éxito!', TipoNotificacion.SUCCESS, 1)
        let codigo: string = barcodeData.text;
        let qrData: QrData = descodificarQr(codigo);
        if (qrData.tipoEntidad == TipoEntidad.RECEPCION_MERCADERIA && qrData.idCentral != null) {
          (await this.recepcionMercaderiaService.onGetRecepcionMercaderiaPorId(+qrData.idCentral))
            .pipe(untilDestroyed(this))
            .subscribe((res) => {
              if (res != null) {
                this.router.navigate(['/operaciones/pedidos/recepcion-producto', res.id]);
              } else {
                this.notificacionService.openItemNoEncontrado()
              }
            })
        } else {
          this.notificacionService.openItemNoEncontrado()
        }
      }
    });
  }

}
